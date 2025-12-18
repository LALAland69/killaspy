import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";

export type Advertiser = Tables<"advertisers">;

export function useAdvertisers() {
  return useQuery({
    queryKey: ["advertisers"],
    queryFn: async () => {
      const startTime = performance.now();
      logger.debug('API', 'Fetching advertisers');
      
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .order("avg_suspicion_score", { ascending: false });

      const duration = Math.round(performance.now() - startTime);
      
      if (error) {
        logger.apiCall('advertisers/list', 'SELECT', 400, duration, error.message);
        throw error;
      }
      
      logger.apiCall('advertisers/list', 'SELECT', 200, duration);
      logger.debug('API', 'Advertisers fetched', { count: data.length, duration: `${duration}ms` });
      
      return data as Advertiser[];
    },
  });
}

export function useAdvertiser(id: string) {
  return useQuery({
    queryKey: ["advertiser", id],
    queryFn: async () => {
      const startTime = performance.now();
      logger.debug('API', 'Fetching advertiser', { id });
      
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .eq("id", id)
        .single();

      const duration = Math.round(performance.now() - startTime);
      
      if (error) {
        logger.apiCall('advertisers/get', 'SELECT', 400, duration, error.message);
        throw error;
      }
      
      logger.apiCall('advertisers/get', 'SELECT', 200, duration);
      return data as Advertiser;
    },
    enabled: !!id,
  });
}

export function useAdvertiserDomains(advertiserId: string) {
  return useQuery({
    queryKey: ["domains", "advertiser", advertiserId],
    queryFn: async () => {
      const startTime = performance.now();
      logger.debug('API', 'Fetching advertiser domains', { advertiserId });
      
      const { data, error } = await supabase
        .from("domains")
        .select("*")
        .eq("advertiser_id", advertiserId);

      const duration = Math.round(performance.now() - startTime);
      
      if (error) {
        logger.apiCall('domains/by-advertiser', 'SELECT', 400, duration, error.message);
        throw error;
      }
      
      logger.apiCall('domains/by-advertiser', 'SELECT', 200, duration);
      return data;
    },
    enabled: !!advertiserId,
  });
}
