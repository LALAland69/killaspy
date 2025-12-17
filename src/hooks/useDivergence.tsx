import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type LandingPageSnapshot = Tables<"landing_page_snapshots">;

// Get all ads that have been flagged as potentially cloaked
export function useCloakedAds() {
  return useQuery({
    queryKey: ["cloaked_ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select(`
          *,
          advertiser:advertisers(name),
          domain:domains(domain)
        `)
        .eq("is_cloaked_flag", true)
        .order("suspicion_score", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Get divergence reports - ads with multiple snapshots showing different content
export function useDivergenceReports() {
  return useQuery({
    queryKey: ["divergence_reports"],
    queryFn: async () => {
      // Get ads that have snapshots
      const { data: adsWithSnapshots, error: adsError } = await supabase
        .from("ads")
        .select(`
          id,
          page_name,
          white_url,
          detected_black_url,
          suspicion_score,
          is_cloaked_flag,
          domain:domains(domain)
        `)
        .not("detected_black_url", "is", null)
        .order("suspicion_score", { ascending: false })
        .limit(20);

      if (adsError) throw adsError;

      // For each ad, get its snapshots
      const reports = await Promise.all(
        (adsWithSnapshots || []).map(async (ad) => {
          const { data: snapshots } = await supabase
            .from("landing_page_snapshots")
            .select("*")
            .eq("ad_id", ad.id)
            .order("captured_at", { ascending: false });

          return {
            ...ad,
            snapshots: snapshots || [],
          };
        })
      );

      return reports.filter((r) => r.snapshots.length > 0);
    },
  });
}

// Get snapshots for a specific ad
export function useAdSnapshots(adId: string) {
  return useQuery({
    queryKey: ["ad_snapshots", adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_snapshots")
        .select("*")
        .eq("ad_id", adId)
        .order("captured_at", { ascending: false });

      if (error) throw error;
      return data as LandingPageSnapshot[];
    },
    enabled: !!adId,
  });
}

// Trigger a divergence test
export function useTriggerDivergenceTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ adId, targetUrl }: { adId: string; targetUrl: string }) => {
      const { data, error } = await supabase.functions.invoke("cloaking-divergence-engine", {
        body: { adId, targetUrl },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divergence_reports"] });
      queryClient.invalidateQueries({ queryKey: ["ad_snapshots"] });
    },
  });
}

// Get divergence stats
export function useDivergenceStats() {
  return useQuery({
    queryKey: ["divergence_stats"],
    queryFn: async () => {
      const { data: totalAds, error: totalError } = await supabase
        .from("ads")
        .select("id", { count: "exact", head: true });

      const { data: cloakedAds, error: cloakedError } = await supabase
        .from("ads")
        .select("id", { count: "exact", head: true })
        .eq("is_cloaked_flag", true);

      const { data: highRisk, error: highRiskError } = await supabase
        .from("ads")
        .select("id", { count: "exact", head: true })
        .gte("suspicion_score", 70);

      const { data: totalSnapshots, error: snapshotsError } = await supabase
        .from("landing_page_snapshots")
        .select("id", { count: "exact", head: true });

      if (totalError || cloakedError || highRiskError || snapshotsError) {
        throw new Error("Failed to fetch divergence stats");
      }

      return {
        totalDivergences: cloakedAds?.length || 0,
        highProbability: highRisk?.length || 0,
        analyzedToday: totalSnapshots?.length || 0,
        totalAds: totalAds?.length || 0,
      };
    },
  });
}
