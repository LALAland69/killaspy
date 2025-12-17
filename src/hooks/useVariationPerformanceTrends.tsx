import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface TrendDataPoint {
  date: string;
  avgEngagement: number;
  avgLongevity: number;
  activeAds: number;
  totalVariations: number;
}

interface VariationTrend {
  adId: string;
  headline: string | null;
  dataPoints: {
    date: string;
    engagement: number | null;
    suspicion: number | null;
  }[];
}

export function useVariationPerformanceTrends(advertiserIds?: string[]) {
  // Fetch ads with history data
  const { data: ads, isLoading: adsLoading } = useQuery({
    queryKey: ["ads-for-trends", advertiserIds],
    queryFn: async () => {
      let query = supabase
        .from("ads")
        .select("*")
        .order("start_date", { ascending: true });

      if (advertiserIds && advertiserIds.length > 0) {
        query = query.in("advertiser_id", advertiserIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch ad history for detailed trends
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["ad-history-trends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_history")
        .select("*")
        .order("snapshot_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Generate aggregated trend data
  const aggregatedTrends = useMemo(() => {
    if (!ads || ads.length === 0) return [];

    // Group ads by start date (weekly buckets)
    const weeklyData = new Map<string, {
      engagements: number[];
      longevities: number[];
      activeCount: number;
      totalCount: number;
    }>();

    ads.forEach((ad) => {
      if (!ad.start_date) return;

      // Get week start date
      const date = new Date(ad.start_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          engagements: [],
          longevities: [],
          activeCount: 0,
          totalCount: 0,
        });
      }

      const bucket = weeklyData.get(weekKey)!;
      bucket.totalCount++;
      
      if (ad.engagement_score !== null) {
        bucket.engagements.push(ad.engagement_score);
      }
      if (ad.longevity_days !== null) {
        bucket.longevities.push(ad.longevity_days);
      }
      if (ad.status === "active") {
        bucket.activeCount++;
      }
    });

    // Convert to array and calculate averages
    const trends: TrendDataPoint[] = Array.from(weeklyData.entries())
      .map(([date, data]) => ({
        date,
        avgEngagement: data.engagements.length > 0
          ? Math.round(data.engagements.reduce((a, b) => a + b, 0) / data.engagements.length)
          : 0,
        avgLongevity: data.longevities.length > 0
          ? Math.round(data.longevities.reduce((a, b) => a + b, 0) / data.longevities.length)
          : 0,
        activeAds: data.activeCount,
        totalVariations: data.totalCount,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-12); // Last 12 weeks

    return trends;
  }, [ads]);

  // Generate individual ad trends from history
  const individualTrends = useMemo(() => {
    if (!history || history.length === 0 || !ads) return [];

    const adTrends = new Map<string, VariationTrend>();

    history.forEach((record) => {
      if (!adTrends.has(record.ad_id)) {
        const ad = ads.find((a) => a.id === record.ad_id);
        adTrends.set(record.ad_id, {
          adId: record.ad_id,
          headline: ad?.headline || null,
          dataPoints: [],
        });
      }

      adTrends.get(record.ad_id)!.dataPoints.push({
        date: record.snapshot_date,
        engagement: record.engagement_score,
        suspicion: record.suspicion_score,
      });
    });

    return Array.from(adTrends.values());
  }, [history, ads]);

  // Performance comparison data (for bar charts)
  const performanceComparison = useMemo(() => {
    if (!ads || ads.length === 0) return [];

    // Group by page_name/advertiser and calculate avg performance
    const grouped = new Map<string, {
      name: string;
      avgEngagement: number[];
      avgLongevity: number[];
      count: number;
    }>();

    ads.forEach((ad) => {
      const key = ad.page_name || ad.advertiser_id || "Unknown";
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          name: key,
          avgEngagement: [],
          avgLongevity: [],
          count: 0,
        });
      }

      const group = grouped.get(key)!;
      group.count++;
      
      if (ad.engagement_score !== null) {
        group.avgEngagement.push(ad.engagement_score);
      }
      if (ad.longevity_days !== null) {
        group.avgLongevity.push(ad.longevity_days);
      }
    });

    return Array.from(grouped.values())
      .map((g) => ({
        name: g.name.length > 20 ? g.name.substring(0, 20) + "..." : g.name,
        fullName: g.name,
        engagement: g.avgEngagement.length > 0
          ? Math.round(g.avgEngagement.reduce((a, b) => a + b, 0) / g.avgEngagement.length)
          : 0,
        longevity: g.avgLongevity.length > 0
          ? Math.round(g.avgLongevity.reduce((a, b) => a + b, 0) / g.avgLongevity.length)
          : 0,
        count: g.count,
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);
  }, [ads]);

  return {
    aggregatedTrends,
    individualTrends,
    performanceComparison,
    isLoading: adsLoading || historyLoading,
  };
}
