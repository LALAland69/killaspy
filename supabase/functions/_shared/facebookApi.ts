/**
 * Shared Facebook API Client for Edge Functions
 * 
 * Features:
 * - Permanent App Access Token support
 * - Rate limiting with exponential backoff
 * - Comprehensive error handling and logging
 * - Multiple API version fallback
 */

// Rate limiting configuration
const RATE_LIMIT = {
  minTimeBetweenRequests: 200, // 200ms between requests
  maxRetries: 3,
  baseDelay: 500, // Base delay for exponential backoff
};

// Facebook API versions to try (primary + fallback)
const API_VERSIONS = ['v24.0', 'v21.0'];

// Error code categories
const TOKEN_ERRORS = [102, 190, 463, 467, 459];
const RATE_LIMIT_ERRORS = [4, 17, 341];
const PERMISSION_ERRORS = [10, 200, 294];
const TRANSIENT_ERRORS = [1, 2];

export interface FacebookApiConfig {
  accessToken: string;
  apiVersion?: string;
}

export interface AdSearchParams {
  search_terms?: string;
  ad_type?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS' | 'HOUSING_ADS' | 'EMPLOYMENT_ADS' | 'CREDIT_ADS';
  ad_reached_countries?: string[];
  ad_active_status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  ad_delivery_date_min?: string;
  ad_delivery_date_max?: string;
  search_page_ids?: string[];
  limit?: number;
  after?: string;
}

export interface FacebookAd {
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
  delivery_by_region?: Array<{ region: string; percentage?: number }>;
  target_ages?: string[];
  target_genders?: string[];
}

export interface FacebookApiResponse<T> {
  data: T[];
  paging?: {
    cursors?: { before?: string; after?: string };
    next?: string;
  };
}

export interface FacebookError {
  code: number;
  message: string;
  type?: string;
  error_subcode?: number;
  fbtrace_id?: string;
  is_transient?: boolean;
  error_user_msg?: string;
}

export interface ApiCallResult<T> {
  success: boolean;
  data?: T;
  error?: {
    category: 'TOKEN_ERROR' | 'RATE_LIMIT' | 'PERMISSION_ERROR' | 'TRANSIENT' | 'UNKNOWN';
    message: string;
    code?: number;
    retryable: boolean;
  };
}

// Rate limiter state (per-function instance)
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

function maskToken(token: string): string {
  if (!token || token.length < 20) return 'INVALID';
  return `${token.substring(0, 10)}...${token.substring(token.length - 5)}`;
}

function categorizeError(errorCode: number): ApiCallResult<never>['error'] {
  if (TOKEN_ERRORS.includes(errorCode)) {
    return {
      category: 'TOKEN_ERROR',
      message: 'Token inválido ou expirado. Verifique a configuração do FACEBOOK_ACCESS_TOKEN.',
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
      message: 'Erro temporário do Facebook. Tentando novamente...',
      code: errorCode,
      retryable: true,
    };
  }
  
  return {
    category: 'UNKNOWN',
    message: 'Erro desconhecido na API do Facebook.',
    code: errorCode,
    retryable: false,
  };
}

