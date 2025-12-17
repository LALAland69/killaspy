import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Ad = Tables<"ads"> & {
  advertisers?: Tables<"advertisers"> | null;
  domains?: Tables<"domains"> | null;
};

export function useAds(limit?: number) {
  return useQuery({
    queryKey: ["ads", limit],
    queryFn: async () => {
      let query = supabase
        .from("ads")
        .select(`
          *,
          advertisers(*),
          domains(*)
        `)
        .order("suspicion_score", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Ad[];
    },
  });
}

export function useAdsByAdvertiser(advertiserId: string) {
  return useQuery({
    queryKey: ["ads", "advertiser", advertiserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select(`
          *,
          domains(*)
        `)
        .eq("advertiser_id", advertiserId)
        .order("suspicion_score", { ascending: false });

      if (error) throw error;
      return data as Ad[];
    },
    enabled: !!advertiserId,
  });
}
