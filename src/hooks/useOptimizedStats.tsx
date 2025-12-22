import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { CACHE_TIMES } from "@/lib/constants";

interface DashboardStats {
  total_ads: number;
  high_risk_ads: number;
  champion_ads: number;
  strong_ads: number;
  promising_ads: number;
  testing_ads: number;
  avg_suspicion_score: number;
  avg_longevity_days: number;
  last_ad_created: string | null;
}

/**
 * Hook otimizado para dashboard stats usando materialized view
 * Performance: ~10x mais rápido que queries individuais
 */
export function useOptimizedDashboardStats() {
  return useQuery({
    queryKey: ["optimized-dashboard-stats"],
    queryFn: async () => {
      const startTime = performance.now();
      logger.debug("API", "Fetching optimized dashboard stats");

      const { data, error } = await supabase.rpc('get_dashboard_stats');

      const duration = Math.round(performance.now() - startTime);

      if (error) {
        logger.apiCall("dashboard-stats-rpc", "RPC", 400, duration, error.message);
        throw error;
      }

      logger.apiCall("dashboard-stats-rpc", "RPC", 200, duration);

      // Se não há dados, retorna valores padrão
      if (!data || data.length === 0) {
        return {
          totalAds: 0,
          highRiskAds: 0,
          winningStats: {
            champions: 0,
            strong: 0,
            promising: 0,
            testing: 0,
            totalWinners: 0,
            avgWinningScore: 0,
          },
        };
      }

      const stats = data[0] as DashboardStats;

      return {
        totalAds: Number(stats.total_ads) || 0,
        highRiskAds: Number(stats.high_risk_ads) || 0,
        avgSuspicionScore: stats.avg_suspicion_score || 0,
        avgLongevityDays: stats.avg_longevity_days || 0,
        lastAdCreated: stats.last_ad_created,
        winningStats: {
          champions: Number(stats.champion_ads) || 0,
          strong: Number(stats.strong_ads) || 0,
          promising: Number(stats.promising_ads) || 0,
          testing: Number(stats.testing_ads) || 0,
          totalWinners: (Number(stats.champion_ads) || 0) + (Number(stats.strong_ads) || 0),
          avgWinningScore: (stats.avg_longevity_days || 0) + Math.round((stats.avg_suspicion_score || 0) / 10),
        },
      };
    },
    staleTime: CACHE_TIMES.STALE_TIME_DASHBOARD,
    gcTime: CACHE_TIMES.GC_TIME,
  });
}

/**
 * Hook para refresh manual das stats do dashboard
 * NOTA: Requer privilégios de admin para executar
 */
export function useRefreshDashboardStats() {
  return useQuery({
    queryKey: ["refresh-dashboard-stats"],
    queryFn: async () => {
      const { error } = await supabase.rpc('refresh_dashboard_stats');
      if (error) {
        // Handle authorization errors gracefully
        if (error.message?.includes('Admin privileges required')) {
          logger.warn("API", "Dashboard refresh requires admin privileges");
          return { refreshed: false, reason: 'admin_required', timestamp: new Date().toISOString() };
        }
        if (error.message?.includes('Refresh already in progress')) {
          logger.warn("API", "Dashboard refresh already in progress");
          return { refreshed: false, reason: 'in_progress', timestamp: new Date().toISOString() };
        }
        throw error;
      }
      return { refreshed: true, timestamp: new Date().toISOString() };
    },
    enabled: false, // Apenas executar manualmente
  });
}
