import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      const { data, error } = await supabase
        .from("saved_ads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
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
      
      if (error) throw error;
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
      const { error } = await supabase
        .from("saved_ads")
        .delete()
        .eq("ad_id", adId);
      
      if (error) throw error;
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
