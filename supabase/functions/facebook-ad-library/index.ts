/**
 * Facebook Ad Library Edge Function
 * 
 * Handles:
 * - Token validation and testing
 * - Ad search (preview without storing)
 * - Ad import (fetch and store in database)
 * - Scheduled imports (cron jobs)
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// Environment variables
const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
const FACEBOOK_ACCESS_TOKEN_ENV = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
// Build token in format APP_ID|APP_SECRET (permanent token)
const FACEBOOK_ACCESS_TOKEN = FACEBOOK_APP_ID && FACEBOOK_APP_SECRET 
  ? `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}` 
  : FACEBOOK_ACCESS_TOKEN_ENV;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============= RATE LIMITING =============
const RATE_LIMIT = {
  minTimeBetweenRequests: 200,
  maxRetries: 3,
  baseDelay: 500,
};

const API_VERSIONS = ['v24.0', 'v21.0'];
const TOKEN_ERRORS = [102, 190, 463, 467, 459];
const RATE_LIMIT_ERRORS = [4, 17, 341];
const PERMISSION_ERRORS = [10, 200, 294];
const TRANSIENT_ERRORS = [1, 2];

let lastRequestTime = 0;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT.minTimeBetweenRequests) {
    await delay(RATE_LIMIT.minTimeBetweenRequests - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();
}

function maskToken(token: string | undefined): string {
  if (!token || token.length < 20) return 'INVALID';
  return `${token.substring(0, 10)}...${token.substring(token.length - 5)}`;
}

// ============= INPUT VALIDATION =============
const safeStringPattern = /^[\p{L}\p{N}\s\-_.,!?'"():@#&]+$/u;

const countryCodeSchema = z.string().length(2).regex(/^[A-Z]{2}$/, 'Invalid country code');
const pageIdSchema = z.string().min(1).max(30).regex(/^\d+$/, 'Page ID must be numeric');

const adLibraryParamsSchema = z.object({
  search_terms: z.string().max(500).regex(safeStringPattern).optional(),
  ad_type: z.enum(['ALL', 'POLITICAL_AND_ISSUE_ADS', 'HOUSING_ADS', 'EMPLOYMENT_ADS', 'CREDIT_ADS']).optional(),
  ad_reached_countries: z.array(countryCodeSchema).max(20).optional(),
  ad_active_status: z.enum(['ALL', 'ACTIVE', 'INACTIVE']).optional(),
  search_page_ids: z.array(pageIdSchema).max(50).optional(),
  limit: z.number().int().min(1).max(500).optional(),
}).strict();

type AdLibraryParams = z.infer<typeof adLibraryParamsSchema>;

function validateParams(params: unknown): AdLibraryParams {
  if (!params || typeof params !== 'object') return {};
  try {
    return adLibraryParamsSchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new Error(`Parâmetros inválidos: ${messages}`);
    }
    throw error;
  }
}

// ============= FACEBOOK API TYPES =============
interface FacebookAd {
  id: string;
  ad_creation_time?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
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

interface ApiError {
  category: 'TOKEN_ERROR' | 'RATE_LIMIT' | 'PERMISSION_ERROR' | 'TRANSIENT' | 'VALIDATION_ERROR' | 'UNKNOWN';
  message: string;
  code?: number;
  retryable: boolean;
}

function categorizeError(errorCode: number): ApiError {
  if (TOKEN_ERRORS.includes(errorCode)) {
    return {
      category: 'TOKEN_ERROR',
      message: 'Token inválido ou expirado. Verifique a configuração.',
      code: errorCode,
      retryable: false,
    };
  }
  if (RATE_LIMIT_ERRORS.includes(errorCode)) {
    return {
      category: 'RATE_LIMIT',
      message: 'Limite de requisições atingido. Aguarde alguns minutos.',
      code: errorCode,
      retryable: true,
    };
  }
  if (PERMISSION_ERRORS.includes(errorCode)) {
    return {
      category: 'PERMISSION_ERROR',
      message: 'Permissões insuficientes. Verifique se ads_read está aprovado.',
      code: errorCode,
      retryable: false,
    };
  }
  if (TRANSIENT_ERRORS.includes(errorCode)) {
    return {
      category: 'TRANSIENT',
      message: 'Erro temporário. Tentando novamente...',
      code: errorCode,
      retryable: true,
    };
  }
  return {
    category: 'UNKNOWN',
    message: 'Erro desconhecido na API.',
    code: errorCode,
    retryable: false,
  };
}

// ============= FACEBOOK API CALLS =============
async function fetchFromAdLibrary(params: AdLibraryParams): Promise<FacebookAd[]> {
  if (!FACEBOOK_ACCESS_TOKEN) {
    throw new Error('FACEBOOK_ACCESS_TOKEN não configurado');
  }

  console.log(`[FB-API] fetchFromAdLibrary - Token: ${maskToken(FACEBOOK_ACCESS_TOKEN)}`);
  console.log(`[FB-API] Params:`, JSON.stringify(params));

  const queryParams = new URLSearchParams({
    access_token: FACEBOOK_ACCESS_TOKEN,
    ad_type: params.ad_type || 'ALL',
    ad_active_status: params.ad_active_status || 'ALL',
    limit: String(params.limit || 50),
    fields: [
      'id', 'ad_creation_time', 'ad_creative_bodies', 'ad_creative_link_captions',
      'ad_creative_link_titles', 'ad_creative_link_descriptions', 'ad_delivery_start_time',
      'ad_delivery_stop_time', 'page_id', 'page_name', 'publisher_platforms',
      'languages', 'estimated_audience_size', 'spend', 'impressions', 'bylines', 'ad_snapshot_url'
    ].join(','),
  });

  if (params.search_terms) {
    queryParams.append('search_terms', params.search_terms);
  }
  if (params.ad_reached_countries?.length) {
    queryParams.append('ad_reached_countries', JSON.stringify(params.ad_reached_countries));
  }
  if (params.search_page_ids?.length) {
    queryParams.append('search_page_ids', params.search_page_ids.join(','));
  }

  // Try multiple API versions with retries
  for (const version of API_VERSIONS) {
    for (let attempt = 0; attempt < RATE_LIMIT.maxRetries; attempt++) {
      await enforceRateLimit();

      const url = `https://graph.facebook.com/${version}/ads_archive?${queryParams}`;
      console.log(`[FB-API] Request (${version}, attempt ${attempt + 1}): ${url.replace(FACEBOOK_ACCESS_TOKEN, '[REDACTED]')}`);

      try {
        const startTime = Date.now();
        const response = await fetch(url);
        const responseTime = Date.now() - startTime;
        const responseText = await response.text();

        let data: any;
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { parseError: true, rawText: responseText.substring(0, 500) };
        }

        console.log(`[FB-API] Response: status=${response.status}, time=${responseTime}ms`);

        if (data.error) {
          const errorInfo = categorizeError(data.error.code || 0);
          console.error(`[FB-API] Error: code=${data.error.code}, message=${data.error.message}`);

          // Retry transient errors
          if (errorInfo.retryable && attempt < RATE_LIMIT.maxRetries - 1) {
            const backoffDelay = RATE_LIMIT.baseDelay * Math.pow(2, attempt);
            console.log(`[FB-API] Retrying in ${backoffDelay}ms...`);
            await delay(backoffDelay);
            continue;
          }

          throw new Error(errorInfo.message);
        }

        console.log(`[FB-API] Success: fetched ${data.data?.length || 0} ads`);
        return data.data || [];

      } catch (networkError: any) {
        console.error(`[FB-API] Network error:`, networkError.message);
        
        if (attempt < RATE_LIMIT.maxRetries - 1) {
          const backoffDelay = RATE_LIMIT.baseDelay * Math.pow(2, attempt);
          await delay(backoffDelay);
          continue;
        }
        throw networkError;
      }
    }
    console.log(`[FB-API] Exhausted retries for ${version}, trying next version...`);
  }

  throw new Error('API do Facebook temporariamente indisponível. Tente novamente.');
}

async function testToken(): Promise<{ valid: boolean; message: string; details?: any }> {
  if (!FACEBOOK_ACCESS_TOKEN) {
    return { valid: false, message: 'Token não configurado' };
  }

  console.log(`[FB-API] testToken - Token: ${maskToken(FACEBOOK_ACCESS_TOKEN)}`);

  try {
    await enforceRateLimit();
    
    const url = `https://graph.facebook.com/v24.0/debug_token?input_token=${FACEBOOK_ACCESS_TOKEN}&access_token=${FACEBOOK_ACCESS_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error(`[FB-API] Token test error:`, data.error);
      return { 
        valid: false, 
        message: categorizeError(data.error.code || 0).message,
        details: { code: data.error.code }
      };
    }

    const tokenData = data.data;
    console.log(`[FB-API] Token valid: app_id=${tokenData.app_id}, type=${tokenData.type}, scopes=${tokenData.scopes?.join(',')}`);

    // Check if token has required scopes
    const hasAdsRead = tokenData.scopes?.includes('ads_read');
    
    return {
      valid: tokenData.is_valid && hasAdsRead,
      message: tokenData.is_valid 
        ? (hasAdsRead ? 'Token válido com permissão ads_read' : 'Token válido mas sem permissão ads_read')
        : 'Token inválido',
      details: {
        appId: tokenData.app_id,
        type: tokenData.type,
        expiresAt: tokenData.expires_at,
        scopes: tokenData.scopes,
      }
    };
  } catch (error: any) {
    console.error(`[FB-API] Token test exception:`, error);
    return { valid: false, message: `Erro ao validar token: ${error.message}` };
  }
}

// ============= DATA PROCESSING =============
async function processAndStoreAds(ads: FacebookAd[], tenantId: string, supabase: any) {
  const results = { imported: 0, updated: 0, errors: 0, advertisers_created: 0 };

  for (const ad of ads) {
    try {
      let advertiserId: string | null = null;

      // Upsert advertiser
      if (ad.page_id) {
        const { data: existing } = await supabase
          .from('advertisers')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('page_id', ad.page_id)
          .single();

        if (existing) {
          advertiserId = existing.id;
        } else {
          const { data: newAdv, error: advError } = await supabase
            .from('advertisers')
            .insert({
              tenant_id: tenantId,
              name: ad.page_name || 'Anunciante Desconhecido',
              page_id: ad.page_id,
            })
            .select('id')
            .single();

          if (newAdv) {
            advertiserId = newAdv.id;
            results.advertisers_created++;
          }
          if (advError) console.error('Error creating advertiser:', advError);
        }
      }

      // Check if ad exists
      const { data: existingAd } = await supabase
        .from('ads')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('ad_library_id', ad.id)
        .single();

      const adData = {
        tenant_id: tenantId,
        advertiser_id: advertiserId,
        ad_library_id: ad.id,
        page_name: ad.page_name,
        primary_text: ad.ad_creative_bodies?.[0] || null,
        headline: ad.ad_creative_link_titles?.[0] || null,
        cta: ad.ad_creative_link_captions?.[0] || null,
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
        const { error } = await supabase.from('ads').update(adData).eq('id', existingAd.id);
        if (error) results.errors++; else results.updated++;
      } else {
        const { error } = await supabase.from('ads').insert(adData);
        if (error) results.errors++; else results.imported++;
      }
    } catch (err) {
      console.error('Error processing ad:', ad.id, err);
      results.errors++;
    }
  }

  return results;
}

async function runScheduledImports(supabaseAdmin: any) {
  console.log('[SCHEDULED] Running scheduled imports...');

  const { data: schedules, error } = await supabaseAdmin
    .from('import_schedules')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  console.log(`[SCHEDULED] Found ${schedules?.length || 0} active schedules`);

  const allResults = { schedules_processed: 0, total_imported: 0, total_updated: 0, total_errors: 0 };

  for (const schedule of schedules || []) {
    try {
      console.log(`[SCHEDULED] Processing: ${schedule.name} for tenant: ${schedule.tenant_id}`);

      const params: AdLibraryParams = {
        search_terms: schedule.search_terms || undefined,
        search_page_ids: schedule.search_page_ids?.length > 0 ? schedule.search_page_ids : undefined,
        ad_reached_countries: schedule.ad_reached_countries || ['US'],
        ad_active_status: schedule.ad_active_status || 'ACTIVE',
        limit: schedule.import_limit || 50,
      };

      const ads = await fetchFromAdLibrary(params);
      const results = await processAndStoreAds(ads, schedule.tenant_id, supabaseAdmin);

      await supabaseAdmin
        .from('import_schedules')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', schedule.id);

      await supabaseAdmin.from('job_runs').insert({
        tenant_id: schedule.tenant_id,
        job_name: `Import Agendado: ${schedule.name}`,
        task_type: 'ad_import',
        schedule_type: 'scheduled',
        status: 'completed',
        ads_processed: ads.length,
        completed_at: new Date().toISOString(),
        metadata: { schedule_id: schedule.id, params, results },
      });

      allResults.schedules_processed++;
      allResults.total_imported += results.imported;
      allResults.total_updated += results.updated;
      allResults.total_errors += results.errors;

    } catch (err: any) {
      console.error(`[SCHEDULED] Error processing ${schedule.id}:`, err);
      
      await supabaseAdmin.from('job_runs').insert({
        tenant_id: schedule.tenant_id,
        job_name: `Import Agendado: ${schedule.name}`,
        task_type: 'ad_import',
        schedule_type: 'scheduled',
        status: 'failed',
        error_message: err.message || 'Erro desconhecido',
        completed_at: new Date().toISOString(),
      });

      allResults.total_errors++;
    }
  }

  return allResults;
}

// ============= AUTH HELPERS =============
function isValidScheduledRequest(req: Request): boolean {
  const cronSecret = req.headers.get('x-cron-secret');
  const authHeader = req.headers.get('authorization');

  if (cronSecret && cronSecret === SUPABASE_SERVICE_ROLE_KEY) return true;
  if (authHeader?.replace('Bearer ', '') === SUPABASE_SERVICE_ROLE_KEY) return true;

  return false;
}

// ============= MAIN HANDLER =============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, params } = body;

    console.log(`[HANDLER] Action: ${action}`);

    // Test token endpoint
    if (action === 'test_token') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Autenticação necessária' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Não autorizado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenResult = await testToken();
      
      return new Response(
        JSON.stringify({
          success: tokenResult.valid,
          configured: !!FACEBOOK_ACCESS_TOKEN,
          message: tokenResult.message,
          details: tokenResult.details,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check token configured
    if (!FACEBOOK_ACCESS_TOKEN) {
      throw new Error('FACEBOOK_ACCESS_TOKEN não configurado. Configure nas secrets do projeto.');
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Scheduled imports (cron)
    if (action === 'scheduled') {
      if (!isValidScheduledRequest(req)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Acesso não autorizado ao endpoint agendado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = await runScheduledImports(supabaseAdmin);
      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User-initiated actions require auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autenticação necessária');
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('Não autorizado');
    }

    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.tenant_id) {
      throw new Error('Tenant do usuário não encontrado');
    }

    // Validate params
    const validatedParams = validateParams(params);
    console.log('[HANDLER] Validated params:', JSON.stringify(validatedParams));

    // Search action (preview only)
    if (action === 'search') {
      const ads = await fetchFromAdLibrary(validatedParams);

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
          count: ads.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Import action (fetch and store)
    if (action === 'import') {
      const ads = await fetchFromAdLibrary(validatedParams);
      const results = await processAndStoreAds(ads, profile.tenant_id, supabaseAdmin);

      await supabaseAdmin.from('job_runs').insert({
        tenant_id: profile.tenant_id,
        job_name: 'Import Manual - Facebook Ad Library',
        task_type: 'ad_import',
        schedule_type: 'manual',
        status: 'completed',
        ads_processed: ads.length,
        completed_at: new Date().toISOString(),
        metadata: { search_params: validatedParams, results },
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Import concluído', results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Ação inválida');

  } catch (error: any) {
    console.error('[HANDLER] Error:', error);

    const message = error?.message || 'Erro desconhecido';
    const isTransient = message.includes('temporariamente') || message.includes('Tentando novamente');

    return new Response(
      JSON.stringify({ success: false, error: message, is_transient: isTransient }),
      { status: isTransient ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
