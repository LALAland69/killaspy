import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.88.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface ScrapedAd {
  ad_library_id: string;
  page_name: string;
  page_id?: string;
  primary_text?: string;
  headline?: string;
  cta?: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'carousel';
  start_date?: string;
  end_date?: string;
  countries?: string[];
  status?: string;
  platform?: string;
  snapshot_url?: string;
  raw_data?: Record<string, unknown>;
}

interface WebhookPayload {
  action: 'batch_import' | 'single_import' | 'ping';
  ads?: ScrapedAd[];
  ad?: ScrapedAd;
  scraper_id?: string;
  metadata?: Record<string, unknown>;
}

// Validate webhook secret
function validateWebhookSecret(req: Request): boolean {
  const webhookSecret = Deno.env.get('HARVEST_CRON_SECRET');
  const providedSecret = req.headers.get('x-webhook-secret');
  
  if (!webhookSecret) {
    console.warn('HARVEST_CRON_SECRET not configured - webhook validation disabled');
    return true; // Allow if not configured (development)
  }
  
  return providedSecret === webhookSecret;
}

// Normalize ad data from different scraper formats
function normalizeAd(raw: ScrapedAd): ScrapedAd {
  return {
    ad_library_id: String(raw.ad_library_id || raw.page_id + '_' + Date.now()),
    page_name: raw.page_name || 'Unknown Advertiser',
    page_id: raw.page_id,
    primary_text: raw.primary_text,
    headline: raw.headline,
    cta: raw.cta,
    media_url: raw.media_url,
    media_type: raw.media_type || 'image',
    start_date: raw.start_date,
    end_date: raw.end_date,
    countries: raw.countries || ['US'],
    status: raw.status || 'active',
    platform: raw.platform || 'facebook',
    snapshot_url: raw.snapshot_url,
    raw_data: raw.raw_data,
  };
}

// Import ads to database
async function importAds(
  supabase: any,
  ads: ScrapedAd[],
  tenantId: string,
  scraperId?: string
): Promise<{ imported: number; updated: number; errors: number; details: string[] }> {
  let imported = 0;
  let updated = 0;
  let errors = 0;
  const details: string[] = [];

  for (const rawAd of ads) {
    try {
      const ad = normalizeAd(rawAd);
      
      // Check if ad exists
      const { data: existing } = await supabase
        .from('ads')
        .select('id')
        .eq('ad_library_id', ad.ad_library_id)
        .eq('tenant_id', tenantId)
        .single();

      // Find or create advertiser
      let advertiserId: string | null = null;
      
      if (ad.page_id || ad.page_name) {
        // Try to find existing advertiser
        let query = supabase
          .from('advertisers')
          .select('id')
          .eq('tenant_id', tenantId);
        
        if (ad.page_id) {
          query = query.eq('page_id', ad.page_id);
        } else {
          query = query.eq('name', ad.page_name);
        }
        
        const { data: advertiser } = await query.single();

        if (advertiser) {
          advertiserId = advertiser.id;
        } else {
          // Create new advertiser
          const { data: newAdvertiser, error: advError } = await supabase
            .from('advertisers')
            .insert({
              name: ad.page_name,
              page_id: ad.page_id,
              tenant_id: tenantId,
              total_ads: 1,
            })
            .select('id')
            .single();
          
          if (!advError && newAdvertiser) {
            advertiserId = newAdvertiser.id;
          }
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
        status: ad.status,
        advertiser_id: advertiserId,
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from('ads')
          .update(adRecord)
          .eq('id', existing.id);

        if (error) throw error;
        updated++;
      } else {
        const { error } = await supabase
          .from('ads')
          .insert(adRecord);

        if (error) throw error;
        imported++;
      }
    } catch (error) {
      errors++;
      details.push(`Ad ${rawAd.ad_library_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Log the import job
  if (scraperId) {
    try {
      await supabase.from('job_runs').insert({
        tenant_id: tenantId,
        job_name: `Webhook Import - ${scraperId}`,
        task_type: 'webhook_import',
        schedule_type: 'external',
        status: errors > 0 ? 'partial' : 'completed',
        ads_processed: imported + updated,
        errors_count: errors,
        completed_at: new Date().toISOString(),
        metadata: { scraper_id: scraperId, imported, updated, errors },
      });
    } catch (e) {
      console.error('Failed to log job run:', e);
    }
  }

  return { imported, updated, errors, details };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Validate webhook secret
    if (!validateWebhookSecret(req)) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: WebhookPayload = await req.json();
    console.log(`Webhook received - Action: ${payload.action}, Scraper: ${payload.scraper_id || 'unknown'}`);

    // Handle ping (health check from scrapers)
    if (payload.action === 'ping') {
      return new Response(
        JSON.stringify({ success: true, message: 'pong', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // For webhook imports, we use a default tenant or the one specified in metadata
    // In production, you'd want to map scraper_id to a specific tenant
    let tenantId = payload.metadata?.tenant_id as string;
    
    if (!tenantId) {
      // Get first tenant as default (for demo purposes)
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .limit(1)
        .single();
      
      if (!tenant) {
        return new Response(
          JSON.stringify({ success: false, error: 'No tenant configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      tenantId = tenant.id;
    }

    // Process based on action
    if (payload.action === 'single_import' && payload.ad) {
      const result = await importAds(supabase, [payload.ad], tenantId, payload.scraper_id);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          ...result,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payload.action === 'batch_import' && payload.ads) {
      if (!Array.isArray(payload.ads) || payload.ads.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'ads array is required and must not be empty' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Processing batch import of ${payload.ads.length} ads`);
      const result = await importAds(supabase, payload.ads, tenantId, payload.scraper_id);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          total: payload.ads.length,
          ...result,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Unknown action: ${payload.action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
