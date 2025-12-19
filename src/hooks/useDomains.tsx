import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { CACHE_TIMES } from "@/lib/constants";
import { logger } from "@/lib/logger";

export type Domain = Tables<"domains">;
export type DomainPage = Tables<"domain_pages">;

export function useDomains() {
  return useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const startTime = performance.now();
      logger.debug("API", "Fetching domains");
      
      const { data, error } = await supabase
        .from("domains")
        .select("*")
        .order("suspicion_score", { ascending: false });

      const duration = Math.round(performance.now() - startTime);
      
      if (error) {
        logger.apiCall("domains/list", "SELECT", 400, duration, error.message);
        throw error;
      }
      
      logger.apiCall("domains/list", "SELECT", 200, duration);
      return data as Domain[];
    },
    staleTime: CACHE_TIMES.STALE_TIME_DEFAULT,
    gcTime: CACHE_TIMES.GC_TIME,
  });
}

export function useDomain(id: string) {
  return useQuery({
    queryKey: ["domain", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domains")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Domain;
    },
    enabled: !!id,
  });
}

export function useDomainPages(domainId: string) {
  return useQuery({
    queryKey: ["domain_pages", domainId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domain_pages")
        .select("*")
        .eq("domain_id", domainId);

      if (error) throw error;
      return data as DomainPage[];
    },
    enabled: !!domainId,
  });
}

export function useDomainAds(domainId: string) {
  return useQuery({
    queryKey: ["ads", "domain", domainId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("domain_id", domainId)
        .order("suspicion_score", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!domainId,
  });
}

export function useDomainAdvertiser(advertiserId: string | null) {
  return useQuery({
    queryKey: ["advertiser", advertiserId],
    queryFn: async () => {
      if (!advertiserId) return null;
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .eq("id", advertiserId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!advertiserId,
  });
}
