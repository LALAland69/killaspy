import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { loggedEdgeFunction, logAction } from "@/lib/apiLogger";

interface SearchParams {
  search_terms?: string;
  ad_reached_countries?: string[];
  ad_active_status?: string;
  search_page_ids?: string[];
  limit?: number;
}

interface AdPreview {
  id: string;
  page_name: string;
  page_id: string;
  primary_text?: string;
  headline?: string;
  start_date?: string;
  end_date?: string;
  snapshot_url?: string;
}

interface ImportResults {
  imported: number;
  updated: number;
  errors: number;
  advertisers_created: number;
}

export interface FacebookApiError {
  message: string;
  fbtrace_id?: string;
  isTransient?: boolean;
  suggestion?: string;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

function parseApiError(errorMessage: string): FacebookApiError {
  const result: FacebookApiError = { message: errorMessage };
  
  // Extract fbtrace_id from error message if present
  const fbtraceMatch = errorMessage.match(/fbtrace_id[:\s]+([A-Za-z0-9_-]+)/);
  if (fbtraceMatch) {
    result.fbtrace_id = fbtraceMatch[1];
  }
  
  // Detect transient errors
  const isTransient = 
    errorMessage.includes("temporary") ||
    errorMessage.includes("try again") ||
    errorMessage.includes("unknown error") ||
    errorMessage.includes("[1]") ||
    errorMessage.includes("[2]") ||
    errorMessage.includes("500");
  
  result.isTransient = isTransient;
  
  // Add suggestions based on error type
  if (isTransient) {
    result.suggestion = "Este é um erro temporário do Facebook. O sistema tentará novamente automaticamente.";
  } else if (errorMessage.includes("Token Error") || errorMessage.includes("[190]") || errorMessage.includes("[102]")) {
    result.suggestion = "Token expirado ou inválido. Verifique o FACEBOOK_ACCESS_TOKEN nas configurações.";
  } else if (errorMessage.includes("Permission Error") || errorMessage.includes("[10]") || errorMessage.includes("[200]")) {
    result.suggestion = "Permissões insuficientes. Verifique se o app tem 'ads_read' aprovado.";
  } else if (errorMessage.includes("Rate Limit") || errorMessage.includes("[4]") || errorMessage.includes("[17]")) {
    result.suggestion = "Limite de requisições atingido. Aguarde alguns minutos antes de tentar novamente.";
  }
  
  return result;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  onRetry: (attempt: number, delay: number) => void
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const parsedError = parseApiError(lastError.message);
      
      // Only retry on transient errors
      if (!parsedError.isTransient || attempt === MAX_RETRIES) {
        throw lastError;
      }
      
      // Exponential backoff: 2s, 4s, 8s
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      onRetry(attempt + 1, delay);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

export function useAdLibrarySearch() {
  const [previews, setPreviews] = useState<AdPreview[]>([]);
  const [lastError, setLastError] = useState<FacebookApiError | null>(null);
  const [retryInfo, setRetryInfo] = useState<{ attempt: number; maxRetries: number } | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: SearchParams) => {
      logAction('Ad Library Search', { params });
      setLastError(null);
      setRetryInfo(null);
      
      return executeWithRetry(
        async () => {
          const { data, error } = await loggedEdgeFunction('facebook-ad-library', {
            action: 'search',
            params
          });

          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          
          return data.ads as AdPreview[];
        },
        (attempt, delay) => {
          setRetryInfo({ attempt, maxRetries: MAX_RETRIES });
          toast.info(`Tentativa ${attempt}/${MAX_RETRIES}`, {
            description: `Erro temporário. Tentando novamente em ${delay / 1000}s...`,
            duration: delay,
          });
          logAction('Ad Library Search Retry', { attempt, delay });
        }
      );
    },
    onSuccess: (ads) => {
      setPreviews(ads);
      setLastError(null);
      setRetryInfo(null);
      logAction('Ad Library Search Success', { count: ads.length });
      toast.success(`Encontrados ${ads.length} anúncios`);
    },
    onError: (error: Error) => {
      const parsedError = parseApiError(error.message);
      setLastError(parsedError);
      setRetryInfo(null);
      logAction('Ad Library Search Error', { error: error.message, parsedError });
      
      if (parsedError.isTransient) {
        toast.error(`Erro após ${MAX_RETRIES} tentativas`, {
          description: parsedError.suggestion,
          duration: 8000,
        });
      } else {
        toast.error(`Busca falhou: ${error.message}`);
      }
    },
  });

  return {
    search: mutation.mutate,
    isSearching: mutation.isPending,
    previews,
    clearPreviews: () => { setPreviews([]); setLastError(null); setRetryInfo(null); },
    lastError,
    retryInfo,
  };
}

export function useAdLibraryImport() {
  const queryClient = useQueryClient();
  const [lastError, setLastError] = useState<FacebookApiError | null>(null);
  const [retryInfo, setRetryInfo] = useState<{ attempt: number; maxRetries: number } | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: SearchParams) => {
      logAction('Ad Library Import Started', { params });
      setLastError(null);
      setRetryInfo(null);
      
      return executeWithRetry(
        async () => {
          const { data, error } = await loggedEdgeFunction('facebook-ad-library', {
            action: 'import',
            params
          });

          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          
          return data.results as ImportResults;
        },
        (attempt, delay) => {
          setRetryInfo({ attempt, maxRetries: MAX_RETRIES });
          toast.info(`Tentativa ${attempt}/${MAX_RETRIES}`, {
            description: `Erro temporário. Tentando novamente em ${delay / 1000}s...`,
            duration: delay,
          });
          logAction('Ad Library Import Retry', { attempt, delay });
        }
      );
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['job-history'] });
      
      setLastError(null);
      setRetryInfo(null);
      logAction('Ad Library Import Success', results);
      toast.success(
        `Import completo: ${results.imported} novos, ${results.updated} atualizados, ${results.advertisers_created} anunciantes criados`
      );
    },
    onError: (error: Error) => {
      const parsedError = parseApiError(error.message);
      setLastError(parsedError);
      setRetryInfo(null);
      logAction('Ad Library Import Error', { error: error.message, parsedError });
      
      if (parsedError.isTransient) {
        toast.error(`Erro após ${MAX_RETRIES} tentativas`, {
          description: parsedError.suggestion,
          duration: 8000,
        });
      } else {
        toast.error(`Import falhou: ${error.message}`);
      }
    },
  });

  return {
    importAds: mutation.mutate,
    isImporting: mutation.isPending,
    results: mutation.data,
    lastError,
    retryInfo,
  };
}
