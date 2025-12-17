import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// URL validation to prevent SSRF attacks
function isValidExternalUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    if (!["http:", "https:"].includes(url.protocol)) {
      return { valid: false, error: "Only HTTP and HTTPS protocols are allowed" };
    }
    
    const hostname = url.hostname.toLowerCase();
    
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return { valid: false, error: "Localhost URLs are not allowed" };
    }
    
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (a === 10) return { valid: false, error: "Private IP addresses are not allowed" };
      if (a === 172 && b >= 16 && b <= 31) return { valid: false, error: "Private IP addresses are not allowed" };
      if (a === 192 && b === 168) return { valid: false, error: "Private IP addresses are not allowed" };
      if (a === 169 && b === 254) return { valid: false, error: "Link-local addresses are not allowed" };
      if (a === 127) return { valid: false, error: "Loopback addresses are not allowed" };
      if (a === 0) return { valid: false, error: "Invalid IP address" };
    }
    
    const blockedPatterns = [/\.local$/, /\.internal$/, /\.corp$/, /\.lan$/, /^metadata\.google\.internal$/];
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, error: "Internal hostnames are not allowed" };
      }
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

// User-Agent variations for testing
const USER_AGENTS = {
  bot: "Googlebot/2.1 (+http://www.google.com/bot.html)",
  mobile: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

// Referer variations
const REFERERS = {
  none: null,
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
  google: "https://www.google.com/",
};

// Geo tiers (simulated via headers)
const GEO_TARGETS = {
  tier1: { country: "US", language: "en-US" },
  tier3: { country: "RU", language: "ru-RU" },
  target: { country: "BR", language: "pt-BR" },
};

// Standard UTM parameters to exclude when detecting cloaker tokens
const STANDARD_UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "msclkid"];

interface TestCondition {
  userAgent: keyof typeof USER_AGENTS;
  referer: keyof typeof REFERERS;
  geo: keyof typeof GEO_TARGETS;
  includeToken: boolean;
}

interface TestResult {
  condition: TestCondition;
  conditionLabel: string;
  finalUrl: string;
  responseCode: number;
  contentPreview: string;
  htmlHash: string;
  redirectChain: string[];
  isBlackPage: boolean;
  detectedToken: string | null;
}

// Generate all 24 test conditions
function generateTestMatrix(): TestCondition[] {
  const conditions: TestCondition[] = [];
  
  for (const ua of Object.keys(USER_AGENTS) as (keyof typeof USER_AGENTS)[]) {
    for (const ref of Object.keys(REFERERS) as (keyof typeof REFERERS)[]) {
      for (const geo of Object.keys(GEO_TARGETS) as (keyof typeof GEO_TARGETS)[]) {
        // Token is only included in "black" request attempts
        conditions.push({ userAgent: ua, referer: ref, geo, includeToken: true });
      }
    }
  }
  
  return conditions;
}

// Deduce cloaker token from URL parameters
function deduceCloakerToken(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    for (const [key, value] of params.entries()) {
      // Skip standard UTM params
      if (STANDARD_UTM_PARAMS.includes(key.toLowerCase())) continue;
      
      // Look for short, non-standard parameter keys (typical cloaker tokens)
      if (key.length <= 12 && !key.includes("_") && value.length >= 4) {
        return `${key}=${value}`;
      }
    }
    
    // Also check for tokens appended directly (e.g., &abc123xy)
    const match = url.match(/[&?]([a-zA-Z0-9]{6,12})(?:&|$)/);
    if (match) {
      return match[1];
    }
    
    return null;
  } catch {
    return null;
  }
}

// Simple hash function for content comparison
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// Generate condition label for display
function getConditionLabel(condition: TestCondition): string {
  const parts = [];
  
  const geoLabels = { tier1: "US IP", tier3: "RU IP", target: "BR IP" };
  const uaLabels = { bot: "Bot UA", mobile: "Mobile UA", desktop: "Desktop UA" };
  const refLabels = { none: "Direct", facebook: "FB Referer", instagram: "IG Referer", google: "Google Referer" };
  
  parts.push(geoLabels[condition.geo]);
  parts.push(uaLabels[condition.userAgent]);
  parts.push(refLabels[condition.referer]);
  
  return parts.join(" + ");
}

