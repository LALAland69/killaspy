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
  isTransient?: boolean;
  suggestion?: string;
  errorCategory?: string;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

function parseApiError(errorMessage: string): FacebookApiError {
  const result: FacebookApiError = { message: errorMessage };
  
  // Detect transient errors from sanitized server messages
  const isTransient = 
    errorMessage.includes("high demand") ||
    errorMessage.includes("try again") ||
    errorMessage.includes("temporarily unavailable");
  
  result.isTransient = isTransient;
  
  // Add user-friendly suggestions based on sanitized error categories
  if (isTransient) {
    result.suggestion = "Este é um erro temporário. O sistema tentará novamente automaticamente.";
    result.errorCategory = "TEMPORARY_ERROR";
  } else if (errorMessage.includes("Token configuration") || errorMessage.includes("token settings")) {
    result.suggestion = "Há um problema com a configuração do token. Verifique as configurações da API.";
    result.errorCategory = "TOKEN_ERROR";
  } else if (errorMessage.includes("Permission denied") || errorMessage.includes("permissions")) {
    result.suggestion = "Permissões insuficientes. Verifique se a aplicação tem as permissões necessárias.";
    result.errorCategory = "PERMISSION_ERROR";
  } else if (errorMessage.includes("Rate limit") || errorMessage.includes("rate limit")) {
    result.suggestion = "Limite de requisições atingido. Aguarde alguns minutos antes de tentar novamente.";
    result.errorCategory = "RATE_LIMIT";
  } else {
    result.suggestion = "Ocorreu um erro. Por favor, tente novamente.";
    result.errorCategory = "UNKNOWN";
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
