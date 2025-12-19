import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";
import { searchQuerySchema } from "@/lib/security";
import { PAGINATION } from "@/lib/constants";

export type Ad = Tables<"ads"> & {
  advertisers?: Tables<"advertisers"> | null;
  domains?: Tables<"domains"> | null;
};

export interface AdsFilters {
  search?: string;
  searchBy?: string;
  category?: string;
  country?: string;
  language?: string;
  platform?: string;
  status?: string;
  mediaType?: string;
  riskLevel?: string;
  sortBy?: string;
  winningTier?: string;
  dateRange?: string;
}

const PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;

/**
 * REFATORAÇÃO: Sanitiza input de busca para prevenir SQL injection
 * Remove caracteres especiais e valida tamanho
 */
function sanitizeSearchInput(input: string | undefined): string | null {
  if (!input || typeof input !== "string") return null;
  
  try {
    // SEGURANÇA: Usa schema Zod para validar e sanitizar
    const sanitized = searchQuerySchema.parse(input);
    return sanitized.length > 0 ? sanitized : null;
  } catch {
    logger.warn("API", "Invalid search input rejected", { inputLength: input.length });
    return null;
  }
}

/**
 * REFATORAÇÃO: Aplica filtro de busca de forma segura
 */
function applySearchFilter(
  query: any,
  search: string | null
) {
  if (!search) return query;
  
  // SEGURANÇA: Escape de caracteres especiais do LIKE
  const escapedSearch = search
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  
  return query.or(
    `headline.ilike.%${escapedSearch}%,` +
    `primary_text.ilike.%${escapedSearch}%,` +
    `page_name.ilike.%${escapedSearch}%`
  );
}


export function useAds(limit?: number, filters?: AdsFilters) {
  return useQuery({
    queryKey: ["ads", limit, filters],
    queryFn: async () => {
      const startTime = performance.now();
      logger.debug("API", "Fetching ads", { limit, filters });

      let query = supabase
        .from("ads")
        .select(`
          *,
          advertisers(*),
          domains(*)
        `)
        .order("suspicion_score", { ascending: false });

      // REFATORAÇÃO: Filtros aplicados de forma segura
      if (filters?.category && filters.category !== "all") {
        query = query.eq("category_id", filters.category);
      }

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      // SEGURANÇA: Sanitiza search antes de usar
      const sanitizedSearch = sanitizeSearchInput(filters?.search);
      if (sanitizedSearch) {
        query = applySearchFilter(query, sanitizedSearch);
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

      if (limit && limit > 0) {
        query = query.limit(Math.min(limit, PAGINATION.MAX_PAGE_SIZE));
      }

      const { data, error } = await query;
      const duration = Math.round(performance.now() - startTime);

      if (error) {
        logger.apiCall("ads/list", "SELECT", 400, duration, error.message);
        throw error;
      }

      logger.apiCall("ads/list", "SELECT", 200, duration);
      logger.debug("API", "Ads fetched", {
        count: data?.length ?? 0,
        duration: `${duration}ms`,
      });

      return (data ?? []) as Ad[];
    },
  });
}

export function useInfiniteAds(filters?: AdsFilters) {
  return useInfiniteQuery({
    queryKey: ["ads-infinite", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const startTime = performance.now();
      
      let query = supabase
        .from("ads")
        .select(
          `
          *,
          advertisers(*),
          domains(*)
        `,
          { count: "exact" }
        );

      // REFATORAÇÃO: Sorting centralizado
      const sortConfig: Record<string, { column: string; ascending: boolean }[]> = {
        winning: [
          { column: "longevity_days", ascending: false },
          { column: "engagement_score", ascending: false },
        ],
        oldest: [{ column: "created_at", ascending: true }],
        score_high: [{ column: "suspicion_score", ascending: false }],
        score_low: [{ column: "suspicion_score", ascending: true }],
        longevity: [{ column: "longevity_days", ascending: false }],
        default: [{ column: "created_at", ascending: false }],
      };

      const sorting = sortConfig[filters?.sortBy || "default"] || sortConfig.default;
      sorting.forEach(({ column, ascending }) => {
        query = query.order(column, { ascending });
      });

      // REFATORAÇÃO: Filtros aplicados de forma segura
      if (filters?.category && filters.category !== "all") {
        query = query.eq("category_id", filters.category);
      }

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.country && filters.country !== "all") {
        query = query.contains("countries", [filters.country]);
      }

      // SEGURANÇA: Sanitiza search antes de usar
      const sanitizedSearch = sanitizeSearchInput(filters?.search);
      if (sanitizedSearch) {
        query = applySearchFilter(query, sanitizedSearch);
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

      // REFATORAÇÃO: Winning tier filter com constantes
      if (filters?.winningTier && filters.winningTier !== "all") {
        const tierFilters: Record<string, { gte?: number; lt?: number }> = {
          winners: { gte: 42 },
          champion: { gte: 51 },
          strong: { gte: 42, lt: 51 },
          promising: { gte: 30, lt: 42 },
          testing: { lt: 30 },
        };
        
        const tierFilter = tierFilters[filters.winningTier];
        if (tierFilter) {
          if (tierFilter.gte !== undefined) {
            query = query.gte("longevity_days", tierFilter.gte);
          }
          if (tierFilter.lt !== undefined) {
            query = query.lt("longevity_days", tierFilter.lt);
          }
        }
      }

      // Pagination
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      const duration = Math.round(performance.now() - startTime);

      if (error) {
        logger.apiCall("ads-infinite", "SELECT", 400, duration, error.message);
        throw error;
      }

      logger.apiCall("ads-infinite", "SELECT", 200, duration);

      // REFATORAÇÃO: Safe nullish coalescing
      const ads = (data ?? []) as Ad[];
      
      return {
        ads,
        nextPage: ads.length === PAGE_SIZE ? pageParam + 1 : undefined,
        totalCount: count ?? 0,
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
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from("ads")
        .select(`
          *,
          advertisers(*),
          domains(*)
        `)
        .eq("id", adId)
        .single();

      const duration = Math.round(performance.now() - startTime);

      if (error) {
        logger.apiCall("ads/get", "SELECT", 400, duration, error.message);
        throw error;
      }

      logger.apiCall("ads/get", "SELECT", 200, duration);
      return data as Ad;
    },
    enabled: Boolean(adId),
  });
}

export function useAdsByAdvertiser(advertiserId: string) {
  return useQuery({
    queryKey: ["ads", "advertiser", advertiserId],
    queryFn: async () => {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from("ads")
        .select(`
          *,
          domains(*)
        `)
        .eq("advertiser_id", advertiserId)
        .order("suspicion_score", { ascending: false });

      const duration = Math.round(performance.now() - startTime);

      if (error) {
        logger.apiCall("ads/by-advertiser", "SELECT", 400, duration, error.message);
        throw error;
      }

      logger.apiCall("ads/by-advertiser", "SELECT", 200, duration);
      return (data ?? []) as Ad[];
    },
    enabled: Boolean(advertiserId),
  });
}
