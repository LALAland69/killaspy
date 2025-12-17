import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  let jobRunId: string | null = null;
  
  try {
    const { taskType, scheduleType } = await req.json().catch(() => ({}));
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
