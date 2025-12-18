import { useState } from "react";
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

function parseApiError(errorMessage: string): FacebookApiError {
  const result: FacebookApiError = { message: errorMessage };
  
  // Extract fbtrace_id from error message if present
  const fbtraceMatch = errorMessage.match(/fbtrace_id:\s*([A-Za-z0-9_-]+)/);
  if (fbtraceMatch) {
    result.fbtrace_id = fbtraceMatch[1];
  }
  
  // Detect transient errors
  const isTransient = 
    errorMessage.includes("temporary") ||
    errorMessage.includes("try again") ||
    errorMessage.includes("unknown error") ||
    errorMessage.includes("[1]") || // Facebook error code 1
    errorMessage.includes("[2]"); // Facebook error code 2
  
  result.isTransient = isTransient;
  
  // Add suggestions based on error type
  if (isTransient) {
    result.suggestion = "Este é um erro temporário do Facebook. Aguarde alguns minutos e tente novamente.";
  } else if (errorMessage.includes("Token Error") || errorMessage.includes("[190]") || errorMessage.includes("[102]")) {
    result.suggestion = "Token expirado ou inválido. Verifique o FACEBOOK_ACCESS_TOKEN nas configurações.";
  } else if (errorMessage.includes("Permission Error") || errorMessage.includes("[10]") || errorMessage.includes("[200]")) {
    result.suggestion = "Permissões insuficientes. Verifique se o app tem 'ads_read' aprovado.";
  } else if (errorMessage.includes("Rate Limit") || errorMessage.includes("[4]") || errorMessage.includes("[17]")) {
    result.suggestion = "Limite de requisições atingido. Aguarde alguns minutos antes de tentar novamente.";
  }
  
  return result;
}

export function useAdLibrarySearch() {
  const [previews, setPreviews] = useState<AdPreview[]>([]);
  const [lastError, setLastError] = useState<FacebookApiError | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: SearchParams) => {
      logAction('Ad Library Search', { params });
      setLastError(null);
      
      const { data, error } = await loggedEdgeFunction('facebook-ad-library', {
        action: 'search',
        params
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.ads as AdPreview[];
    },
    onSuccess: (ads) => {
      setPreviews(ads);
      setLastError(null);
      logAction('Ad Library Search Success', { count: ads.length });
      toast.success(`Found ${ads.length} ads`);
    },
    onError: (error: Error) => {
      const parsedError = parseApiError(error.message);
      setLastError(parsedError);
      logAction('Ad Library Search Error', { error: error.message, parsedError });
      
      // Show detailed toast with suggestion
      if (parsedError.isTransient) {
        toast.error(`Erro temporário do Facebook`, {
          description: parsedError.suggestion,
          duration: 8000,
        });
      } else {
        toast.error(`Search failed: ${error.message}`);
      }
    },
  });

  return {
    search: mutation.mutate,
    isSearching: mutation.isPending,
    previews,
    clearPreviews: () => { setPreviews([]); setLastError(null); },
    lastError,
  };
}

export function useAdLibraryImport() {
  const queryClient = useQueryClient();
  const [lastError, setLastError] = useState<FacebookApiError | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: SearchParams) => {
      logAction('Ad Library Import Started', { params });
      setLastError(null);
      
      const { data, error } = await loggedEdgeFunction('facebook-ad-library', {
        action: 'import',
        params
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.results as ImportResults;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['job-history'] });
      
      setLastError(null);
      logAction('Ad Library Import Success', results);
      toast.success(
        `Import complete: ${results.imported} new, ${results.updated} updated, ${results.advertisers_created} advertisers created`
      );
    },
    onError: (error: Error) => {
      const parsedError = parseApiError(error.message);
      setLastError(parsedError);
      logAction('Ad Library Import Error', { error: error.message, parsedError });
      
      if (parsedError.isTransient) {
        toast.error(`Erro temporário do Facebook`, {
          description: parsedError.suggestion,
          duration: 8000,
        });
      } else {
        toast.error(`Import failed: ${error.message}`);
      }
    },
  });

  return {
    importAds: mutation.mutate,
    isImporting: mutation.isPending,
    results: mutation.data,
    lastError,
  };
}
