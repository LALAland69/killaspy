import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export interface SavedAd {
  id: string;
  tenant_id: string;
  ad_id: string;
  user_id: string;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
}

export function useSavedAds() {
  return useQuery({
    queryKey: ["saved-ads"],
    queryFn: async () => {
      const startTime = performance.now();
      logger.debug('API', 'Fetching saved ads');
      
      const { data, error } = await supabase
        .from("saved_ads")
        .select("*")
        .order("created_at", { ascending: false });
      
      const duration = Math.round(performance.now() - startTime);
      
      if (error) {
        logger.apiCall('saved_ads/list', 'SELECT', 400, duration, error.message);
        throw error;
      }
      
      logger.apiCall('saved_ads/list', 'SELECT', 200, duration);
      return data as SavedAd[];
    },
  });
}

export function useSavedAdIds() {
  return useQuery({
    queryKey: ["saved-ad-ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_ads")
        .select("ad_id");
      
      if (error) throw error;
      return new Set(data.map(d => d.ad_id));
    },
  });
}

export function useSaveAd() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (adId: string) => {
      logger.info('ACTION', 'Saving ad to favorites', { adId });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .single();
      
      if (!profile?.tenant_id) throw new Error("No tenant found");

      const { data, error } = await supabase
        .from("saved_ads")
        .insert({
          ad_id: adId,
          user_id: user.id,
          tenant_id: profile.tenant_id,
        })
        .select()
        .single();
      
      if (error) {
        logger.error('ACTION', 'Failed to save ad', { adId, error: error.message });
        throw error;
      }
      
      logger.info('ACTION', 'Ad saved to favorites', { adId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-ads"] });
      queryClient.invalidateQueries({ queryKey: ["saved-ad-ids"] });
      toast.success("Ad salvo nos favoritos");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });
}

export function useUnsaveAd() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (adId: string) => {
      logger.info('ACTION', 'Removing ad from favorites', { adId });
      
      const { error } = await supabase
        .from("saved_ads")
        .delete()
        .eq("ad_id", adId);
      
      if (error) {
        logger.error('ACTION', 'Failed to remove saved ad', { adId, error: error.message });
        throw error;
      }
      
      logger.info('ACTION', 'Ad removed from favorites', { adId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-ads"] });
      queryClient.invalidateQueries({ queryKey: ["saved-ad-ids"] });
      toast.success("Ad removido dos favoritos");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });
}

export function useToggleSaveAd() {
  const saveAd = useSaveAd();
  const unsaveAd = useUnsaveAd();
  const { data: savedIds } = useSavedAdIds();

  const toggleSave = (adId: string) => {
    if (savedIds?.has(adId)) {
      unsaveAd.mutate(adId);
    } else {
      saveAd.mutate(adId);
    }
  };

  return {
    toggleSave,
    isSaved: (adId: string) => savedIds?.has(adId) || false,
    isPending: saveAd.isPending || unsaveAd.isPending,
  };
}
