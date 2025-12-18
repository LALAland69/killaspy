import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-signature, x-cron-timestamp",
};

const FACEBOOK_ACCESS_TOKEN = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Filter for 2025 ads only
const AD_DELIVERY_DATE_MIN_BASE = "2025-01-01";

// ============= DETAILED LOGGING HELPERS =============

interface FacebookErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_user_msg?: string;
    error_user_title?: string;
    fbtrace_id?: string;
    is_transient?: boolean;
  };
}

interface FacebookAPILog {
  timestamp: string;
  function: string;
  action: string;
  request?: {
    keyword?: string;
    country?: string;
    dateMin?: string;
    adActiveStatus?: string;
    limit?: number;
    urlMasked?: string;
  };
  response?: {
    status?: number;
    statusText?: string;
    responseTimeMs?: number;
    headers?: Record<string, string>;
    dataCount?: number;
    hasNextPage?: boolean;
    body?: unknown;
    error?: FacebookErrorResponse["error"];
  };
  tokenInfo?: {
    configured: boolean;
    length?: number;
    prefix?: string;
  };
  message?: string;
}

function logFacebookAPI(log: FacebookAPILog): void {
  console.log(`[FB-API] ${JSON.stringify(log, null, 2)}`);
}

function maskToken(token: string | undefined): string {
  if (!token) return "NOT_CONFIGURED";
  if (token.length < 20) return "INVALID_LENGTH";
  return `${token.substring(0, 10)}...${token.substring(token.length - 5)}`;
}

function extractRelevantHeaders(headers: Headers): Record<string, string> {
  const relevant: Record<string, string> = {};
  const keysToExtract = [
    "x-fb-trace-id",
    "x-fb-request-id", 
    "x-fb-rev",
    "x-fb-debug",
    "retry-after",
    "x-app-usage",
    "x-ad-account-usage",
    "content-type",
    "www-authenticate",
  ];
  
  keysToExtract.forEach(key => {
    const value = headers.get(key);
    if (value) {
      relevant[key] = value;
    }
  });
  
  return relevant;
}

function parseFacebookError(responseBody: unknown): FacebookErrorResponse["error"] | undefined {
  if (typeof responseBody === "object" && responseBody !== null) {
    const body = responseBody as FacebookErrorResponse;
    return body.error;
  }
  return undefined;
}

function getErrorExplanation(errorCode?: number, subcode?: number): string {
  // Facebook error codes reference
  const errorMap: Record<number, string> = {
    1: "Unknown error - try again later",
    2: "Service temporarily unavailable",
    4: "API too many calls - rate limit exceeded",
    10: "Application does not have permission",
    17: "User request limit reached",
    100: "Invalid parameter",
    102: "Session invalid - token may have expired or been revoked",
    104: "Incorrect signature",
    190: "Invalid OAuth access token",
    200: "Permission denied - missing required permission",
    294: "Access denied - app not authorized",
    341: "Application limit reached",
    368: "Temporarily blocked for policies violation",
    459: "Session is invalid - user needs to log in again",
    463: "Session expired - token has expired",
    467: "Invalid access token - token is malformed",
  };
  
  // Subcodes for 190 errors
  const subcode190Map: Record<number, string> = {
    458: "User has not authorized application",
    459: "Session is invalid (user logged out or changed password)",
    460: "Session is invalid (password changed)",
    463: "Access token has expired",
    464: "Session is invalid (user uninstalled app)",
    467: "Invalid access token (token malformed)",
  };
  
  if (errorCode === 190 && subcode && subcode190Map[subcode]) {
    return subcode190Map[subcode];
  }
  
  return errorMap[errorCode || 0] || "Unknown error code";
}

// Log token status at startup
function logTokenStatus(): void {
  const log: FacebookAPILog = {
    timestamp: new Date().toISOString(),
    function: "harvest-ads",
    action: "token_validation",
    tokenInfo: {
      configured: !!FACEBOOK_ACCESS_TOKEN,
      length: FACEBOOK_ACCESS_TOKEN?.length,
      prefix: FACEBOOK_ACCESS_TOKEN?.substring(0, 10),
    },
    message: FACEBOOK_ACCESS_TOKEN 
      ? `Token configured (${FACEBOOK_ACCESS_TOKEN.length} chars)` 
      : "❌ TOKEN NOT CONFIGURED",
  };
  logFacebookAPI(log);
}

