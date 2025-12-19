// Consolidated dashboard hook - single query for all dashboard stats
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackQueryPerformance } from "@/lib/queryClient";
import { logger } from "@/lib/logger";

export interface DashboardData {
  stats: {
    totalAds: number;
    totalAdvertisers: number;
    totalDomains: number;
    highRiskAds: number;
    activeAds: number;
  };
  winningStats: {
    champions: number;
    strong: number;
    promising: number;
    testing: number;
    totalWinners: number;
    avgWinningScore: number;
  };
  riskDistribution: Array<{ name: string; value: number; fill: string }>;
  winningDistribution: Array<{ name: string; value: number; fill: string }>;
  recentAds: any[];
  topAdvertisers: any[];
}

// Single optimized query for all dashboard data
export function useOptimizedDashboard() {
  return useQuery({
    queryKey: ["dashboard-optimized"],
    queryFn: async (): Promise<DashboardData> => {
      const startTime = performance.now();
      logger.debug("API", "Fetching optimized dashboard data");
      
      // Execute all queries in parallel for maximum efficiency
      const [
        adsCountResult,
        advertisersResult,
        domainsResult,
        adsDataResult,
        topAdvertisersResult,
      ] = await Promise.all([
        // Count queries (very fast with head: true)
        supabase.from("ads").select("*", { count: "exact", head: true }),
        supabase.from("advertisers").select("*", { count: "exact", head: true }),
        supabase.from("domains").select("*", { count: "exact", head: true }),
        // Get ads data for calculations (select only needed columns)
        supabase.from("ads").select("id, longevity_days, engagement_score, suspicion_score, status"),
        // Top advertisers (limited)
        supabase.from("advertisers")
          .select("id, name, total_ads, avg_suspicion_score")
          .order("total_ads", { ascending: false })
          .limit(5),
      ]);

      const ads = adsDataResult.data || [];
      
      // Calculate all stats in a single pass through the data
      let champions = 0, strong = 0, promising = 0, testing = 0;
      let totalWinningScore = 0;
      let lowRisk = 0, mediumRisk = 0, highRisk = 0;
      let activeAds = 0;

      ads.forEach((ad) => {
        // Winning score calculation
        const longevityDays = ad.longevity_days || 0;
        const longevityScore = Math.min(100, (longevityDays / 60) * 100);
        const engagementScore = ad.engagement_score || 0;
        const total = Math.round(longevityScore * 0.6 + engagementScore * 0.4);
        
        totalWinningScore += total;
        
        if (total >= 85) champions++;
        else if (total >= 70) strong++;
        else if (total >= 50) promising++;
        else testing++;
        
        // Risk distribution
        const suspicionScore = ad.suspicion_score || 0;
        if (suspicionScore < 40) lowRisk++;
        else if (suspicionScore < 70) mediumRisk++;
        else highRisk++;
        
        // Active ads
        if (ad.status === "active") activeAds++;
      });

      const totalAds = adsCountResult.count || 0;
      const avgWinningScore = ads.length > 0 ? Math.round(totalWinningScore / ads.length) : 0;

      const duration = Math.round(performance.now() - startTime);
      trackQueryPerformance("dashboard-optimized", duration);
      logger.apiCall("dashboard/optimized", "SELECT", 200, duration);
      logger.info("API", "Dashboard data fetched", { duration: `${duration}ms`, adCount: ads.length });

      return {
        stats: {
          totalAds,
          totalAdvertisers: advertisersResult.count || 0,
          totalDomains: domainsResult.count || 0,
          highRiskAds: highRisk,
          activeAds,
        },
        winningStats: {
          champions,
          strong,
          promising,
          testing,
          totalWinners: champions + strong,
          avgWinningScore,
        },
        riskDistribution: [
          { name: "Low Risk", value: lowRisk, fill: "hsl(var(--chart-3))" },
          { name: "Medium Risk", value: mediumRisk, fill: "hsl(var(--chart-2))" },
          { name: "High Risk", value: highRisk, fill: "hsl(var(--chart-1))" },
        ],
        winningDistribution: [
          { name: "Champion", value: champions, fill: "hsl(45, 93%, 47%)" },
          { name: "Strong", value: strong, fill: "hsl(142, 71%, 45%)" },
          { name: "Promising", value: promising, fill: "hsl(217, 91%, 60%)" },
          { name: "Testing", value: testing, fill: "hsl(var(--muted))" },
        ],
        recentAds: [],
        topAdvertisers: topAdvertisersResult.data || [],
      };
    },
    // Specific cache settings for dashboard
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}