function buildQueryParams(params: AdSearchParams, accessToken: string): URLSearchParams {
  const queryParams = new URLSearchParams({
    access_token: accessToken,
    ad_type: params.ad_type || 'ALL',
    ad_active_status: params.ad_active_status || 'ALL',
    limit: String(params.limit || 100),
    fields: [
      'id',
      'ad_creation_time',
      'ad_creative_bodies',
      'ad_creative_link_captions',
      'ad_creative_link_titles',
      'ad_creative_link_descriptions',
      'ad_delivery_start_time',
      'ad_delivery_stop_time',
      'page_id',
      'page_name',
      'publisher_platforms',
      'languages',
      'estimated_audience_size',
      'spend',
      'impressions',
      'bylines',
      'ad_snapshot_url',
      'delivery_by_region',
      'target_ages',
      'target_genders',
    ].join(','),
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

  if (params.ad_delivery_date_min) {
    queryParams.append('ad_delivery_date_min', params.ad_delivery_date_min);
  }

  if (params.ad_delivery_date_max) {
    queryParams.append('ad_delivery_date_max', params.ad_delivery_date_max);
  }

  if (params.after) {
    queryParams.append('after', params.after);
  }

  return queryParams;
}

export async function searchAds(
  config: FacebookApiConfig,
  params: AdSearchParams
): Promise<ApiCallResult<FacebookApiResponse<FacebookAd>>> {
  const { accessToken, apiVersion } = config;
  
  if (!accessToken) {
    return {
      success: false,
      error: {
        category: 'TOKEN_ERROR',
        message: 'Token de acesso não configurado.',
        retryable: false,
      },
    };
  }

  console.log(`[FB-API] searchAds - Token: ${maskToken(accessToken)}, Params:`, {
    search_terms: params.search_terms,
    countries: params.ad_reached_countries,
    status: params.ad_active_status,
    limit: params.limit,
  });

  const queryParams = buildQueryParams(params, accessToken);
  const versionsToTry = apiVersion ? [apiVersion] : API_VERSIONS;

  for (const version of versionsToTry) {
    for (let attempt = 0; attempt < RATE_LIMIT.maxRetries; attempt++) {
      await enforceRateLimit();

      const url = `https://graph.facebook.com/${version}/ads_archive?${queryParams}`;
      const maskedUrl = url.replace(accessToken, '[REDACTED]');
      
      console.log(`[FB-API] Request (v${version}, attempt ${attempt + 1}): ${maskedUrl}`);

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

        console.log(`[FB-API] Response: status=${response.status}, time=${responseTime}ms, hasError=${!!data.error}`);

        if (data.error) {
          const fbError = data.error as FacebookError;
          const errorInfo = categorizeError(fbError.code);

          console.error(`[FB-API] Error: code=${fbError.code}, subcode=${fbError.error_subcode}, message=${fbError.message}, fbtrace=${fbError.fbtrace_id}`);

          // For transient errors, retry with backoff
          if (errorInfo?.retryable && attempt < RATE_LIMIT.maxRetries - 1) {
            const backoffDelay = RATE_LIMIT.baseDelay * Math.pow(2, attempt);
            console.log(`[FB-API] Retrying in ${backoffDelay}ms...`);
            await delay(backoffDelay);
            continue;
          }

          return { 
            success: false, 
            error: errorInfo || {
              category: 'UNKNOWN',
              message: fbError.message || 'Erro desconhecido',
              code: fbError.code,
              retryable: false,
            }
          };
        }

        // Success
        console.log(`[FB-API] Success: fetched ${data.data?.length || 0} ads`);
        
        return {
          success: true,
          data: {
            data: data.data || [],
            paging: data.paging,
          },
        };

      } catch (networkError) {
        console.error(`[FB-API] Network error:`, networkError);

        if (attempt < RATE_LIMIT.maxRetries - 1) {
          const backoffDelay = RATE_LIMIT.baseDelay * Math.pow(2, attempt);
          console.log(`[FB-API] Retrying after network error in ${backoffDelay}ms...`);
          await delay(backoffDelay);
          continue;
        }

        return {
          success: false,
          error: {
            category: 'TRANSIENT',
            message: 'Erro de conexão com a API do Facebook.',
            retryable: true,
          },
        };
      }
    }
    
    // If we exhausted retries for this version, try the next version
    console.log(`[FB-API] Exhausted retries for version ${version}, trying next...`);
  }

  return {
    success: false,
    error: {
      category: 'TRANSIENT',
      message: 'API do Facebook temporariamente indisponível. Tente novamente em alguns minutos.',
      retryable: true,
    },
  };
}

export async function validateToken(accessToken: string): Promise<ApiCallResult<{
  isValid: boolean;
  appId?: string;
  type?: string;
  expiresAt?: number;
  scopes?: string[];
}>> {
  if (!accessToken) {
    return {
      success: false,
      error: {
        category: 'TOKEN_ERROR',
        message: 'Token não configurado.',
        retryable: false,
      },
    };
  }

  console.log(`[FB-API] validateToken - Token: ${maskToken(accessToken)}`);

  try {
    await enforceRateLimit();
    
    // Use debug_token endpoint to validate
    const url = `https://graph.facebook.com/v24.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      const errorInfo = categorizeError(data.error.code);
      console.error(`[FB-API] Token validation error:`, data.error);
      return { success: false, error: errorInfo };
    }

    const tokenData = data.data;
    console.log(`[FB-API] Token valid: app_id=${tokenData.app_id}, type=${tokenData.type}`);

    return {
      success: true,
      data: {
        isValid: tokenData.is_valid,
        appId: tokenData.app_id,
        type: tokenData.type,
        expiresAt: tokenData.expires_at,
        scopes: tokenData.scopes,
      },
    };
  } catch (error) {
    console.error(`[FB-API] Token validation exception:`, error);
    return {
      success: false,
      error: {
        category: 'TRANSIENT',
        message: 'Erro ao validar token.',
        retryable: true,
      },
    };
  }
}

export async function testConnection(accessToken: string): Promise<ApiCallResult<{ adsCount: number }>> {
  console.log(`[FB-API] testConnection - Token: ${maskToken(accessToken)}`);

  const result = await searchAds(
    { accessToken },
    {
      ad_reached_countries: ['US'],
      search_terms: 'test',
      limit: 1,
    }
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    data: { adsCount: result.data?.data.length || 0 },
  };
}

// Utility to get all ads with pagination
export async function fetchAllAds(
  config: FacebookApiConfig,
  params: AdSearchParams,
  maxAds: number = 1000,
  onProgress?: (fetched: number) => void
): Promise<ApiCallResult<FacebookAd[]>> {
  const allAds: FacebookAd[] = [];
  let cursor: string | undefined;
  let pageCount = 0;
  const maxPages = Math.ceil(maxAds / (params.limit || 100));

  while (pageCount < maxPages) {
    const result = await searchAds(config, { ...params, after: cursor });

    if (!result.success) {
      // If we have some ads, return what we got
      if (allAds.length > 0) {
        console.log(`[FB-API] Partial fetch: returning ${allAds.length} ads after error`);
        return { success: true, data: allAds };
      }
      return { success: false, error: result.error };
    }

    const newAds = result.data?.data || [];
    allAds.push(...newAds);
    pageCount++;

    onProgress?.(allAds.length);
    console.log(`[FB-API] fetchAllAds: page ${pageCount}, total ads: ${allAds.length}`);

    cursor = result.data?.paging?.cursors?.after;
    if (!cursor || allAds.length >= maxAds) {
      break;
    }

    // Small delay between pages
    await delay(100);
  }

  return { success: true, data: allAds };
}
