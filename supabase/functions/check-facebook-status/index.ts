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

  try {
    // Test the token with a simple debug call
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${accessToken}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      return {
        success: false,
        error_code: data.error.code,
        error_type: data.error.code === 1 ? "transient" : "permanent",
        message: data.error.message,
        checked_at: new Date().toISOString(),
      };
    }
    
    return {
      success: true,
      message: "API funcionando normalmente",
      checked_at: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      success: false,
      error_type: "network",
      message: errorMessage,
      checked_at: new Date().toISOString(),
    };
  }
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
