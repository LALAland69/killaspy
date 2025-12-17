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
const AD_DELIVERY_DATE_MIN_BASE = "2025-01-01";

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
  bylines?: string;
}

function formatDateForFacebook(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getIncrementalStartDate(hoursBack: number = 6): string {
  const date = new Date();
  date.setHours(date.getHours() - hoursBack);
  return formatDateForFacebook(date);
}

async function fetchAdsPage(
  keyword: string,
  country: string,
  adActiveStatus: "ALL" | "ACTIVE" | "INACTIVE",
  dateMin: string,
  limit: number = 100,
  afterCursor?: string
): Promise<{ ads: FacebookAd[]; nextCursor?: string }> {
  if (!FACEBOOK_ACCESS_TOKEN) {
    console.error("FACEBOOK_ACCESS_TOKEN not configured");
    return { ads: [] };
  }

  const params = new URLSearchParams({
    access_token: FACEBOOK_ACCESS_TOKEN,
    search_terms: keyword,
    ad_reached_countries: `["${country}"]`,
    ad_active_status: adActiveStatus,
    ad_delivery_date_min: dateMin,
    fields: "id,ad_creation_time,ad_delivery_start_time,ad_delivery_stop_time,page_id,page_name,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_snapshot_url,languages,publisher_platforms,estimated_audience_size,impressions,spend,bylines",
    limit: limit.toString(),
  });

  if (afterCursor) {
    params.append("after", afterCursor);
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/ads_archive?${params}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Facebook API error for keyword "${keyword}":`, errorText);
      return { ads: [] };
    }

    const result = await response.json();
    return {
      ads: result.data || [],
      nextCursor: result.paging?.cursors?.after,
    };
  } catch (error) {
    console.error(`Error fetching ads for keyword "${keyword}":`, error);
    return { ads: [] };
  }
}

async function fetchAllAdsForKeyword(
  keyword: string,
  country: string,
  dateMin: string,
  maxAds: number = 1000
): Promise<FacebookAd[]> {
  const allAds: FacebookAd[] = [];
  let afterCursor: string | undefined;
  const limit = 100;

  console.log(`Fetching ALL ads (active+inactive) for "${keyword}" in ${country} since ${dateMin}`);

  while (allAds.length < maxAds) {
    const { ads, nextCursor } = await fetchAdsPage(
      keyword, 
      country, 
      "ALL", // Get both active AND inactive
      dateMin, 
      limit, 
      afterCursor
    );

    if (ads.length === 0) break;
    
    allAds.push(...ads);
    console.log(`  Collected ${allAds.length} ads so far...`);

    if (!nextCursor || ads.length < limit) break;
    
    afterCursor = nextCursor;
    await new Promise(resolve => setTimeout(resolve, 300));
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

  console.log(`Processing ${ads.length} ads for storage...`);

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

      // Determine status based on delivery stop time
      const isInactive = ad.ad_delivery_stop_time && new Date(ad.ad_delivery_stop_time) < new Date();

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
        status: isInactive ? "inactive" : "active",
        media_url: ad.ad_snapshot_url || null,
        // Detect media type from snapshot URL
        media_type: ad.ad_snapshot_url?.includes("video") ? "video" : "image",
      };

      if (existingAd) {
        const { error } = await supabase
          .from("ads")
          .update({ ...adData, updated_at: new Date().toISOString() })
          .eq("id", existingAd.id);

        if (error) {
          errors++;
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase.from("ads").insert(adData);

        if (error) {
          errors++;
        } else {
          imported++;
        }
      }
    } catch (error) {
      errors++;
    }
  }

  console.log(`Processed: ${imported} imported, ${updated} updated, ${errors} errors`);
  return { imported, updated, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const authHeader = req.headers.get("Authorization");
    let tenantId: string | null = null;
    let categoryId: string | null = null;
    let isScheduled = false;
    let isFullHarvest = false;
    let incrementalHours = 6;

    const body = await req.json().catch(() => ({}));
    
    if (body.scheduled === true) {
      isScheduled = true;
      isFullHarvest = body.fullHarvest === true;
      incrementalHours = body.incrementalHours || 6;
      
      const harvestType = isFullHarvest ? "FULL (all 2025)" : `INCREMENTAL (last ${incrementalHours}h)`;
      console.log(`Running ${harvestType} scheduled harvest for all tenants`);
    } else if (authHeader) {
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
      isFullHarvest = body.fullHarvest === true;
    }

    // Determine the date filter
    const dateMin = isFullHarvest 
      ? AD_DELIVERY_DATE_MIN_BASE  // Full: desde 01/01/2025
      : getIncrementalStartDate(incrementalHours); // Incremental: últimas X horas

    console.log(`Date filter: ads since ${dateMin}`);

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
      console.log(`\n=== Processing category: ${category.name} ===`);
      
      const allAds: FacebookAd[] = [];
      
      // Prioritize Brazil - fetch BR first
      const sortedCountries = [...category.countries].sort((a, b) => {
        if (a === "BR") return -1;
        if (b === "BR") return 1;
        return 0;
      });

      for (const keyword of category.keywords) {
        for (const country of sortedCountries) {
          const maxAdsPerQuery = isFullHarvest ? 1000 : 200;
          const ads = await fetchAllAdsForKeyword(keyword, country, dateMin, maxAdsPerQuery);
          allAds.push(...ads);
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Deduplicate by ad ID
      const uniqueAds = Array.from(
        new Map(allAds.map(ad => [ad.id, ad])).values()
      );

      console.log(`Found ${uniqueAds.length} unique ads for category ${category.name}`);

      if (uniqueAds.length > 0) {
        const results = await processAndStoreAds(
          uniqueAds,
          category.tenant_id,
          category.id,
          supabaseAdmin
        );

        totalImported += results.imported;
        totalUpdated += results.updated;
        totalErrors += results.errors;
      }

      // Update category with harvest timestamp and count
      const { count } = await supabaseAdmin
        .from("ads")
        .select("id", { count: "exact", head: true })
        .eq("category_id", category.id)
        .eq("tenant_id", category.tenant_id);

      await supabaseAdmin
        .from("ad_categories")
        .update({
          last_harvest_at: new Date().toISOString(),
          ads_count: count || 0,
        })
        .eq("id", category.id);
    }

    // Log job run if scheduled
    if (isScheduled) {
      await supabaseAdmin.from("job_runs").insert({
        job_name: isFullHarvest ? "Full Harvest 2025" : `Incremental Harvest (${incrementalHours}h)`,
        task_type: "ad_harvest",
        schedule_type: isFullHarvest ? "manual" : `${incrementalHours}h`,
        status: totalErrors > 0 ? "completed_with_errors" : "completed",
        ads_processed: totalImported + totalUpdated,
        errors_count: totalErrors,
        completed_at: new Date().toISOString(),
        metadata: { 
          imported: totalImported, 
          updated: totalUpdated,
          dateMin,
          harvestType: isFullHarvest ? "full" : "incremental",
          incrementalHours: isFullHarvest ? null : incrementalHours,
        },
      });
    }

    console.log(`\n=== HARVEST COMPLETE ===`);
    console.log(`Imported: ${totalImported}, Updated: ${totalUpdated}, Errors: ${totalErrors}`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: totalImported,
        updated: totalUpdated,
        errors: totalErrors,
        dateMin,
        harvestType: isFullHarvest ? "full" : "incremental",
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
