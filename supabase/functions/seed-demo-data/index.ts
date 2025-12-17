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

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get tenant_id from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      return new Response(JSON.stringify({ error: "No tenant found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = profile.tenant_id;

    // Check if data already exists
    const { count } = await supabase
      .from("advertisers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (count && count > 0) {
      return new Response(JSON.stringify({ message: "Demo data already seeded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create demo advertisers
    const advertisers = [
      { name: "FitLife Pro", page_id: "fitlifepro", total_ads: 45, active_ads: 32, avg_suspicion_score: 78, countries: 5, domains_count: 3 },
      { name: "Crypto Wealth Academy", page_id: "cryptowealthacademy", total_ads: 89, active_ads: 67, avg_suspicion_score: 92, countries: 12, domains_count: 8 },
      { name: "Natural Health Store", page_id: "naturalhealthstore", total_ads: 23, active_ads: 18, avg_suspicion_score: 45, countries: 3, domains_count: 2 },
      { name: "Tech Gadgets HQ", page_id: "techgadgetshq", total_ads: 156, active_ads: 12, avg_suspicion_score: 23, countries: 8, domains_count: 4 },
      { name: "Finance Freedom Co", page_id: "financefreedomco", total_ads: 67, active_ads: 54, avg_suspicion_score: 67, countries: 6, domains_count: 5 },
      { name: "Keto Diet Secrets", page_id: "ketodietsecrets", total_ads: 34, active_ads: 28, avg_suspicion_score: 85, countries: 4, domains_count: 3 },
      { name: "Forex Masters", page_id: "forexmasters", total_ads: 112, active_ads: 89, avg_suspicion_score: 95, countries: 15, domains_count: 12 },
      { name: "Beauty Glow Shop", page_id: "beautyglowshop", total_ads: 78, active_ads: 45, avg_suspicion_score: 32, countries: 7, domains_count: 2 },
    ];

    const { data: insertedAdvertisers, error: advError } = await supabase
      .from("advertisers")
      .insert(advertisers.map(a => ({ ...a, tenant_id: tenantId })))
      .select();

    if (advError) {
      console.error("Advertiser insert error:", advError);
      throw advError;
    }

    // Create demo domains
    const domains = [
      { domain: "fitlifepro.com", page_count: 12, sales_pages: 3, compliance_pages: 2, suspicion_score: 78, tech_stack: ["WordPress", "WooCommerce"], advertiser_id: insertedAdvertisers[0].id },
      { domain: "fitlife-results.net", page_count: 5, sales_pages: 2, compliance_pages: 1, suspicion_score: 82, tech_stack: ["ClickFunnels"], advertiser_id: insertedAdvertisers[0].id },
      { domain: "cryptowealthacademy.io", page_count: 24, sales_pages: 8, compliance_pages: 1, suspicion_score: 92, tech_stack: ["Custom", "Stripe"], advertiser_id: insertedAdvertisers[1].id },
      { domain: "crypto-profits-now.com", page_count: 8, sales_pages: 4, compliance_pages: 0, suspicion_score: 96, tech_stack: ["ClickFunnels", "Hotjar"], advertiser_id: insertedAdvertisers[1].id },
      { domain: "naturalhealthstore.net", page_count: 45, sales_pages: 5, compliance_pages: 8, suspicion_score: 45, tech_stack: ["Shopify"], advertiser_id: insertedAdvertisers[2].id },
      { domain: "techgadgetshq.com", page_count: 89, sales_pages: 12, compliance_pages: 15, suspicion_score: 23, tech_stack: ["Shopify", "Klaviyo"], advertiser_id: insertedAdvertisers[3].id },
      { domain: "financefreedom.co", page_count: 18, sales_pages: 6, compliance_pages: 3, suspicion_score: 67, tech_stack: ["WordPress", "Thrive"], advertiser_id: insertedAdvertisers[4].id },
      { domain: "ketodietsecrets.com", page_count: 15, sales_pages: 5, compliance_pages: 2, suspicion_score: 85, tech_stack: ["ClickFunnels"], advertiser_id: insertedAdvertisers[5].id },
      { domain: "forexmasters-elite.com", page_count: 32, sales_pages: 12, compliance_pages: 1, suspicion_score: 95, tech_stack: ["Custom", "Stripe"], advertiser_id: insertedAdvertisers[6].id },
      { domain: "beautyglowshop.com", page_count: 67, sales_pages: 8, compliance_pages: 12, suspicion_score: 32, tech_stack: ["Shopify", "Judge.me"], advertiser_id: insertedAdvertisers[7].id },
    ];

    const { data: insertedDomains, error: domError } = await supabase
      .from("domains")
      .insert(domains.map(d => ({ ...d, tenant_id: tenantId })))
      .select();

    if (domError) {
      console.error("Domain insert error:", domError);
      throw domError;
    }

    // Create demo ads
    const ads = [
      { page_name: "FitLife Pro", headline: "Transform Your Body in 30 Days", primary_text: "Discover the proven method that helped 50,000+ people achieve their dream body...", cta: "Shop Now", media_type: "video", countries: ["US", "CA"], language: "en", status: "active", suspicion_score: 78, engagement_score: 85, longevity_days: 45, region: "North America", start_date: "2024-01-15", advertiser_id: insertedAdvertisers[0].id, domain_id: insertedDomains[0].id, copy_sentiment: "Urgent", visual_hook_score: 82, offer_category: "Physical Product", is_cloaked_flag: true },
      { page_name: "FitLife Pro", headline: "Summer Body Challenge", primary_text: "Join thousands who transformed their lives with our 8-week program...", cta: "Sign Up", media_type: "image", countries: ["US"], language: "en", status: "active", suspicion_score: 72, engagement_score: 78, longevity_days: 30, region: "North America", start_date: "2024-01-20", advertiser_id: insertedAdvertisers[0].id, domain_id: insertedDomains[1].id, copy_sentiment: "Emotional", visual_hook_score: 75, offer_category: "Digital Course", is_cloaked_flag: false },
      { page_name: "Crypto Wealth Academy", headline: "Learn How Ordinary People Make $10k/Month", primary_text: "This simple crypto strategy is changing lives. No experience needed...", cta: "Learn More", media_type: "video", countries: ["US", "UK", "AU"], language: "en", status: "active", suspicion_score: 92, engagement_score: 95, longevity_days: 60, region: "Global", start_date: "2024-01-12", advertiser_id: insertedAdvertisers[1].id, domain_id: insertedDomains[2].id, copy_sentiment: "Scarcity", visual_hook_score: 94, offer_category: "Digital Course", is_cloaked_flag: true },
      { page_name: "Crypto Wealth Academy", headline: "Retire Early With Crypto", primary_text: "Free masterclass reveals the exact system used by top traders...", cta: "Watch Now", media_type: "video", countries: ["UK", "DE"], language: "en", status: "active", suspicion_score: 96, engagement_score: 92, longevity_days: 55, region: "Europe", start_date: "2024-01-14", advertiser_id: insertedAdvertisers[1].id, domain_id: insertedDomains[3].id, copy_sentiment: "Urgent", visual_hook_score: 91, offer_category: "Digital Course", is_cloaked_flag: true },
      { page_name: "Natural Health Store", headline: "Ancient Secret to Natural Weight Loss", primary_text: "Discover what doctors don't want you to know about natural health...", cta: "Shop Now", media_type: "video", countries: ["US", "CA", "UK"], language: "en", status: "active", suspicion_score: 45, engagement_score: 62, longevity_days: 90, region: "North America", start_date: "2024-01-10", advertiser_id: insertedAdvertisers[2].id, domain_id: insertedDomains[4].id, copy_sentiment: "Informative", visual_hook_score: 58, offer_category: "Physical Product", is_cloaked_flag: false },
      { page_name: "Tech Gadgets HQ", headline: "Revolutionary Smart Device Everyone Talks About", primary_text: "The gadget that sold out 3 times is back in stock...", cta: "Order Now", media_type: "image", countries: ["US", "AU", "NZ"], language: "en", status: "inactive", suspicion_score: 23, engagement_score: 45, longevity_days: 120, region: "Pacific", start_date: "2024-01-08", advertiser_id: insertedAdvertisers[3].id, domain_id: insertedDomains[5].id, copy_sentiment: "Informative", visual_hook_score: 42, offer_category: "Physical Product", is_cloaked_flag: false },
      { page_name: "Finance Freedom Co", headline: "How I Paid Off $50k in Debt", primary_text: "This simple trick helped me become debt-free in just 18 months...", cta: "Sign Up", media_type: "video", countries: ["US"], language: "en", status: "active", suspicion_score: 67, engagement_score: 73, longevity_days: 75, region: "North America", start_date: "2024-01-05", advertiser_id: insertedAdvertisers[4].id, domain_id: insertedDomains[6].id, copy_sentiment: "Emotional", visual_hook_score: 70, offer_category: "Digital Course", is_cloaked_flag: true },
      { page_name: "Keto Diet Secrets", headline: "Lose 20lbs Without Exercise", primary_text: "The keto hack that celebrities use to stay slim year-round...", cta: "Get Started", media_type: "video", countries: ["US", "UK"], language: "en", status: "active", suspicion_score: 85, engagement_score: 88, longevity_days: 40, region: "North America", start_date: "2024-01-18", advertiser_id: insertedAdvertisers[5].id, domain_id: insertedDomains[7].id, copy_sentiment: "Urgent", visual_hook_score: 86, offer_category: "Physical Product", is_cloaked_flag: true },
      { page_name: "Forex Masters", headline: "Copy Our Winning Trades", primary_text: "Join 10,000+ traders who profit daily with our signals...", cta: "Join Now", media_type: "video", countries: ["US", "UK", "SG", "AE"], language: "en", status: "active", suspicion_score: 95, engagement_score: 97, longevity_days: 35, region: "Global", start_date: "2024-01-22", advertiser_id: insertedAdvertisers[6].id, domain_id: insertedDomains[8].id, copy_sentiment: "Scarcity", visual_hook_score: 96, offer_category: "Digital Course", is_cloaked_flag: true },
      { page_name: "Beauty Glow Shop", headline: "Celebrity Skincare Routine Revealed", primary_text: "Get the same glowing skin as your favorite stars with our products...", cta: "Shop Now", media_type: "image", countries: ["US", "CA", "UK", "AU"], language: "en", status: "active", suspicion_score: 32, engagement_score: 55, longevity_days: 150, region: "Global", start_date: "2023-12-01", advertiser_id: insertedAdvertisers[7].id, domain_id: insertedDomains[9].id, copy_sentiment: "Informative", visual_hook_score: 52, offer_category: "Physical Product", is_cloaked_flag: false },
      { page_name: "Crypto Wealth Academy", headline: "Bitcoin to $100k - Are You Ready?", primary_text: "Position yourself before the next bull run with our proven strategy...", cta: "Learn More", media_type: "video", countries: ["US", "CA", "AU", "UK", "DE"], language: "en", status: "active", suspicion_score: 89, engagement_score: 91, longevity_days: 25, region: "Global", start_date: "2024-01-25", advertiser_id: insertedAdvertisers[1].id, domain_id: insertedDomains[2].id, copy_sentiment: "Urgent", visual_hook_score: 89, offer_category: "Digital Course", is_cloaked_flag: true },
      { page_name: "Forex Masters", headline: "From $500 to $50,000", primary_text: "See how one trader turned a small account into a fortune...", cta: "Start Trading", media_type: "video", countries: ["US", "UK", "AU"], language: "en", status: "active", suspicion_score: 98, engagement_score: 94, longevity_days: 20, region: "Global", start_date: "2024-01-28", advertiser_id: insertedAdvertisers[6].id, domain_id: insertedDomains[8].id, copy_sentiment: "Scarcity", visual_hook_score: 95, offer_category: "Digital Course", is_cloaked_flag: true },
    ];

    const { error: adsError } = await supabase
      .from("ads")
      .insert(ads.map(a => ({ ...a, tenant_id: tenantId })));

    if (adsError) {
      console.error("Ads insert error:", adsError);
      throw adsError;
    }

    // Create niche trends
    const nicheTrends = [
      { niche_name: "Cryptocurrency", velocity_score: 95, saturation_level: "High", new_ads_7d: 234, velocity_change: "+15%", top_advertisers: ["Crypto Wealth Academy", "Forex Masters"] },
      { niche_name: "Weight Loss", velocity_score: 82, saturation_level: "High", new_ads_7d: 189, velocity_change: "+8%", top_advertisers: ["FitLife Pro", "Keto Diet Secrets"] },
      { niche_name: "Finance/Debt", velocity_score: 67, saturation_level: "Medium", new_ads_7d: 98, velocity_change: "+3%", top_advertisers: ["Finance Freedom Co"] },
      { niche_name: "Skincare", velocity_score: 45, saturation_level: "Medium", new_ads_7d: 67, velocity_change: "-2%", top_advertisers: ["Beauty Glow Shop"] },
      { niche_name: "Tech Gadgets", velocity_score: 38, saturation_level: "Low", new_ads_7d: 45, velocity_change: "-5%", top_advertisers: ["Tech Gadgets HQ"] },
      { niche_name: "Forex Trading", velocity_score: 91, saturation_level: "High", new_ads_7d: 156, velocity_change: "+22%", top_advertisers: ["Forex Masters"] },
    ];

    const { error: trendsError } = await supabase
      .from("niche_trends")
      .insert(nicheTrends.map(t => ({ ...t, tenant_id: tenantId })));

    if (trendsError) {
      console.error("Trends insert error:", trendsError);
      throw trendsError;
    }

    // Create analysis scores
    const analysisScores = ads.slice(0, 6).map((ad, idx) => ({
      tenant_id: tenantId,
      ad_id: null, // Will need to fetch actual ad IDs
      creative_rotation_score: Math.floor(Math.random() * 30) + 10,
      ad_domain_disparity_score: Math.floor(Math.random() * 25) + 5,
      behavioral_divergence_score: Math.floor(Math.random() * 35) + 15,
      redirect_chain_score: Math.floor(Math.random() * 20) + 5,
      ad_lp_mismatch_score: Math.floor(Math.random() * 25) + 10,
      domain_mapping_score: Math.floor(Math.random() * 20) + 5,
      total_score: ad.suspicion_score,
      risk_level: ad.suspicion_score > 70 ? "high" : ad.suspicion_score > 40 ? "medium" : "low",
    }));

    await supabase.from("analysis_scores").insert(analysisScores);

    console.log("Demo data seeded successfully");

    return new Response(JSON.stringify({ success: true, message: "Demo data seeded successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Seed error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
