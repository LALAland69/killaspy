import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FACEBOOK_ACCESS_TOKEN = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Filter for 2025 ads only
const AD_DELIVERY_DATE_MIN = "2025-01-01";

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
}

async function fetchAdsForKeyword(
  keyword: string,
  country: string,
  limit: number = 100,
  activeOnly: boolean = false
): Promise<FacebookAd[]> {
  if (!FACEBOOK_ACCESS_TOKEN) {
    console.error("FACEBOOK_ACCESS_TOKEN not configured");
    return [];
  }

  const params = new URLSearchParams({
    access_token: FACEBOOK_ACCESS_TOKEN,
    search_terms: keyword,
    ad_reached_countries: `["${country}"]`,
    ad_active_status: activeOnly ? "ACTIVE" : "ALL",
    ad_delivery_date_min: AD_DELIVERY_DATE_MIN,
    fields: "id,ad_creation_time,ad_delivery_start_time,ad_delivery_stop_time,page_id,page_name,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_snapshot_url,languages,publisher_platforms,estimated_audience_size,impressions,spend",
    limit: limit.toString(),
  });

  try {
    console.log(`Fetching ${activeOnly ? 'ACTIVE' : 'ALL'} ads for "${keyword}" in ${country} (2025+, limit: ${limit})`);
    
    const response = await fetch(
      `https://graph.facebook.com/v21.0/ads_archive?${params}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Facebook API error for keyword "${keyword}":`, errorText);
      return [];
    }

    const result = await response.json();
    const ads = result.data || [];
    console.log(`Got ${ads.length} ads for "${keyword}" in ${country}`);
    return ads;
  } catch (error) {
    console.error(`Error fetching ads for keyword "${keyword}":`, error);
    return [];
  }
}

async function fetchAllPagesForKeyword(
  keyword: string,
  country: string,
  maxAds: number = 500
): Promise<FacebookAd[]> {
  if (!FACEBOOK_ACCESS_TOKEN) {
    console.error("FACEBOOK_ACCESS_TOKEN not configured");
    return [];
  }

  const allAds: FacebookAd[] = [];
  let nextUrl: string | null = null;
  const limit = 100; // Max per request

  const params = new URLSearchParams({
    access_token: FACEBOOK_ACCESS_TOKEN,
    search_terms: keyword,
    ad_reached_countries: `["${country}"]`,
    ad_active_status: "ALL",
    ad_delivery_date_min: AD_DELIVERY_DATE_MIN,
    fields: "id,ad_creation_time,ad_delivery_start_time,ad_delivery_stop_time,page_id,page_name,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_snapshot_url,languages,publisher_platforms,estimated_audience_size,impressions,spend",
    limit: limit.toString(),
  });

  let url = `https://graph.facebook.com/v21.0/ads_archive?${params}`;

  while (url && allAds.length < maxAds) {
    try {
      console.log(`Fetching page for "${keyword}" in ${country} (collected: ${allAds.length})`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Facebook API error for keyword "${keyword}":`, errorText);
        break;
      }

      const result = await response.json();
      const ads = result.data || [];
      allAds.push(...ads);
      
      // Check for next page
      nextUrl = result.paging?.next || null;
      url = nextUrl!;
      
      if (!nextUrl || ads.length < limit) {
        break;
      }
      
      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Error fetching ads for keyword "${keyword}":`, error);
      break;
    }
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
        status: ad.ad_delivery_stop_time ? "inactive" : "active",
        media_url: ad.ad_snapshot_url || null,
      };

      if (existingAd) {
        const { error } = await supabase
          .from("ads")
          .update({ ...adData, updated_at: new Date().toISOString() })
          .eq("id", existingAd.id);

        if (error) {
          console.error("Error updating ad:", error);
          errors++;
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase.from("ads").insert(adData);

        if (error) {
          console.error("Error inserting ad:", error);
          errors++;
        } else {
          imported++;
        }
      }
    } catch (error) {
      console.error("Error processing ad:", error);
      errors++;
    }
  }

  return { imported, updated, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if this is a scheduled call (no auth) or user call
    const authHeader = req.headers.get("Authorization");
    let tenantId: string | null = null;
    let categoryId: string | null = null;
    let isScheduled = false;
    let fullHarvest = false;

    const body = await req.json().catch(() => ({}));
    
    if (body.scheduled === true) {
      // Scheduled job - process all active categories
      isScheduled = true;
      fullHarvest = body.fullHarvest === true;
      console.log(`Running ${fullHarvest ? 'FULL' : 'incremental'} scheduled harvest for all tenants (2025 ads only)`);
    } else if (authHeader) {
      // User-initiated harvest
      const supabaseClient = createClient(
        SUPABASE_URL,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.tenant_id) {
        return new Response(
          JSON.stringify({ success: false, error: "No tenant found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      tenantId = profile.tenant_id;
      categoryId = body.categoryId;
      fullHarvest = body.fullHarvest === true;
    }

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
      console.log(`Processing category: ${category.name} for tenant: ${category.tenant_id}`);
      
      const allAds: FacebookAd[] = [];
      
      // Fetch ads for each keyword in each country
      for (const keyword of category.keywords) {
        for (const country of category.countries) {
          let ads: FacebookAd[];
          
          if (fullHarvest) {
            // Full harvest - paginate through all available ads (up to 500 per keyword/country)
            ads = await fetchAllPagesForKeyword(keyword, country, 500);
          } else {
            // Incremental - just fetch latest 100 ads
            ads = await fetchAdsForKeyword(keyword, country, 100, false);
          }
          
          allAds.push(...ads);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Deduplicate by ad ID
      const uniqueAds = Array.from(
        new Map(allAds.map(ad => [ad.id, ad])).values()
      );

      console.log(`Found ${uniqueAds.length} unique ads for category ${category.name}`);

      // Process and store ads
      const results = await processAndStoreAds(
        uniqueAds,
        category.tenant_id,
        category.id,
        supabaseAdmin
      );

      totalImported += results.imported;
      totalUpdated += results.updated;
      totalErrors += results.errors;

      // Update category with harvest timestamp and count
      const { data: adCount } = await supabaseAdmin
        .from("ads")
        .select("id", { count: "exact" })
        .eq("category_id", category.id)
        .eq("tenant_id", category.tenant_id);

      await supabaseAdmin
        .from("ad_categories")
        .update({
          last_harvest_at: new Date().toISOString(),
          ads_count: adCount?.length || 0,
        })
        .eq("id", category.id);
    }

    // Log job run if scheduled
    if (isScheduled) {
      await supabaseAdmin.from("job_runs").insert({
        job_name: fullHarvest ? "Full Harvest Ads 2025" : "Incremental Harvest Ads",
        task_type: "ad_harvest",
        schedule_type: fullHarvest ? "manual" : "6h",
        status: totalErrors > 0 ? "completed_with_errors" : "completed",
        ads_processed: totalImported + totalUpdated,
        errors_count: totalErrors,
        completed_at: new Date().toISOString(),
        metadata: { 
          imported: totalImported, 
          updated: totalUpdated,
          year_filter: "2025",
          harvest_type: fullHarvest ? "full" : "incremental"
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: totalImported,
        updated: totalUpdated,
        errors: totalErrors,
        yearFilter: "2025",
        harvestType: fullHarvest ? "full" : "incremental",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Harvest error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
