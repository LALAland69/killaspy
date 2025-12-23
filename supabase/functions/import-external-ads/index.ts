import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.88.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdData {
  ad_library_id: string;
  page_name: string;
  page_id?: string;
  primary_text?: string;
  headline?: string;
  cta?: string;
  media_url?: string;
  media_type?: string;
  start_date?: string;
  end_date?: string;
  countries?: string[];
  status?: string;
}

// Parse CSV to array of objects
function parseCSV(csv: string): AdData[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const result: AdData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      let value: any = values[index];
      
      // Handle countries as array
      if (header === 'countries' && value) {
        value = value.split(',').map((c: string) => c.trim());
      }
      
      obj[header] = value;
    });

    if (obj.ad_library_id || obj.id) {
      result.push({
        ad_library_id: obj.ad_library_id || obj.id,
        page_name: obj.page_name || 'Unknown',
        page_id: obj.page_id,
        primary_text: obj.primary_text || obj.body || obj.text,
        headline: obj.headline || obj.title,
        cta: obj.cta || obj.call_to_action,
        media_url: obj.media_url || obj.image_url || obj.video_url,
        media_type: obj.media_type || 'image',
        start_date: obj.start_date || obj.ad_delivery_start_time,
        end_date: obj.end_date || obj.ad_delivery_stop_time,
        countries: obj.countries,
        status: obj.status || 'active',
      });
    }
  }

  return result;
}

// Normalize external ad data to our schema
function normalizeAdData(raw: any): AdData | null {
  // Handle different field names from various sources
  const adId = raw.ad_library_id || raw.id || raw._id || raw.ad_archive_id;
  
  if (!adId) return null;

  return {
    ad_library_id: String(adId),
    page_name: raw.page_name || raw.advertiser_name || 'Unknown',
    page_id: raw.page_id,
    primary_text: raw.primary_text || raw.ad_creative_bodies?.[0] || raw.body?.text || raw.text,
    headline: raw.headline || raw.ad_creative_link_titles?.[0] || raw.title,
    cta: raw.cta || raw.cta_text || raw.call_to_action,
    media_url: raw.media_url || raw.snapshot?.videos?.[0]?.video_hd_url || raw.image_url,
    media_type: raw.media_type || (raw.snapshot?.display_format?.toLowerCase()) || 'image',
    start_date: raw.start_date || raw.ad_delivery_start_time || raw.ad_creation_time,
    end_date: raw.end_date || raw.ad_delivery_stop_time,
    countries: raw.countries || raw.ad_reached_countries,
    status: raw.status || (raw.is_active ? 'active' : 'inactive'),
  };
}

// Import ads to database
async function importAds(
  supabase: any,
  ads: AdData[],
  tenantId: string
): Promise<{ imported: number; updated: number; errors: number; errorDetails: string[] }> {
  let imported = 0;
  let updated = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  for (const ad of ads) {
    try {
      // Check if ad already exists
      const { data: existing } = await supabase
        .from('ads')
        .select('id')
        .eq('ad_library_id', ad.ad_library_id)
        .eq('tenant_id', tenantId)
        .single();

      // Find or create advertiser
      let advertiserId: string | null = null;
      
      if (ad.page_id || ad.page_name) {
        const { data: advertiser } = await supabase
          .from('advertisers')
          .select('id')
          .eq('tenant_id', tenantId)
          .or(`page_id.eq.${ad.page_id},name.eq.${ad.page_name}`)
          .single();

        if (advertiser) {
          advertiserId = advertiser.id;
        } else {
          const { data: newAdvertiser } = await supabase
            .from('advertisers')
            .insert({
              name: ad.page_name,
              page_id: ad.page_id,
              tenant_id: tenantId,
            })
            .select('id')
            .single();
          
          advertiserId = newAdvertiser?.id || null;
        }
      }

      const adRecord = {
        ad_library_id: ad.ad_library_id,
        page_name: ad.page_name,
        primary_text: ad.primary_text,
        headline: ad.headline,
        cta: ad.cta,
        media_url: ad.media_url,
        media_type: ad.media_type,
        start_date: ad.start_date,
        end_date: ad.end_date,
        countries: ad.countries,
        status: ad.status || 'active',
        advertiser_id: advertiserId,
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update existing ad
        const { error } = await supabase
          .from('ads')
          .update(adRecord)
          .eq('id', existing.id);

        if (error) throw error;
        updated++;
      } else {
        // Insert new ad
        const { error } = await supabase
          .from('ads')
          .insert(adRecord);

        if (error) throw error;
        imported++;
      }
    } catch (error) {
      errors++;
      errorDetails.push(`Ad ${ad.ad_library_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`Error importing ad ${ad.ad_library_id}:`, error);
    }
  }

  return { imported, updated, errors, errorDetails };
}

// Fetch ad from ad-archive.nexxxt.cloud API
async function fetchExternalAd(adId: string): Promise<any> {
  const response = await fetch(`https://ad-archive.nexxxt.cloud/ad/${adId}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ad: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's tenant_id from auth
    const authHeader = req.headers.get('Authorization');
    let tenantId: string;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'No tenant found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      tenantId = profile.tenant_id;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Action: ${action}, Tenant: ${tenantId}`);

    switch (action) {
      case 'fetch_ad': {
        // Fetch single ad from external source
        const { ad_id } = params;
        
        if (!ad_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'ad_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Fetching ad: ${ad_id}`);
        const externalAd = await fetchExternalAd(ad_id);
        const normalizedAd = normalizeAdData(externalAd);

        if (!normalizedAd) {
          return new Response(
            JSON.stringify({ success: false, error: 'Could not parse ad data' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const result = await importAds(supabase, [normalizedAd], tenantId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            ad: normalizedAd,
            ...result 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'fetch_page': {
        // This would require pagination support from the external API
        // For now, return a message about limitations
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Page import requires verified API access. Please use the ad-archive.nexxxt.cloud website to export data and use manual import.',
            suggestion: 'Use manual JSON/CSV import for bulk data'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'import_manual': {
        // Import from user-provided JSON or CSV
        const { format, data } = params;

        if (!data) {
          return new Response(
            JSON.stringify({ success: false, error: 'data is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let ads: AdData[] = [];

        if (format === 'json') {
          try {
            const parsed = JSON.parse(data);
            const rawAds = Array.isArray(parsed) ? parsed : [parsed];
            ads = rawAds.map(normalizeAdData).filter((a): a is AdData => a !== null);
          } catch {
            return new Response(
              JSON.stringify({ success: false, error: 'Invalid JSON format' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else if (format === 'csv') {
          ads = parseCSV(data);
        } else {
          return new Response(
            JSON.stringify({ success: false, error: 'format must be json or csv' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (ads.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'No valid ads found in data' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Importing ${ads.length} ads manually`);
        const result = await importAds(supabase, ads, tenantId);

        return new Response(
          JSON.stringify({ 
            success: true,
            total: ads.length,
            ...result 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in import-external-ads:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
