import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [adsResult, advertisersResult, domainsResult, highRiskResult] = await Promise.all([
        supabase.from("ads").select("*", { count: "exact", head: true }),
        supabase.from("advertisers").select("*", { count: "exact", head: true }),
        supabase.from("domains").select("*", { count: "exact", head: true }),
        supabase.from("ads").select("*", { count: "exact", head: true }).gte("suspicion_score", 70),
      ]);

      return {
        totalAds: adsResult.count || 0,
        totalAdvertisers: advertisersResult.count || 0,
        totalDomains: domainsResult.count || 0,
        highRiskAds: highRiskResult.count || 0,
      };
    },
  });
}

export function useNicheTrends() {
  return useQuery({
    queryKey: ["niche-trends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("niche_trends")
        .select("*")
        .order("velocity_score", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useRiskDistribution() {
  return useQuery({
    queryKey: ["risk-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ads").select("suspicion_score");
      if (error) throw error;

      const distribution = {
        low: 0,
        medium: 0,
        high: 0,
      };

      data?.forEach((ad) => {
        const score = ad.suspicion_score || 0;
        if (score < 40) distribution.low++;
        else if (score < 70) distribution.medium++;
        else distribution.high++;
      });

      return [
        { name: "Low Risk", value: distribution.low, fill: "hsl(var(--chart-3))" },
        { name: "Medium Risk", value: distribution.medium, fill: "hsl(var(--chart-2))" },
        { name: "High Risk", value: distribution.high, fill: "hsl(var(--chart-1))" },
      ];
    },
  });
}
