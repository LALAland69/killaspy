import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FACEBOOK_ACCESS_TOKEN = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface AdLibraryParams {
  search_terms?: string;
  ad_type?: string;
  ad_reached_countries?: string[];
  ad_active_status?: string;
  search_page_ids?: string[];
  limit?: number;
}

interface FacebookAd {
  id: string;
  ad_creation_time?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_titles?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  page_id?: string;
  page_name?: string;
  publisher_platforms?: string[];
  languages?: string[];
  estimated_audience_size?: { lower_bound: number; upper_bound: number };
  spend?: { lower_bound: string; upper_bound: string };
  impressions?: { lower_bound: string; upper_bound: string };
  bylines?: string;
  ad_snapshot_url?: string;
}

async function fetchFromAdLibrary(params: AdLibraryParams): Promise<FacebookAd[]> {
  const baseUrl = 'https://graph.facebook.com/v18.0/ads_archive';
  
  const queryParams = new URLSearchParams({
    access_token: FACEBOOK_ACCESS_TOKEN!,
    ad_type: params.ad_type || 'ALL',
    ad_active_status: params.ad_active_status || 'ALL',
    fields: 'id,ad_creation_time,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,ad_delivery_start_time,ad_delivery_stop_time,page_id,page_name,publisher_platforms,languages,estimated_audience_size,spend,impressions,bylines,ad_snapshot_url',
    limit: String(params.limit || 50),
  });

  if (params.search_terms) {
    queryParams.append('search_terms', params.search_terms);
  }

  if (params.ad_reached_countries && params.ad_reached_countries.length > 0) {
    queryParams.append('ad_reached_countries', JSON.stringify(params.ad_reached_countries));
  }

  if (params.search_page_ids && params.search_page_ids.length > 0) {
    queryParams.append('search_page_ids', params.search_page_ids.join(','));
  }

  console.log('Fetching from Ad Library:', `${baseUrl}?${queryParams.toString().replace(FACEBOOK_ACCESS_TOKEN!, '[REDACTED]')}`);

  const response = await fetch(`${baseUrl}?${queryParams.toString()}`);
  const data = await response.json();

  if (data.error) {
    console.error('Facebook API Error:', data.error);
    throw new Error(data.error.message || 'Failed to fetch from Ad Library');
  }

  console.log(`Fetched ${data.data?.length || 0} ads from Ad Library`);
  return data.data || [];
}

async function processAndStoreAds(ads: FacebookAd[], tenantId: string, supabase: any) {
  const results = {
    imported: 0,
    updated: 0,
    errors: 0,
    advertisers_created: 0,
  };

  for (const ad of ads) {
    try {
      // First, check/create advertiser
      let advertiserId: string | null = null;
      
      if (ad.page_id) {
        const { data: existingAdvertiser } = await supabase
          .from('advertisers')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('page_id', ad.page_id)
          .single();

        if (existingAdvertiser) {
          advertiserId = existingAdvertiser.id;
        } else {
          const { data: newAdvertiser, error: advError } = await supabase
            .from('advertisers')
            .insert({
              tenant_id: tenantId,
              name: ad.page_name || 'Unknown Advertiser',
              page_id: ad.page_id,
            })
            .select('id')
            .single();

          if (newAdvertiser) {
            advertiserId = newAdvertiser.id;
            results.advertisers_created++;
          }
          if (advError) console.error('Error creating advertiser:', advError);
        }
      }

      // Check if ad already exists
      const { data: existingAd } = await supabase
        .from('ads')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('ad_library_id', ad.id)
        .single();

      const primaryText = ad.ad_creative_bodies?.[0] || null;
      const headline = ad.ad_creative_link_titles?.[0] || null;
      const cta = ad.ad_creative_link_captions?.[0] || null;

      const adData = {
        tenant_id: tenantId,
        advertiser_id: advertiserId,
        ad_library_id: ad.id,
        page_name: ad.page_name,
        primary_text: primaryText,
        headline: headline,
        cta: cta,
        start_date: ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time).toISOString().split('T')[0] : null,
        end_date: ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time).toISOString().split('T')[0] : null,
        language: ad.languages?.[0] || null,
        status: ad.ad_delivery_stop_time ? 'inactive' : 'active',
        media_url: ad.ad_snapshot_url,
        longevity_days: ad.ad_delivery_start_time 
          ? Math.floor((Date.now() - new Date(ad.ad_delivery_start_time).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      };

      if (existingAd) {
        const { error } = await supabase
          .from('ads')
          .update(adData)
          .eq('id', existingAd.id);

        if (error) {
          console.error('Error updating ad:', error);
          results.errors++;
        } else {
          results.updated++;
        }
      } else {
        const { error } = await supabase
          .from('ads')
          .insert(adData);

        if (error) {
          console.error('Error inserting ad:', error);
          results.errors++;
        } else {
          results.imported++;
        }
      }
    } catch (err) {
      console.error('Error processing ad:', ad.id, err);
      results.errors++;
    }
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!FACEBOOK_ACCESS_TOKEN) {
      throw new Error('Facebook Access Token not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's token for RLS
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user's tenant_id
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.tenant_id) {
      throw new Error('User tenant not found');
    }

    // Use service role client for inserts (bypasses RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { action, params } = body;

    console.log('Action:', action, 'Params:', params);

    if (action === 'search') {
      const ads = await fetchFromAdLibrary(params);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          ads: ads.map(ad => ({
            id: ad.id,
            page_name: ad.page_name,
            page_id: ad.page_id,
            primary_text: ad.ad_creative_bodies?.[0],
            headline: ad.ad_creative_link_titles?.[0],
            start_date: ad.ad_delivery_start_time,
            end_date: ad.ad_delivery_stop_time,
            snapshot_url: ad.ad_snapshot_url,
          })),
          count: ads.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import') {
      const ads = await fetchFromAdLibrary(params);
      const results = await processAndStoreAds(ads, profile.tenant_id, supabaseAdmin);

      // Log the job run
      await supabaseAdmin.from('job_runs').insert({
        tenant_id: profile.tenant_id,
        job_name: 'Facebook Ad Library Import',
        task_type: 'ad_import',
        schedule_type: 'manual',
        status: 'completed',
        ads_processed: ads.length,
        completed_at: new Date().toISOString(),
        metadata: { 
          search_params: params,
          results 
        },
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Import completed',
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Error in facebook-ad-library function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
