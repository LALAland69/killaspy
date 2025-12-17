import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [adsResult, advertisersResult, domainsResult, highRiskResult, adsWithScore] = await Promise.all([
        supabase.from("ads").select("*", { count: "exact", head: true }),
        supabase.from("advertisers").select("*", { count: "exact", head: true }),
        supabase.from("domains").select("*", { count: "exact", head: true }),
        supabase.from("ads").select("*", { count: "exact", head: true }).gte("suspicion_score", 70),
        supabase.from("ads").select("longevity_days, engagement_score"),
      ]);

      // Calculate winning ads stats
      let champions = 0;
      let strong = 0;
      let promising = 0;
      let testing = 0;
      let totalWinningScore = 0;

      adsWithScore.data?.forEach((ad) => {
        const longevityDays = ad.longevity_days || 0;
        const longevityScore = Math.min(100, (longevityDays / 60) * 100);
        const engagementScore = ad.engagement_score || 0;
        const total = Math.round(longevityScore * 0.6 + engagementScore * 0.4);
        
        totalWinningScore += total;
        
        if (total >= 85) champions++;
        else if (total >= 70) strong++;
        else if (total >= 50) promising++;
        else testing++;
      });

      const totalAds = adsResult.count || 0;
      const avgWinningScore = totalAds > 0 ? Math.round(totalWinningScore / (adsWithScore.data?.length || 1)) : 0;

      return {
        totalAds,
        totalAdvertisers: advertisersResult.count || 0,
        totalDomains: domainsResult.count || 0,
        highRiskAds: highRiskResult.count || 0,
        winningStats: {
          champions,
          strong,
          promising,
          testing,
          totalWinners: champions + strong,
          avgWinningScore,
        },
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

export function useWinningDistribution() {
  return useQuery({
    queryKey: ["winning-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ads").select("longevity_days, engagement_score");
      if (error) throw error;

      const distribution = { champion: 0, strong: 0, promising: 0, testing: 0 };

      data?.forEach((ad) => {
        const longevityDays = ad.longevity_days || 0;
        const longevityScore = Math.min(100, (longevityDays / 60) * 100);
        const engagementScore = ad.engagement_score || 0;
        const total = Math.round(longevityScore * 0.6 + engagementScore * 0.4);
        
        if (total >= 85) distribution.champion++;
        else if (total >= 70) distribution.strong++;
        else if (total >= 50) distribution.promising++;
        else distribution.testing++;
      });

      return [
        { name: "Champion", value: distribution.champion, fill: "hsl(45, 93%, 47%)" },
        { name: "Strong", value: distribution.strong, fill: "hsl(142, 71%, 45%)" },
        { name: "Promising", value: distribution.promising, fill: "hsl(217, 91%, 60%)" },
        { name: "Testing", value: distribution.testing, fill: "hsl(var(--muted))" },
      ];
    },
  });
}
