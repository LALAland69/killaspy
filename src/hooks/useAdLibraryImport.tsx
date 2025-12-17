import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function useAdLibrarySearch() {
  const [previews, setPreviews] = useState<AdPreview[]>([]);

  const mutation = useMutation({
    mutationFn: async (params: SearchParams) => {
      const { data, error } = await supabase.functions.invoke('facebook-ad-library', {
        body: { action: 'search', params }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.ads as AdPreview[];
    },
    onSuccess: (ads) => {
      setPreviews(ads);
      toast.success(`Found ${ads.length} ads`);
    },
    onError: (error: Error) => {
      toast.error(`Search failed: ${error.message}`);
    },
  });

  return {
    search: mutation.mutate,
    isSearching: mutation.isPending,
    previews,
    clearPreviews: () => setPreviews([]),
  };
}

export function useAdLibraryImport() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: SearchParams) => {
      const { data, error } = await supabase.functions.invoke('facebook-ad-library', {
        body: { action: 'import', params }
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
      
      toast.success(
        `Import complete: ${results.imported} new, ${results.updated} updated, ${results.advertisers_created} advertisers created`
      );
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  return {
    importAds: mutation.mutate,
    isImporting: mutation.isPending,
    results: mutation.data,
  };
}
