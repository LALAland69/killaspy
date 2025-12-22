import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusCheckResult {
  success: boolean;
  error_code?: number;
  error_type?: string;
  message?: string;
  checked_at: string;
}

async function checkFacebookApiStatus(): Promise<StatusCheckResult> {
  const appId = Deno.env.get("FACEBOOK_APP_ID");
  const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");
  const fallbackToken = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
  
  // Build token in format APP_ID|APP_SECRET (permanent token)
  const accessToken = appId && appSecret ? `${appId}|${appSecret}` : fallbackToken;
  
  if (!accessToken) {
    return {
      success: false,
      error_type: "config",
      message: "Token não configurado. Configure FACEBOOK_APP_ID e FACEBOOK_APP_SECRET.",
      checked_at: new Date().toISOString(),
    };
  }

  const diagnostics: Record<string, unknown> = {
    token_length: accessToken.length,
    token_prefix: accessToken.substring(0, 12) + "...",
    token_format: appId && appSecret ? "APP_ID|APP_SECRET" : "legacy",
  };

  try {
    // Test the Ad Library endpoint directly (PUBLIC API - no permissions needed!)
    const versionsToTry = ["v18.0", "v21.0", "v24.0"];
    const maxAttemptsPerVersion = 2;

    let lastAdLibStatus: number | undefined;
    let lastAdLibError: any | undefined;

    for (const version of versionsToTry) {
      for (let attempt = 1; attempt <= maxAttemptsPerVersion; attempt++) {
        // Build URL with proper encoding for Ad Library API
        const baseUrl = `https://graph.facebook.com/${version}/ads_archive`;
        const params = new URLSearchParams();
        params.append('access_token', accessToken);
        params.append('ad_reached_countries', '["BR"]');
        params.append('search_terms', 'coca cola');
        params.append('ad_active_status', 'ALL');
        params.append('limit', '3');
        params.append('fields', 'id,page_name,ad_snapshot_url');

        const adLibraryUrl = `${baseUrl}?${params.toString()}`;
        console.log(`[FB-CHECK] Testing ${version}, attempt ${attempt}: ${adLibraryUrl.replace(accessToken, '[REDACTED]')}`);
        
        const adLibResponse = await fetch(adLibraryUrl);

        lastAdLibStatus = adLibResponse.status;
        diagnostics.ad_library_http_status = adLibResponse.status;
        diagnostics.ad_library_version = version;
        diagnostics.ad_library_attempt = attempt;

        let adLibData: any = {};
        try {
          adLibData = await adLibResponse.json();
        } catch {
          adLibData = {};
        }

        if (!adLibData?.error && adLibResponse.ok) {
          diagnostics.ad_library_working = true;
          diagnostics.test_ads_returned = adLibData.data?.length || 0;
          return {
            success: true,
            message: "Token válido e Ad Library funcionando",
            checked_at: new Date().toISOString(),
            diagnostics,
          };
        }

        lastAdLibError = adLibData?.error;

        if (lastAdLibError) {
          const errorCode = lastAdLibError.code;
          const isTransient =
            errorCode === 1 ||
            errorCode === 2 ||
            lastAdLibError.is_transient === true ||
            adLibResponse.status >= 500;

          diagnostics.ad_library_error = {
            code: errorCode,
            type: lastAdLibError.type,
            message: lastAdLibError.message,
            fbtrace_id: lastAdLibError.fbtrace_id,
          };

          if (isTransient && attempt < maxAttemptsPerVersion) {
            await new Promise((r) => setTimeout(r, 350 * attempt));
            continue;
          }
        }

        // Non-JSON or non-error body but not OK: retry only on server errors
        if (adLibResponse.status >= 500 && attempt < maxAttemptsPerVersion) {
          await new Promise((r) => setTimeout(r, 350 * attempt));
          continue;
        }
      }
    }

    // If we reached here, Ad Library is not working
    if (lastAdLibError) {
      const errorCode = lastAdLibError.code;
      const isTransient = errorCode === 1 || errorCode === 2;

      return {
        success: false,
        error_code: errorCode,
        error_type: isTransient ? "transient" : "ad_library_error",
        message: isTransient
          ? `Erro temporário do Facebook (código ${errorCode}). Aguarde alguns minutos.`
          : `Erro na Ad Library: ${lastAdLibError.message}`,
        checked_at: new Date().toISOString(),
        diagnostics,
      };
    }

    return {
      success: false,
      error_type: "network",
      message: `Falha ao acessar Ad Library (HTTP ${lastAdLibStatus ?? "?"})`,
      checked_at: new Date().toISOString(),
      diagnostics,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      success: false,
      error_type: "network",
      message: errorMessage,
      checked_at: new Date().toISOString(),
      diagnostics,
    };
  }
}

interface StatusCheckResult {
  success: boolean;
  error_code?: number;
  error_type?: string;
  message?: string;
  checked_at: string;
  diagnostics?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check current Facebook API status
    const currentStatus = await checkFacebookApiStatus();
    console.log("Facebook API status check:", currentStatus);

    // Get the last known status from job_runs
    const { data: lastCheck } = await supabase
      .from("job_runs")
      .select("metadata, status")
      .eq("job_name", "facebook_api_health_check")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const previouslyFailing = lastCheck?.status === "failed";
    const nowWorking = currentStatus.success;

    // Log this check
    await supabase.from("job_runs").insert({
      job_name: "facebook_api_health_check",
      task_type: "health_check",
      schedule_type: "manual",
      status: currentStatus.success ? "completed" : "failed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      metadata: currentStatus,
    });

    // If API recovered, create alerts for all tenants
    if (previouslyFailing && nowWorking) {
      console.log("Facebook API recovered! Creating alerts...");
      
      // Get all tenants
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id");

      if (tenants && tenants.length > 0) {
        const alerts = tenants.map((tenant) => ({
          tenant_id: tenant.id,
          title: "API do Facebook Recuperada",
          message: "A API do Facebook voltou a funcionar normalmente. Você já pode realizar importações e buscas de anúncios.",
          alert_type: "api_status",
          severity: "info",
          metadata: {
            api: "facebook",
            previous_status: "error",
            current_status: "working",
            recovered_at: currentStatus.checked_at,
          },
        }));

        await supabase.from("alerts").insert(alerts);
        console.log(`Created ${alerts.length} recovery alerts`);
      }
    }

    return new Response(
      JSON.stringify({
        status: currentStatus,
        recovered: previouslyFailing && nowWorking,
        previous_status: lastCheck?.status || "unknown",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Error checking Facebook status:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
