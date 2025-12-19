// Optimized QueryClient configuration for maximum performance
import { QueryClient } from "@tanstack/react-query";
import { logger } from "./logger";

// Performance tracking for queries
const queryTimes = new Map<string, number[]>();

export function trackQueryPerformance(queryKey: string, duration: number) {
  const times = queryTimes.get(queryKey) || [];
  times.push(duration);
  // Keep only last 100 measurements
  if (times.length > 100) times.shift();
  queryTimes.set(queryKey, times);
}

export function getQueryStats(queryKey: string) {
  const times = queryTimes.get(queryKey) || [];
  if (times.length === 0) return null;
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);
  
  return { avg: Math.round(avg), max, min, count: times.length };
}

export function getAllQueryStats() {
  const stats: Record<string, { avg: number; max: number; min: number; count: number }> = {};
  queryTimes.forEach((times, key) => {
    const s = getQueryStats(key);
    if (s) stats[key] = s;
  });
  return stats;
}

// Create optimized QueryClient with default options
export function createOptimizedQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for 5 minutes before refetching
        staleTime: 5 * 60 * 1000,
        
        // Keep unused data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        
        // Retry failed queries 2 times with exponential backoff
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Don't refetch on window focus (reduces unnecessary queries)
        refetchOnWindowFocus: false,
        
        // Don't refetch on reconnect unless data is stale
        refetchOnReconnect: "always",
        
        // Network mode
        networkMode: "offlineFirst",
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
        
        // Log mutation errors
        onError: (error) => {
          logger.error("MUTATION", "Mutation failed", { error: (error as Error).message });
        },
      },
    },
  });
}

// Export a singleton instance
export const optimizedQueryClient = createOptimizedQueryClient();
