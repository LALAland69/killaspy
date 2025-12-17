import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Ad = Tables<"ads"> & {
  advertisers?: Tables<"advertisers"> | null;
  domains?: Tables<"domains"> | null;
};

export interface AdsFilters {
  search?: string;
  category?: string;
  country?: string;
  status?: string;
  riskLevel?: string;
}

export function useAds(limit?: number, filters?: AdsFilters) {
  return useQuery({
    queryKey: ["ads", limit, filters],
    queryFn: async () => {
      let query = supabase
        .from("ads")
        .select(`
          *,
          advertisers(*),
          domains(*)
        `)
        .order("suspicion_score", { ascending: false });

      // Apply filters
      if (filters?.category && filters.category !== "all") {
        query = query.eq("category_id", filters.category);
      }

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.search) {
        query = query.or(`headline.ilike.%${filters.search}%,primary_text.ilike.%${filters.search}%,page_name.ilike.%${filters.search}%`);
      }

      if (filters?.riskLevel && filters.riskLevel !== "all") {
        if (filters.riskLevel === "high") {
          query = query.gte("suspicion_score", 61);
        } else if (filters.riskLevel === "medium") {
          query = query.gte("suspicion_score", 31).lt("suspicion_score", 61);
        } else if (filters.riskLevel === "low") {
          query = query.lt("suspicion_score", 31);
        }
      }

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
