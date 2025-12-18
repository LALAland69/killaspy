import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-signature, x-cron-timestamp",
};

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

// URL validation to prevent SSRF attacks
function isValidExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }
    
    const hostname = url.hostname.toLowerCase();
    
    // Block localhost and loopback
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return false;
    }
    
    // Block internal/private IP ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b, c] = ipv4Match.map(Number);
      
      // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 - Private
      if (a === 10) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      // 169.254.0.0/16 - Link-local (AWS metadata)
      if (a === 169 && b === 254) return false;
      // 127.0.0.0/8 - Loopback
      if (a === 127) return false;
      // 0.0.0.0/8 - Current network
      if (a === 0) return false;
    }
    
    // Block common internal hostnames
    const blockedPatterns = [/\.local$/, /\.internal$/, /\.corp$/, /\.lan$/, /^metadata\.google\.internal$/];
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// User-Agent variations
const USER_AGENTS = {
  bot: "Googlebot/2.1 (+http://www.google.com/bot.html)",
  mobile: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
};

const REFERERS = {
  none: null,
  facebook: "https://www.facebook.com/",
  google: "https://www.google.com/",
};

const STANDARD_UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];

function deduceCloakerToken(url: string): string | null {
  try {
    const urlObj = new URL(url);
    for (const [key, value] of urlObj.searchParams.entries()) {
      if (STANDARD_UTM_PARAMS.includes(key.toLowerCase())) continue;
      if (key.length <= 12 && !key.includes("_") && value.length >= 4) {
        return `${key}=${value}`;
      }
    }
    const match = url.match(/[&?]([a-zA-Z0-9]{6,12})(?:&|$)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

async function testUrlForDivergence(
  supabase: any,
  ad: any,
  targetUrl: string
): Promise<{ divergenceFound: boolean; blackUrl: string | null; error?: string }> {
  // Validate URL before fetching to prevent SSRF
  if (!isValidExternalUrl(targetUrl)) {
    console.warn(`Skipping invalid/internal URL: ${targetUrl}`);
    return { divergenceFound: false, blackUrl: null, error: `Invalid or internal URL blocked: ${targetUrl}` };
  }
  
  const token = deduceCloakerToken(targetUrl);
  
  let whiteHash = "";
  try {
    const whiteResponse = await fetch(targetUrl, {
      headers: { "User-Agent": USER_AGENTS.bot },
    });
    const whiteContent = await whiteResponse.text();
    whiteHash = hashContent(whiteContent);
    
    await supabase.from("landing_page_snapshots").insert({
      tenant_id: ad.tenant_id,
      ad_id: ad.id,
      snapshot_condition: "Safe Request (Bot + Direct)",
      user_agent: USER_AGENTS.bot,
      ip_geo: "US",
      html_hash: whiteHash,
      content_preview: whiteContent.replace(/<[^>]+>/g, " ").slice(0, 200),
      final_redirect_url: whiteResponse.url,
      response_code: whiteResponse.status,
      is_black_page: false,
    });
  } catch (e) {
    return { divergenceFound: false, blackUrl: null, error: `White page fetch failed: ${e}` };
  }
  
  const testUrl = token ? `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}${token}` : targetUrl;
  
  try {
    const blackResponse = await fetch(testUrl, {
      headers: {
        "User-Agent": USER_AGENTS.desktop,
        "Referer": REFERERS.facebook!,
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    
    const blackContent = await blackResponse.text();
    const blackHash = hashContent(blackContent);
    const divergenceFound = blackHash !== whiteHash || blackResponse.url !== targetUrl;
    
    if (divergenceFound) {
      await supabase.from("landing_page_snapshots").insert({
        tenant_id: ad.tenant_id,
        ad_id: ad.id,
        snapshot_condition: "Black Request (Desktop + FB Referer)",
        user_agent: USER_AGENTS.desktop,
        ip_geo: "BR",
        referer: REFERERS.facebook,
        html_hash: blackHash,
        content_preview: blackContent.replace(/<[^>]+>/g, " ").slice(0, 200),
        final_redirect_url: blackResponse.url,
        response_code: blackResponse.status,
        is_black_page: true,
        detected_token: token,
      });
      
      return { divergenceFound: true, blackUrl: blackResponse.url };
    }
  } catch (e) {
    return { divergenceFound: false, blackUrl: null, error: `Black page test failed: ${e}` };
  }
  
  return { divergenceFound: false, blackUrl: null };
}

// Job name mapping
const JOB_NAMES: Record<string, Record<string, string>> = {
  divergence_test: {
    daily: "Daily Divergence Test",
    intraday: "Intraday High-Risk Test",
  },
  status_check: {
    daily: "Daily Status Check",
  },
  scheduled_audits: {
    daily: "Scheduled Security Audits",
  },
};

// Run scheduled security audits
async function processScheduledAudits(supabase: any): Promise<{ processed: number; errors: number }> {
  const now = new Date().toISOString();
  
  // Find audits that need to run
  const { data: audits, error } = await supabase
    .from("security_audits")
    .select("*")
    .eq("is_recurring", true)
    .lte("next_run_at", now)
    .in("status", ["pending", "completed"]);
  
  if (error) {
    console.error("Failed to fetch scheduled audits:", error);
    return { processed: 0, errors: 1 };
  }
  
  let processed = 0;
  let errors = 0;
  
  for (const audit of audits || []) {
    console.log(`Running scheduled audit: ${audit.name} (${audit.id})`);
    
    try {
      // Reset audit status and run
      await supabase
        .from("security_audits")
        .update({
          status: "pending",
          total_findings: 0,
          critical_findings: 0,
          started_at: null,
          completed_at: null,
        })
        .eq("id", audit.id);
      
      // Invoke the security audit function
      const { error: invokeError } = await supabase.functions.invoke("run-security-audit", {
        body: { auditId: audit.id },
      });
      
      if (invokeError) {
        throw invokeError;
      }
      
      // Calculate next run time
      let nextRunAt: Date | null = null;
      if (audit.recurrence_schedule === "daily") {
        nextRunAt = new Date();
        nextRunAt.setDate(nextRunAt.getDate() + 1);
        nextRunAt.setHours(2, 0, 0, 0);
      } else if (audit.recurrence_schedule === "weekly") {
        nextRunAt = new Date();
        nextRunAt.setDate(nextRunAt.getDate() + 7);
        nextRunAt.setHours(2, 0, 0, 0);
      } else if (audit.recurrence_schedule === "monthly") {
        nextRunAt = new Date();
        nextRunAt.setMonth(nextRunAt.getMonth() + 1);
        nextRunAt.setHours(2, 0, 0, 0);
      }
      
      // Update next run time
      await supabase
        .from("security_audits")
        .update({
          last_run_at: now,
          next_run_at: nextRunAt?.toISOString(),
        })
        .eq("id", audit.id);
      
      processed++;
    } catch (e) {
      console.error(`Failed to run audit ${audit.id}:`, e);
      errors++;
    }
    
    // Small delay between audits
    await new Promise((r) => setTimeout(r, 2000));
  }
  
  return { processed, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  let jobRunId: string | null = null;
  
  try {
    // Read body once for auth verification and parsing
    const bodyText = await req.text();
    
    // Authentication: Check either HMAC signature (cron) or JWT (user)
    const cronSignature = req.headers.get("x-cron-signature");
    const cronTimestamp = req.headers.get("x-cron-timestamp");
    const authHeader = req.headers.get("authorization");
    
    let isAuthenticated = false;
    let authSource = "none";
    
    // Priority 1: HMAC signature for cron jobs
    if (cronSignature && cronTimestamp) {
      isAuthenticated = await verifyCronSignature(cronSignature, cronTimestamp, bodyText);
      authSource = "hmac";
    }
    
    // Priority 2: JWT for authenticated users
    if (!isAuthenticated && authHeader) {
      const jwtResult = await verifyJWT(authHeader);
      isAuthenticated = jwtResult.valid;
      authSource = "jwt";
    }
    
    if (!isAuthenticated) {
      console.warn(`Unauthorized request attempt from ${req.headers.get("x-forwarded-for") || "unknown"}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Authenticated via ${authSource}`);
    
    const { taskType, scheduleType } = bodyText ? JSON.parse(bodyText) : {};
    const type = taskType || "divergence_test";
    const schedule = scheduleType || "daily";
    const jobName = JOB_NAMES[type]?.[schedule] || `${type} (${schedule})`;
    
    console.log(`Starting scheduled worker: ${jobName}`);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create job run record
    const { data: jobRun, error: jobRunError } = await supabase
      .from("job_runs")
      .insert({
        job_name: jobName,
        task_type: type,
        schedule_type: schedule,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    
    if (jobRunError) {
      console.error("Failed to create job run:", jobRunError);
    } else {
      jobRunId = jobRun.id;
    }
    
    let processedCount = 0;
    let divergencesFound = 0;
    let errorsCount = 0;
    const errors: string[] = [];
    
    if (type === "divergence_test") {
      let query = supabase
        .from("ads")
        .select("id, tenant_id, final_lp_url, white_url, suspicion_score, is_cloaked_flag")
        .not("final_lp_url", "is", null)
        .order("suspicion_score", { ascending: false });
      
      if (schedule === "intraday") {
        query = query.gte("suspicion_score", 50).limit(20);
      } else {
        query = query.eq("status", "active").limit(50);
      }
      
      const { data: ads, error } = await query;
      if (error) throw error;
      
      console.log(`Found ${ads?.length || 0} ads to test`);
      
      for (const ad of ads || []) {
        const targetUrl = ad.final_lp_url || ad.white_url;
        if (!targetUrl) continue;
        
        const result = await testUrlForDivergence(supabase, ad, targetUrl);
        processedCount++;
        
        if (result.error) {
          errorsCount++;
          errors.push(result.error);
        }
        
        if (result.divergenceFound) {
          divergencesFound++;
          await supabase
            .from("ads")
            .update({
              is_cloaked_flag: true,
              detected_black_url: result.blackUrl,
              suspicion_score: Math.min(100, (ad.suspicion_score || 0) + 20),
            })
            .eq("id", ad.id);
        }
        
        await new Promise((r) => setTimeout(r, 1000));
      }
      
      if (schedule === "daily") {
        const tenantIds = [...new Set((ads || []).map((a) => a.tenant_id))];
        for (const tenantId of tenantIds) {
          const tenantAds = (ads || []).filter((a) => a.tenant_id === tenantId);
          await supabase.from("daily_reports").insert({
            tenant_id: tenantId,
            total_ads_analyzed: tenantAds.length,
            new_cloakers_detected: tenantAds.filter((a) => a.is_cloaked_flag).length,
            top_aggressive_ads: tenantAds
              .sort((a, b) => (b.suspicion_score || 0) - (a.suspicion_score || 0))
              .slice(0, 5)
              .map((a) => ({ id: a.id, score: a.suspicion_score })),
          });
        }
      }
    } else if (type === "status_check") {
      const { data: ads, error } = await supabase
        .from("ads")
        .select("id, tenant_id, final_lp_url, status")
        .eq("status", "active")
        .limit(100);
      
      if (error) throw error;
      
      for (const ad of ads || []) {
        if (!ad.final_lp_url) continue;
        
        // Validate URL before fetching to prevent SSRF
        if (!isValidExternalUrl(ad.final_lp_url)) {
          console.warn(`Skipping invalid/internal URL for ad ${ad.id}: ${ad.final_lp_url}`);
          errorsCount++;
          errors.push(`Invalid/internal URL blocked for ${ad.id}`);
          continue;
        }
        
        try {
          const response = await fetch(ad.final_lp_url, {
            method: "HEAD",
            headers: { "User-Agent": USER_AGENTS.desktop },
          });
          
          if (response.status === 404 || response.status >= 500) {
            await supabase.from("ads").update({ status: "inactive" }).eq("id", ad.id);
          }
          processedCount++;
        } catch (e) {
          errorsCount++;
          errors.push(`Status check failed for ${ad.id}: ${e}`);
        }
        
        await new Promise((r) => setTimeout(r, 500));
      }
    } else if (type === "scheduled_audits") {
      // Process scheduled security audits
      const result = await processScheduledAudits(supabase);
      processedCount = result.processed;
      errorsCount = result.errors;
    }
    
    const durationMs = Date.now() - startTime;
    
    // Update job run with completion
    if (jobRunId) {
      await supabase
        .from("job_runs")
        .update({
          status: errorsCount > 0 && processedCount === 0 ? "failed" : "completed",
          completed_at: new Date().toISOString(),
          duration_ms: durationMs,
          ads_processed: processedCount,
          divergences_found: divergencesFound,
          errors_count: errorsCount,
          error_message: errors.length > 0 ? errors.slice(0, 5).join("; ") : null,
          metadata: { totalErrors: errorsCount },
        })
        .eq("id", jobRunId);
    }
    
    const result = {
      success: true,
      jobRunId,
      taskType: type,
      scheduleType: schedule,
      processedCount,
      divergencesFound,
      errorsCount,
      durationMs,
      completedAt: new Date().toISOString(),
    };
    
    console.log(`Worker completed:`, result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Update job run with failure
    if (jobRunId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from("job_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          duration_ms: durationMs,
          error_message: errorMessage,
        })
        .eq("id", jobRunId);
    }
    
    console.error("Scheduled worker error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
