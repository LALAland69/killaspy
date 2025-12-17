import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    // Get user's tenant_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error("User profile not found");
    }

    const tenantId = profile.tenant_id;

    // Get the timestamp of the last check (24 hours ago by default)
    const lastCheckTime = new Date();
    lastCheckTime.setHours(lastCheckTime.getHours() - 24);

    // Find new ads created in the last 24 hours
    const { data: newAds, error: adsError } = await supabase
      .from("ads")
      .select(`
        id,
        headline,
        page_name,
        suspicion_score,
        advertiser_id,
        created_at,
        advertisers(name)
      `)
      .eq("tenant_id", tenantId)
      .gte("created_at", lastCheckTime.toISOString())
      .order("created_at", { ascending: false });

    if (adsError) {
      console.error("Error fetching new ads:", adsError);
      throw adsError;
    }

    console.log(`Found ${newAds?.length || 0} new ads for tenant ${tenantId}`);

    const alerts = [];

    // Create alerts for new ads
    for (const ad of newAds || []) {
      const advertiserName = (ad.advertisers as { name?: string })?.name || ad.page_name || "Desconhecido";
      
      // Determine severity based on suspicion score
      let severity = "info";
      if ((ad.suspicion_score || 0) >= 80) {
        severity = "error";
      } else if ((ad.suspicion_score || 0) >= 50) {
        severity = "warning";
      }

      const alertData = {
        tenant_id: tenantId,
        alert_type: "new_ad",
        title: `Novo anúncio detectado: ${advertiserName}`,
        message: ad.headline || `Score de suspeita: ${ad.suspicion_score || 0}`,
        severity,
        related_ad_id: ad.id,
        related_advertiser_id: ad.advertiser_id,
        metadata: {
          suspicion_score: ad.suspicion_score,
          page_name: ad.page_name,
        },
      };

      alerts.push(alertData);
    }

    // Check for high suspicion ads (even if not new)
    const { data: highSuspicionAds, error: highSuspicionError } = await supabase
      .from("ads")
      .select(`
        id,
        headline,
        page_name,
        suspicion_score,
        advertiser_id,
        advertisers(name)
      `)
      .eq("tenant_id", tenantId)
      .gte("suspicion_score", 80)
      .gte("updated_at", lastCheckTime.toISOString());

    if (!highSuspicionError && highSuspicionAds) {
      for (const ad of highSuspicionAds) {
        // Check if we already created an alert for this ad
        const existingAlert = alerts.find(a => a.related_ad_id === ad.id);
        if (!existingAlert) {
          const advertiserName = (ad.advertisers as { name?: string })?.name || ad.page_name || "Desconhecido";
          
          alerts.push({
            tenant_id: tenantId,
            alert_type: "high_suspicion",
            title: `Alta suspeita detectada: ${advertiserName}`,
            message: `Score de suspeita: ${ad.suspicion_score}. ${ad.headline || ""}`,
            severity: "error",
            related_ad_id: ad.id,
            related_advertiser_id: ad.advertiser_id,
            metadata: {
              suspicion_score: ad.suspicion_score,
            },
          });
        }
      }
    }

    // Insert alerts (avoid duplicates by checking existing)
    let newAlertsCount = 0;
    for (const alert of alerts) {
      // Check if similar alert already exists in the last 24 hours
      const { data: existingAlerts } = await supabase
        .from("alerts")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("related_ad_id", alert.related_ad_id)
        .eq("alert_type", alert.alert_type)
        .gte("created_at", lastCheckTime.toISOString())
        .limit(1);

      if (!existingAlerts || existingAlerts.length === 0) {
        const { error: insertError } = await supabase
          .from("alerts")
          .insert(alert);

        if (!insertError) {
          newAlertsCount++;
        } else {
          console.error("Error inserting alert:", insertError);
        }
      }
    }

    console.log(`Created ${newAlertsCount} new alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        newAlertsCount,
        adsChecked: newAds?.length || 0,
        highSuspicionAds: highSuspicionAds?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-new-ads function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