// Perform a single test request
async function performTestRequest(
  targetUrl: string,
  condition: TestCondition,
  token: string | null
): Promise<TestResult> {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENTS[condition.userAgent],
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": GEO_TARGETS[condition.geo].language + ",en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };
  
  if (REFERERS[condition.referer]) {
    headers["Referer"] = REFERERS[condition.referer]!;
  }
  
  // Append token if available and condition requires it
  let testUrl = targetUrl;
  if (condition.includeToken && token) {
    const separator = targetUrl.includes("?") ? "&" : "?";
    testUrl = `${targetUrl}${separator}${token}`;
  }
  
  const redirectChain: string[] = [testUrl];
  let finalUrl = testUrl;
  let responseCode = 0;
  let content = "";
  
  try {
    // Note: In production, you'd use a proxy service for geo-targeting
    // This is a simplified implementation for demonstration
    const response = await fetch(testUrl, {
      method: "GET",
      headers,
      redirect: "follow",
    });
    
    finalUrl = response.url;
    responseCode = response.status;
    
    // Only read content for successful responses
    if (response.ok) {
      content = await response.text();
    }
    
    // Track redirect if different from original
    if (finalUrl !== testUrl) {
      redirectChain.push(finalUrl);
    }
  } catch (error) {
    console.error(`Request failed for ${testUrl}:`, error);
    responseCode = 0;
  }
  
  // Extract content preview (first 200 chars of visible text)
  const contentPreview = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  
  const htmlHash = hashContent(content);
  
  // Determine if this looks like a "black page" (real offer)
  // Heuristics: different final URL, contains sales indicators
  const isBlackPage = 
    finalUrl !== targetUrl &&
    (
      content.toLowerCase().includes("buy now") ||
      content.toLowerCase().includes("add to cart") ||
      content.toLowerCase().includes("checkout") ||
      content.toLowerCase().includes("limited time") ||
      content.toLowerCase().includes("order now") ||
      /\$\d+/.test(content) ||
      redirectChain.length > 2
    );
  
  return {
    condition,
    conditionLabel: getConditionLabel(condition),
    finalUrl,
    responseCode,
    contentPreview,
    htmlHash,
    redirectChain,
    isBlackPage,
    detectedToken: condition.includeToken ? token : null,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { adId, targetUrl } = await req.json();
    
    if (!adId || !targetUrl) {
      return new Response(
        JSON.stringify({ error: "adId and targetUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate target URL to prevent SSRF
    const urlValidation = isValidExternalUrl(targetUrl);
    if (!urlValidation.valid) {
      console.error("URL validation failed:", urlValidation.error);
      return new Response(
        JSON.stringify({ error: `Invalid target URL: ${urlValidation.error}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Starting divergence test for ad ${adId} on ${targetUrl}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the ad to find its tenant_id
    const { data: ad, error: adError } = await supabase
      .from("ads")
      .select("tenant_id, white_url, suspicion_score")
      .eq("id", adId)
      .single();
    
    if (adError || !ad) {
      return new Response(
        JSON.stringify({ error: "Ad not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Deduce potential cloaker token
    const detectedToken = deduceCloakerToken(targetUrl);
    console.log(`Detected token: ${detectedToken}`);
    
    // Generate test matrix (24 conditions)
    const testMatrix = generateTestMatrix();
    console.log(`Running ${testMatrix.length} test conditions`);
    
    // Run a subset of tests (to avoid rate limiting)
    // In production, you'd run all 24 with proper delays and proxy rotation
    const priorityConditions = testMatrix.slice(0, 6); // First 6 conditions for demo
    
    const results: TestResult[] = [];
    let blackUrlFound: string | null = null;
    
    // First, get the "safe" white page baseline
    const safeCondition: TestCondition = {
      userAgent: "bot",
      referer: "none",
      geo: "tier1",
      includeToken: false,
    };
    
    const whiteResult = await performTestRequest(targetUrl, safeCondition, null);
    results.push(whiteResult);
    console.log(`White page baseline captured: ${whiteResult.htmlHash}`);
    
    // Now test with various conditions
    for (const condition of priorityConditions) {
      const result = await performTestRequest(targetUrl, condition, detectedToken);
      results.push(result);
      
      // Check for divergence
      if (result.htmlHash !== whiteResult.htmlHash || result.isBlackPage) {
        console.log(`Divergence detected! Condition: ${result.conditionLabel}`);
        blackUrlFound = result.finalUrl;
        
        // Store as black page snapshot
        await supabase.from("landing_page_snapshots").insert({
          tenant_id: ad.tenant_id,
          ad_id: adId,
          snapshot_condition: result.conditionLabel,
          user_agent: USER_AGENTS[condition.userAgent],
          ip_geo: GEO_TARGETS[condition.geo].country,
          referer: REFERERS[condition.referer],
          html_hash: result.htmlHash,
          content_preview: result.contentPreview,
          redirect_chain: result.redirectChain,
          final_redirect_url: result.finalUrl,
          response_code: result.responseCode,
          is_black_page: true,
          detected_token: detectedToken,
        });
        
        // Early exit on first black page found (for efficiency)
        break;
      }
      
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    
    // Store the white page snapshot
    await supabase.from("landing_page_snapshots").insert({
      tenant_id: ad.tenant_id,
      ad_id: adId,
      snapshot_condition: "Safe Request (Bot + Direct + Tier1)",
      user_agent: USER_AGENTS.bot,
      ip_geo: GEO_TARGETS.tier1.country,
      referer: null,
      html_hash: whiteResult.htmlHash,
      content_preview: whiteResult.contentPreview,
      redirect_chain: whiteResult.redirectChain,
      final_redirect_url: whiteResult.finalUrl,
      response_code: whiteResult.responseCode,
      is_black_page: false,
      detected_token: null,
    });
    
    // Update the ad with cloaking detection results
    if (blackUrlFound) {
      await supabase
        .from("ads")
        .update({
          is_cloaked_flag: true,
          detected_black_url: blackUrlFound,
          white_url: targetUrl,
          cloaker_token: detectedToken,
          suspicion_score: Math.min(100, (ad.suspicion_score || 0) + 30),
        })
        .eq("id", adId);
    }
    
    const response = {
      success: true,
      adId,
      targetUrl,
      detectedToken,
      testsRun: results.length,
      divergenceFound: !!blackUrlFound,
      blackUrl: blackUrlFound,
      whitePageHash: whiteResult.htmlHash,
      results: results.map((r) => ({
        condition: r.conditionLabel,
        finalUrl: r.finalUrl,
        responseCode: r.responseCode,
        htmlHash: r.htmlHash,
        isBlackPage: r.isBlackPage,
      })),
    };
    
    console.log(`Divergence test completed. Divergence found: ${!!blackUrlFound}`);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Divergence engine error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