// HMAC signature verification for cron job calls
async function verifyCronSignature(
  signature: string | null,
  timestamp: string | null,
  body: string
): Promise<boolean> {
  if (!signature || !timestamp) {
    return false;
  }
  
  // Reject requests older than 5 minutes (anti-replay)
  const requestTime = parseInt(timestamp, 10);
  const now = Date.now();
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 300000) {
    console.warn("Request timestamp too old or invalid");
    return false;
  }
  
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) {
    console.error("Service role key not configured");
    return false;
  }
  
  // Create HMAC signature: timestamp + body
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const message = `${timestamp}.${body}`;
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );
  
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  // Constant-time comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  
  return result === 0;
}

// Verify JWT token from Supabase auth
async function verifyJWT(authHeader: string | null): Promise<{ valid: boolean; userId?: string }> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false };
  }
  
  const token = authHeader.substring(7);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { valid: false };
  }
  
  return { valid: true, userId: user.id };
}

// Input validation
function validateUUID(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function validateIncrementalHours(value: unknown): number {
  const num = typeof value === "number" ? value : parseInt(String(value), 10);
  if (isNaN(num) || num < 1 || num > 168) { // Max 1 week
    return 6; // Default
  }
  return num;
}

interface FacebookAd {
  id: string;
  ad_creation_time?: string;
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  page_id?: string;
  page_name?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_titles?: string[];
  ad_snapshot_url?: string;
  languages?: string[];
  publisher_platforms?: string[];
  estimated_audience_size?: { lower_bound: number; upper_bound: number };
  impressions?: { lower_bound: number; upper_bound: number };
  spend?: { lower_bound: number; upper_bound: number };
  bylines?: string;
}

function formatDateForFacebook(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getIncrementalStartDate(hoursBack: number = 6): string {
  const date = new Date();
  date.setHours(date.getHours() - hoursBack);
  return formatDateForFacebook(date);
}

async function fetchAdsPage(
  keyword: string,
  country: string,
  adActiveStatus: "ALL" | "ACTIVE" | "INACTIVE",
  dateMin: string,
  limit: number = 100,
  afterCursor?: string
): Promise<{ ads: FacebookAd[]; nextCursor?: string }> {
  const requestStartTime = Date.now();
  
  // Check token before making request
  if (!FACEBOOK_ACCESS_TOKEN) {
    logFacebookAPI({
      timestamp: new Date().toISOString(),
      function: "harvest-ads",
      action: "fetch_ads_page_error",
      message: "❌ FACEBOOK_ACCESS_TOKEN not configured - cannot make API call",
      tokenInfo: { configured: false },
    });
    return { ads: [] };
  }

  // Use v21.0 - more stable and current version
  const baseUrl = "https://graph.facebook.com/v21.0/ads_archive";
  const countriesArray = JSON.stringify([country]);
  
  const params = new URLSearchParams({
    access_token: FACEBOOK_ACCESS_TOKEN,
    search_terms: keyword,
    ad_active_status: adActiveStatus,
    ad_delivery_date_min: dateMin,
    fields: "id,ad_creation_time,ad_delivery_start_time,ad_delivery_stop_time,page_id,page_name,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_snapshot_url,languages,publisher_platforms,estimated_audience_size,impressions,spend,bylines",
    limit: limit.toString(),
  });

  // Add countries as properly encoded array
  let url = `${baseUrl}?${params}&ad_reached_countries=${encodeURIComponent(countriesArray)}`;

  if (afterCursor) {
    url += `&after=${encodeURIComponent(afterCursor)}`;
  }

  // Create masked URL for logging (hide token)
  const maskedUrl = url.replace(FACEBOOK_ACCESS_TOKEN, maskToken(FACEBOOK_ACCESS_TOKEN));

  // Log pre-request details
  logFacebookAPI({
    timestamp: new Date().toISOString(),
    function: "harvest-ads",
    action: "fetch_ads_page_request",
    request: {
      keyword,
      country,
      dateMin,
      adActiveStatus,
      limit,
      urlMasked: maskedUrl,
    },
    tokenInfo: {
      configured: true,
      length: FACEBOOK_ACCESS_TOKEN.length,
      prefix: FACEBOOK_ACCESS_TOKEN.substring(0, 10),
    },
  });

  try {
    const response = await fetch(url);
    const responseTimeMs = Date.now() - requestStartTime;
    const responseHeaders = extractRelevantHeaders(response.headers);
    
    // Read response body as text first
    const responseText = await response.text();
    let responseBody: unknown;
    
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = { rawText: responseText.substring(0, 500) };
    }
    
    // Log response details
    const responseLog: FacebookAPILog = {
      timestamp: new Date().toISOString(),
      function: "harvest-ads",
      action: response.ok ? "fetch_ads_page_success" : "fetch_ads_page_error",
      request: { keyword, country, dateMin },
      response: {
        status: response.status,
        statusText: response.statusText,
        responseTimeMs,
        headers: responseHeaders,
      },
    };

    if (!response.ok) {
      // DETAILED ERROR LOGGING
      const fbError = parseFacebookError(responseBody);
      
      responseLog.response!.body = responseBody;
      responseLog.response!.error = fbError;
      responseLog.message = fbError 
        ? `❌ Facebook API Error: [${fbError.code}${fbError.error_subcode ? '.' + fbError.error_subcode : ''}] ${fbError.message} - ${getErrorExplanation(fbError.code, fbError.error_subcode)}`
        : `❌ Facebook API Error: HTTP ${response.status} ${response.statusText}`;
      
      logFacebookAPI(responseLog);
      
      // Additional structured error for support
      console.error(`
========================================
🔴 FACEBOOK API ERROR - SUPPORT INFO
========================================
Timestamp: ${new Date().toISOString()}
Request: keyword="${keyword}", country="${country}"
HTTP Status: ${response.status} ${response.statusText}
Response Time: ${responseTimeMs}ms

Facebook Error Code: ${fbError?.code || 'N/A'}
Facebook Error Subcode: ${fbError?.error_subcode || 'N/A'}
Error Type: ${fbError?.type || 'N/A'}
Error Message: ${fbError?.message || 'N/A'}
User Message: ${fbError?.error_user_msg || 'N/A'}
FB Trace ID: ${fbError?.fbtrace_id || responseHeaders['x-fb-trace-id'] || 'N/A'}
Is Transient: ${fbError?.is_transient || 'N/A'}

Explanation: ${getErrorExplanation(fbError?.code, fbError?.error_subcode)}

Token Info:
- Length: ${FACEBOOK_ACCESS_TOKEN.length} characters
- Prefix: ${FACEBOOK_ACCESS_TOKEN.substring(0, 10)}...
- Suffix: ...${FACEBOOK_ACCESS_TOKEN.substring(FACEBOOK_ACCESS_TOKEN.length - 5)}

Full Response Body:
${JSON.stringify(responseBody, null, 2)}

Relevant Headers:
${JSON.stringify(responseHeaders, null, 2)}
========================================
`);
      
      // CRITICAL: Throw exceptions for token/permission errors instead of silent failure
      const criticalTokenErrors = [102, 190, 463, 467, 459];
      const permissionErrors = [10, 200, 294];
      const rateLimitErrors = [4, 17, 341];
      
      if (fbError?.code && criticalTokenErrors.includes(fbError.code)) {
        throw new Error(`[TOKEN_ERROR] Code ${fbError.code}: ${fbError.message || 'Token invalid or expired'}. Check FACEBOOK_ACCESS_TOKEN secret.`);
      }
      
      if (fbError?.code && permissionErrors.includes(fbError.code)) {
        throw new Error(`[PERMISSION_ERROR] Code ${fbError.code}: ${fbError.message || 'Missing required permission'}. Ensure ads_read permission is approved.`);
      }
      
      if (fbError?.code && rateLimitErrors.includes(fbError.code)) {
        throw new Error(`[RATE_LIMIT] Code ${fbError.code}: ${fbError.message || 'Rate limit exceeded'}. Try again later.`);
      }
      
      // For transient errors (code 1, 2), return empty to allow retry on next run
      if (fbError?.code === 1 || fbError?.code === 2 || fbError?.is_transient) {
        console.warn(`Transient error (code ${fbError?.code}), returning empty to allow retry`);
        return { ads: [] };
      }
      
      // For unknown errors, throw to mark job as failed
      throw new Error(`[FB_API_ERROR] HTTP ${response.status}: ${fbError?.message || response.statusText}`);
    }

    // Success case
    const result = responseBody as { data?: FacebookAd[]; paging?: { cursors?: { after?: string } } };
    responseLog.response!.dataCount = result.data?.length || 0;
    responseLog.response!.hasNextPage = !!result.paging?.cursors?.after;
    responseLog.message = `✅ Got ${result.data?.length || 0} ads for "${keyword}" in ${country}`;
    
    logFacebookAPI(responseLog);
    
    return {
      ads: result.data || [],
      nextCursor: result.paging?.cursors?.after,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - requestStartTime;
    
    // Network/parsing error
    logFacebookAPI({
      timestamp: new Date().toISOString(),
      function: "harvest-ads",
      action: "fetch_ads_page_exception",
      request: { keyword, country, dateMin },
      response: { responseTimeMs },
      message: `❌ Exception: ${error instanceof Error ? error.message : String(error)}`,
    });
    
    console.error(`
========================================
🔴 FETCH EXCEPTION - SUPPORT INFO
========================================
Timestamp: ${new Date().toISOString()}
Request: keyword="${keyword}", country="${country}"
Response Time: ${responseTimeMs}ms
Error Type: ${error instanceof Error ? error.constructor.name : typeof error}
Error Message: ${error instanceof Error ? error.message : String(error)}
Stack: ${error instanceof Error ? error.stack : 'N/A'}
========================================
`);
    
    return { ads: [] };
  }
}

async function fetchAllAdsForKeyword(
  keyword: string,
  country: string,
  dateMin: string,
  maxAds: number = 1000
): Promise<FacebookAd[]> {
  const allAds: FacebookAd[] = [];
  let afterCursor: string | undefined;
  const limit = 100;

  console.log(`Fetching ALL ads (active+inactive) for "${keyword}" in ${country} since ${dateMin}`);

  while (allAds.length < maxAds) {
    const { ads, nextCursor } = await fetchAdsPage(
      keyword, 
      country, 
      "ALL", // Get both active AND inactive
      dateMin, 
      limit, 
      afterCursor
    );

    if (ads.length === 0) break;
    
    allAds.push(...ads);
    console.log(`  Collected ${allAds.length} ads so far...`);

    if (!nextCursor || ads.length < limit) break;
    
    afterCursor = nextCursor;
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`Total collected for "${keyword}" in ${country}: ${allAds.length} ads`);
  return allAds;
}

async function processAndStoreAds(
  ads: FacebookAd[],
  tenantId: string,
  categoryId: string,
  supabase: any
): Promise<{ imported: number; updated: number; errors: number }> {
  let imported = 0;
  let updated = 0;
  let errors = 0;

  console.log(`Processing ${ads.length} ads for storage...`);

  for (const ad of ads) {
    try {
      // Check if advertiser exists
      let advertiserId: string | null = null;
      if (ad.page_id) {
        const { data: existingAdvertiser } = await supabase
          .from("advertisers")
          .select("id")
          .eq("page_id", ad.page_id)
          .eq("tenant_id", tenantId)
          .single();

        if (existingAdvertiser) {
          advertiserId = existingAdvertiser.id;
        } else {
          const { data: newAdvertiser, error: advError } = await supabase
            .from("advertisers")
            .insert({
              tenant_id: tenantId,
              name: ad.page_name || "Unknown",
              page_id: ad.page_id,
            })
            .select("id")
            .single();

          if (!advError && newAdvertiser) {
            advertiserId = newAdvertiser.id;
          }
        }
      }

      // Check if ad already exists
      const { data: existingAd } = await supabase
        .from("ads")
        .select("id")
        .eq("ad_library_id", ad.id)
        .eq("tenant_id", tenantId)
        .single();

      // Determine status based on delivery stop time
      const isInactive = ad.ad_delivery_stop_time && new Date(ad.ad_delivery_stop_time) < new Date();

      const adData = {
        ad_library_id: ad.id,
        tenant_id: tenantId,
        advertiser_id: advertiserId,
        category_id: categoryId,
        page_name: ad.page_name,
        headline: ad.ad_creative_link_titles?.[0] || null,
        primary_text: ad.ad_creative_bodies?.[0] || null,
        cta: ad.ad_creative_link_captions?.[0] || null,
        start_date: ad.ad_delivery_start_time || ad.ad_creation_time || null,
        end_date: ad.ad_delivery_stop_time || null,
        language: ad.languages?.[0] || null,
        status: isInactive ? "inactive" : "active",
        media_url: ad.ad_snapshot_url || null,
        // Detect media type from snapshot URL
        media_type: ad.ad_snapshot_url?.includes("video") ? "video" : "image",
      };

      if (existingAd) {
        const { error } = await supabase
          .from("ads")
          .update({ ...adData, updated_at: new Date().toISOString() })
          .eq("id", existingAd.id);

        if (error) {
          errors++;
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase.from("ads").insert(adData);

        if (error) {
          errors++;
        } else {
          imported++;
        }
      }
    } catch (error) {
      errors++;
    }
  }

  console.log(`Processed: ${imported} imported, ${updated} updated, ${errors} errors`);
  return { imported, updated, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Log token status at start of every request
  logTokenStatus();
  console.log(`[harvest-ads] Request received at ${new Date().toISOString()}`);

  try {
    // Read body once for auth verification and parsing
    const bodyText = await req.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    
    // Authentication: Check cron secret (scheduled) or JWT (user)
    const cronSecretRaw = req.headers.get("x-cron-secret");
    const cronSecret = cronSecretRaw?.trim();
    const authHeader = req.headers.get("authorization");
    const HARVEST_CRON_SECRET_RAW = Deno.env.get("HARVEST_CRON_SECRET");
    const HARVEST_CRON_SECRET = HARVEST_CRON_SECRET_RAW?.trim();
    
    let isAuthenticated = false;
    let authSource = "none";
    let userId: string | undefined;
    
    // For scheduled requests: Check HARVEST_CRON_SECRET
    if (body.scheduled === true) {
      // Debug logging
      console.log(`[harvest-ads] Secret debug - received: "${cronSecret}" (${cronSecret?.length} chars)`);
      console.log(`[harvest-ads] Secret debug - env: "${HARVEST_CRON_SECRET}" (${HARVEST_CRON_SECRET?.length} chars)`);
      console.log(`[harvest-ads] Secret debug - match: ${cronSecret === HARVEST_CRON_SECRET}`);
      
      if (cronSecret && HARVEST_CRON_SECRET && cronSecret === HARVEST_CRON_SECRET) {
        isAuthenticated = true;
        authSource = "cron_secret";
        console.log("[harvest-ads] Cron secret validated successfully");
      }
      
      if (!isAuthenticated) {
        console.warn(`Unauthorized scheduled request - invalid or missing cron secret`);
        logFacebookAPI({
          timestamp: new Date().toISOString(),
          function: "harvest-ads",
          action: "auth_failed",
          message: `Scheduled request rejected - hasSecret: ${!!cronSecret}, hasEnvSecret: ${!!HARVEST_CRON_SECRET}`,
        });
        return new Response(
          JSON.stringify({ error: "Unauthorized - Invalid cron secret" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // For user requests: JWT validation
      if (authHeader) {
        const jwtResult = await verifyJWT(authHeader);
        isAuthenticated = jwtResult.valid;
        userId = jwtResult.userId;
        authSource = "jwt";
      }
      
      if (!isAuthenticated) {
        console.warn(`Unauthorized user request from ${req.headers.get("x-forwarded-for") || "unknown"}`);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    console.log(`[harvest-ads] Authenticated via ${authSource}`);
    
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    let tenantId: string | null = null;
    let categoryId: string | null = null;
    let isScheduled = false;
    let isFullHarvest = false;
    let incrementalHours = 6;

    // Parse harvest mode from body (incremental, 24h, 7d)
    const harvestMode = body.harvestMode || "incremental";
    if (harvestMode === "24h") {
      incrementalHours = 24;
    } else if (harvestMode === "7d") {
      incrementalHours = 168; // 7 * 24
    }

    if (body.scheduled === true) {
      isScheduled = true;
      isFullHarvest = body.fullHarvest === true;
      incrementalHours = body.fullHarvest ? 0 : validateIncrementalHours(body.incrementalHours || incrementalHours);
      
      const harvestType = isFullHarvest ? "FULL (all 2025)" : `INCREMENTAL (last ${incrementalHours}h)`;
      console.log(`Running ${harvestType} scheduled harvest for all tenants`);
    } else if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", userId)
        .single();

      if (!profile?.tenant_id) {
        return new Response(
          JSON.stringify({ success: false, error: "No tenant found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      tenantId = profile.tenant_id;
      
      // Validate categoryId if provided - must be UUID and belong to user's tenant
      if (body.categoryId) {
        if (!validateUUID(body.categoryId)) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid category ID format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Verify category belongs to user's tenant
        const { data: category, error: catError } = await supabaseAdmin
          .from("ad_categories")
          .select("id")
          .eq("id", body.categoryId)
          .eq("tenant_id", tenantId)
          .single();
        
        if (catError || !category) {
          return new Response(
            JSON.stringify({ success: false, error: "Category not found or access denied" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        categoryId = body.categoryId;
      }
      
      // Check for fullHarvest flag from user request
      isFullHarvest = body.fullHarvest === true;
    }

    // Determine the date filter based on mode
    let dateMin: string;
    if (isFullHarvest) {
      dateMin = AD_DELIVERY_DATE_MIN_BASE; // Full: desde 01/01/2025
    } else {
      dateMin = getIncrementalStartDate(incrementalHours); // Incremental: últimas X horas
    }

    console.log(`Harvest mode: ${harvestMode}, Hours: ${incrementalHours}, Date filter: ads since ${dateMin}`);

    // Fetch categories to process
    let categoriesQuery = supabaseAdmin
      .from("ad_categories")
      .select("*")
      .eq("is_active", true);

    if (!isScheduled && tenantId) {
      categoriesQuery = categoriesQuery.eq("tenant_id", tenantId);
    }

    if (categoryId) {
      categoriesQuery = categoriesQuery.eq("id", categoryId);
    }

    const { data: categories, error: catError } = await categoriesQuery;

    if (catError || !categories || categories.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No categories to process", imported: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalImported = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    for (const category of categories) {
      console.log(`\n=== Processing category: ${category.name} ===`);
      
      const allAds: FacebookAd[] = [];
      
      // Prioritize Brazil - fetch BR first
      const sortedCountries = [...category.countries].sort((a, b) => {
        if (a === "BR") return -1;
        if (b === "BR") return 1;
        return 0;
      });

      for (const keyword of category.keywords) {
        for (const country of sortedCountries) {
          const maxAdsPerQuery = isFullHarvest ? 1000 : 200;
          const ads = await fetchAllAdsForKeyword(keyword, country, dateMin, maxAdsPerQuery);
          allAds.push(...ads);
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Deduplicate by ad ID
      const uniqueAds = Array.from(
        new Map(allAds.map(ad => [ad.id, ad])).values()
      );

      console.log(`Found ${uniqueAds.length} unique ads for category ${category.name}`);

      if (uniqueAds.length > 0) {
        const results = await processAndStoreAds(
          uniqueAds,
          category.tenant_id,
          category.id,
          supabaseAdmin
        );

        totalImported += results.imported;
        totalUpdated += results.updated;
        totalErrors += results.errors;
      }

      // Update category with harvest timestamp and count
      const { count } = await supabaseAdmin
        .from("ads")
        .select("id", { count: "exact", head: true })
        .eq("category_id", category.id)
        .eq("tenant_id", category.tenant_id);

      await supabaseAdmin
        .from("ad_categories")
        .update({
          last_harvest_at: new Date().toISOString(),
          ads_count: count || 0,
        })
        .eq("id", category.id);
    }

    // Log job run if scheduled
    if (isScheduled) {
      await supabaseAdmin.from("job_runs").insert({
        job_name: isFullHarvest ? "Full Harvest 2025" : `Incremental Harvest (${incrementalHours}h)`,
        task_type: "ad_harvest",
        schedule_type: isFullHarvest ? "manual" : `${incrementalHours}h`,
        status: totalErrors > 0 ? "completed_with_errors" : "completed",
        ads_processed: totalImported + totalUpdated,
        errors_count: totalErrors,
        completed_at: new Date().toISOString(),
        metadata: { 
          imported: totalImported, 
          updated: totalUpdated,
          dateMin,
          harvestType: isFullHarvest ? "full" : "incremental",
          incrementalHours: isFullHarvest ? null : incrementalHours,
        },
      });
    }

    console.log(`\n=== HARVEST COMPLETE ===`);
    console.log(`Imported: ${totalImported}, Updated: ${totalUpdated}, Errors: ${totalErrors}`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: totalImported,
        updated: totalUpdated,
        errors: totalErrors,
        dateMin,
        harvestType: isFullHarvest ? "full" : "incremental",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Harvest error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
