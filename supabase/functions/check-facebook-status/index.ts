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
  const accessToken = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
  
  if (!accessToken) {
    return {
      success: false,
      error_type: "config",
      message: "Token não configurado",
      checked_at: new Date().toISOString(),
    };
  }

  const diagnostics: Record<string, unknown> = {
    token_length: accessToken.length,
    token_prefix: accessToken.substring(0, 12) + "...",
  };

  try {
    // Step 1: Check token debug info
    const debugResponse = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    );
    const debugData = await debugResponse.json();
    
    if (debugData.data) {
      diagnostics.token_type = debugData.data.type;
      diagnostics.app_id = debugData.data.app_id;
      diagnostics.is_valid = debugData.data.is_valid;
      diagnostics.scopes = debugData.data.scopes;
      diagnostics.expires_at = debugData.data.expires_at 
        ? new Date(debugData.data.expires_at * 1000).toISOString() 
        : "never";
      
      // Check if ads_read permission is present
      const hasAdsRead = debugData.data.scopes?.includes("ads_read");
      diagnostics.has_ads_read = hasAdsRead;
      
      if (!hasAdsRead) {
        return {
          success: false,
          error_type: "permission",
          message: "Token não possui permissão 'ads_read'. Regenere o token com esta permissão.",
          checked_at: new Date().toISOString(),
          diagnostics,
        };
      }
      
      if (!debugData.data.is_valid) {
        return {
          success: false,
          error_type: "invalid_token",
          message: "Token inválido ou expirado",
          checked_at: new Date().toISOString(),
          diagnostics,
        };
      }
    }

    // Step 2: Test the Ad Library endpoint directly
    const adLibraryUrl = `https://graph.facebook.com/v21.0/ads_archive?access_token=${accessToken}&ad_reached_countries=["US"]&search_terms=test&limit=1&fields=id`;
    const adLibResponse = await fetch(adLibraryUrl);
    const adLibData = await adLibResponse.json();
    
    diagnostics.ad_library_http_status = adLibResponse.status;
    
    if (adLibData.error) {
      const errorCode = adLibData.error.code;
      const isTransient = errorCode === 1 || errorCode === 2;
      
      diagnostics.ad_library_error = {
        code: errorCode,
        type: adLibData.error.type,
        message: adLibData.error.message,
        fbtrace_id: adLibData.error.fbtrace_id,
      };
      
      return {
        success: false,
        error_code: errorCode,
        error_type: isTransient ? "transient" : "ad_library_error",
        message: isTransient 
          ? `Erro temporário do Facebook (código ${errorCode}). Aguarde alguns minutos.`
          : `Erro na Ad Library: ${adLibData.error.message}`,
        checked_at: new Date().toISOString(),
        diagnostics,
      };
    }
    
    diagnostics.ad_library_working = true;
    diagnostics.test_ads_returned = adLibData.data?.length || 0;
    
    return {
      success: true,
      message: "Token válido e Ad Library funcionando",
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
