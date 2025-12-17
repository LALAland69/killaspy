import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simulated trend data generator (in production, integrate with SerpAPI or similar)
function generateTrendData(keyword: string, region: string) {
  const now = new Date();
  const interestOverTime = [];
  
  // Generate 12 months of simulated data
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    
    // Generate realistic-looking trend data with some variation
    const baseValue = 50 + Math.sin(i / 2) * 20;
    const randomVariation = Math.random() * 30 - 15;
    const value = Math.max(0, Math.min(100, Math.round(baseValue + randomVariation)));
    
    interestOverTime.push({
      date: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      value,
    });
  }

  // Calculate trend direction based on recent vs past values
  const recentAvg = interestOverTime.slice(-3).reduce((sum, d) => sum + d.value, 0) / 3;
  const pastAvg = interestOverTime.slice(0, 3).reduce((sum, d) => sum + d.value, 0) / 3;
  
  let trendDirection: "rising" | "stable" | "declining";
  if (recentAvg > pastAvg * 1.1) {
    trendDirection = "rising";
  } else if (recentAvg < pastAvg * 0.9) {
    trendDirection = "declining";
  } else {
    trendDirection = "stable";
  }

  // Generate related queries
  const relatedQueries = [
    { query: `${keyword} comprar`, value: Math.floor(Math.random() * 100) + 50 },
    { query: `melhor ${keyword}`, value: Math.floor(Math.random() * 80) + 40 },
    { query: `${keyword} preço`, value: Math.floor(Math.random() * 70) + 30 },
    { query: `${keyword} online`, value: Math.floor(Math.random() * 60) + 20 },
    { query: `${keyword} 2024`, value: Math.floor(Math.random() * 50) + 10 },
  ].sort((a, b) => b.value - a.value);

  // Calculate overall trend score
  const trendScore = Math.round(recentAvg);

  return {
    keyword,
    region,
    trendScore,
    trendDirection,
    relatedQueries,
    interestOverTime,
    validatedAt: new Date().toISOString(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
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

    // Parse request body
    const { keyword, region = "BR" } = await req.json();

    if (!keyword || typeof keyword !== "string") {
      throw new Error("Keyword is required");
    }

    console.log(`Validating trend for keyword: "${keyword}" in region: ${region}`);

    // Generate trend data (replace with real API call in production)
    const trendData = generateTrendData(keyword.trim(), region);

    // Save to database
    const { error: insertError } = await supabase
      .from("trend_validations")
      .insert({
        tenant_id: tenantId,
        keyword: trendData.keyword,
        region: trendData.region,
        trend_score: trendData.trendScore,
        trend_direction: trendData.trendDirection,
        related_queries: trendData.relatedQueries,
        interest_over_time: trendData.interestOverTime,
        validated_at: trendData.validatedAt,
      });

    if (insertError) {
      console.error("Error saving trend validation:", insertError);
      // Continue anyway, just log the error
    }

    console.log(`Trend validation complete: ${trendData.trendDirection} (score: ${trendData.trendScore})`);

    return new Response(
      JSON.stringify(trendData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in validate-trend function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
