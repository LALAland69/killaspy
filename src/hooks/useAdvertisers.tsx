import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Advertiser = Tables<"advertisers">;

export function useAdvertisers() {
  return useQuery({
    queryKey: ["advertisers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .order("avg_suspicion_score", { ascending: false });

      if (error) throw error;
      return data as Advertiser[];
    },
  });
}

export function useAdvertiser(id: string) {
  return useQuery({
    queryKey: ["advertiser", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Advertiser;
    },
    enabled: !!id,
  });
}

export function useAdvertiserDomains(advertiserId: string) {
  return useQuery({
    queryKey: ["domains", "advertiser", advertiserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domains")
        .select("*")
        .eq("advertiser_id", advertiserId);

      if (error) throw error;
      return data;
    },
    enabled: !!advertiserId,
  });
}
