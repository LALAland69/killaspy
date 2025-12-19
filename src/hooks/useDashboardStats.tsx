import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import {
  SCORING,
  CACHE_TIMES,
  calculateWinningScoreFromValues,
  getRiskLevel,
} from "@/lib/constants";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const startTime = performance.now();
      logger.debug("API", "Fetching dashboard stats");

      const [
        adsResult,
        advertisersResult,
        domainsResult,
        highRiskResult,
        adsWithScore,
      ] = await Promise.all([
        supabase.from("ads").select("*", { count: "exact", head: true }),
        supabase.from("advertisers").select("*", { count: "exact", head: true }),
        supabase.from("domains").select("*", { count: "exact", head: true }),
        supabase
          .from("ads")
          .select("*", { count: "exact", head: true })
          .gte("suspicion_score", SCORING.HIGH_RISK_THRESHOLD),
        supabase.from("ads").select("longevity_days, engagement_score"),
      ]);

      // Calculate winning ads stats
      let champions = 0;
      let strong = 0;
      let promising = 0;
      let testing = 0;
      let totalWinningScore = 0;

      const adsData = adsWithScore.data ?? [];

      adsData.forEach((ad) => {
        // REFATORAÇÃO: Usa função centralizada para calcular score
        const total = calculateWinningScoreFromValues(
          ad.longevity_days,
          ad.engagement_score
        );

        totalWinningScore += total;

        if (total >= SCORING.CHAMPION_THRESHOLD) champions++;
        else if (total >= SCORING.STRONG_THRESHOLD) strong++;
        else if (total >= SCORING.PROMISING_THRESHOLD) promising++;
        else testing++;
      });

      const totalAds = adsResult.count ?? 0;

      // REFATORAÇÃO: Evita divisão por zero com verificação explícita
      const avgWinningScore =
        adsData.length > 0
          ? Math.round(totalWinningScore / adsData.length)
          : 0;

      const duration = Math.round(performance.now() - startTime);
      logger.apiCall("dashboard-stats", "SELECT", 200, duration);

      return {
        totalAds,
        totalAdvertisers: advertisersResult.count ?? 0,
        totalDomains: domainsResult.count ?? 0,
        highRiskAds: highRiskResult.count ?? 0,
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
    staleTime: CACHE_TIMES.STALE_TIME_DASHBOARD,
  });
}

export function useNicheTrends() {
  return useQuery({
    queryKey: ["niche-trends"],
    queryFn: async () => {
      const startTime = performance.now();
      logger.debug("API", "Fetching niche trends");

      const { data, error } = await supabase
        .from("niche_trends")
        .select("*")
        .order("velocity_score", { ascending: false });

      const duration = Math.round(performance.now() - startTime);

      if (error) {
        logger.apiCall("niche-trends", "SELECT", 400, duration, error.message);
        throw error;
      }

      logger.apiCall("niche-trends", "SELECT", 200, duration);
      return data ?? [];
    },
    staleTime: CACHE_TIMES.STALE_TIME_DASHBOARD,
    gcTime: CACHE_TIMES.GC_TIME,
  });
}

// DEPRECATED: Use useDashboardData() from DashboardContext instead
// This hook is kept for backward compatibility with standalone usage
export function useRiskDistribution() {
  return useQuery({
    queryKey: ["risk-distribution"],
    queryFn: async () => {
      const startTime = performance.now();
      logger.debug("API", "Fetching risk distribution (standalone)");

      const { data, error } = await supabase
        .from("ads")
        .select("suspicion_score");

      const duration = Math.round(performance.now() - startTime);

      if (error) {
        logger.apiCall("risk-distribution", "SELECT", 400, duration, error.message);
        throw error;
      }

      logger.apiCall("risk-distribution", "SELECT", 200, duration);

      const distribution = {
        low: 0,
        medium: 0,
        high: 0,
      };

      (data ?? []).forEach((ad) => {
        const level = getRiskLevel(ad.suspicion_score);
        distribution[level]++;
      });

      return [
        {
          name: "Low Risk",
          value: distribution.low,
          fill: "hsl(var(--chart-3))",
        },
        {
          name: "Medium Risk",
          value: distribution.medium,
          fill: "hsl(var(--chart-2))",
        },
        {
          name: "High Risk",
          value: distribution.high,
          fill: "hsl(var(--chart-1))",
        },
      ];
    },
    staleTime: CACHE_TIMES.STALE_TIME_DASHBOARD,
    gcTime: CACHE_TIMES.GC_TIME,
    // Disable this query when used inside DashboardProvider (data comes from context)
    enabled: false,
  });
}

// DEPRECATED: Use useDashboardData() from DashboardContext instead
// This hook is kept for backward compatibility with standalone usage
export function useWinningDistribution() {
  return useQuery({
    queryKey: ["winning-distribution"],
    queryFn: async () => {
      const startTime = performance.now();
      logger.debug("API", "Fetching winning distribution (standalone)");

      const { data, error } = await supabase
        .from("ads")
        .select("longevity_days, engagement_score");

      const duration = Math.round(performance.now() - startTime);

      if (error) {
        logger.apiCall(
          "winning-distribution",
          "SELECT",
          400,
          duration,
          error.message
        );
        throw error;
      }

      logger.apiCall("winning-distribution", "SELECT", 200, duration);

      const distribution = { champion: 0, strong: 0, promising: 0, testing: 0 };

      (data ?? []).forEach((ad) => {
        const total = calculateWinningScoreFromValues(
          ad.longevity_days,
          ad.engagement_score
        );

        if (total >= SCORING.CHAMPION_THRESHOLD) distribution.champion++;
        else if (total >= SCORING.STRONG_THRESHOLD) distribution.strong++;
        else if (total >= SCORING.PROMISING_THRESHOLD) distribution.promising++;
        else distribution.testing++;
      });

      return [
        {
          name: "Champion",
          value: distribution.champion,
          fill: "hsl(45, 93%, 47%)",
        },
        {
          name: "Strong",
          value: distribution.strong,
          fill: "hsl(142, 71%, 45%)",
        },
        {
          name: "Promising",
          value: distribution.promising,
          fill: "hsl(217, 91%, 60%)",
        },
        {
          name: "Testing",
          value: distribution.testing,
          fill: "hsl(var(--muted))",
        },
      ];
    },
    staleTime: CACHE_TIMES.STALE_TIME_DASHBOARD,
    gcTime: CACHE_TIMES.GC_TIME,
    // Disable this query when used inside DashboardProvider (data comes from context)
    enabled: false,
  });
}
