import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
  sortBy?: string;
}

const PAGE_SIZE = 20;

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

export function useInfiniteAds(filters?: AdsFilters) {
  return useInfiniteQuery({
    queryKey: ["ads-infinite", filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("ads")
        .select(`
          *,
          advertisers(*),
          domains(*)
        `, { count: "exact" });

      // Apply sorting
      if (filters?.sortBy === "oldest") {
        query = query.order("created_at", { ascending: true });
      } else if (filters?.sortBy === "score_high") {
        query = query.order("suspicion_score", { ascending: false });
      } else if (filters?.sortBy === "score_low") {
        query = query.order("suspicion_score", { ascending: true });
      } else if (filters?.sortBy === "longevity") {
        query = query.order("longevity_days", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      // Apply filters
      if (filters?.category && filters.category !== "all") {
        query = query.eq("category_id", filters.category);
      }

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      // Filter by country - check if country is in the countries array
      if (filters?.country && filters.country !== "all") {
        query = query.contains("countries", [filters.country]);
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

      // Pagination
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      
      return {
        ads: data as Ad[],
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

export function useAdById(adId: string) {
  return useQuery({
    queryKey: ["ad", adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select(`
          *,
          advertisers(*),
          domains(*)
        `)
        .eq("id", adId)
        .single();

      if (error) throw error;
      return data as Ad;
    },
    enabled: !!adId,
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
