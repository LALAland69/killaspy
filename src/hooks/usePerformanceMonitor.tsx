// Performance monitoring hook for tracking app performance
import { useState, useEffect, useCallback, useRef } from "react";
import { getAllQueryStats } from "@/lib/queryClient";
import { logger } from "@/lib/logger";

export interface PerformanceMetrics {
  // Page load metrics
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  
  // Runtime metrics
  memoryUsage: number | null;
  jsHeapSize: number | null;
  
  // Query metrics
  queryStats: Record<string, { avg: number; max: number; min: number; count: number }>;
  
  // Component render metrics
  componentRenders: Record<string, number>;
  slowRenders: Array<{ component: string; duration: number; timestamp: number }>;
  
  // Network metrics
  pendingRequests: number;
  failedRequests: number;
  avgRequestTime: number;
}

// Global render tracking
const componentRenders: Record<string, number> = {};
const slowRenders: Array<{ component: string; duration: number; timestamp: number }> = [];
const networkMetrics = { pending: 0, failed: 0, times: [] as number[] };

export function trackComponentRender(componentName: string, duration: number) {
  componentRenders[componentName] = (componentRenders[componentName] || 0) + 1;
  
  // Track slow renders (>16ms = below 60fps)
  if (duration > 16) {
    slowRenders.push({ component: componentName, duration, timestamp: Date.now() });
    // Keep only last 50 slow renders
    if (slowRenders.length > 50) slowRenders.shift();
    
    if (duration > 100) {
      logger.warn("PERF", `Slow render: ${componentName}`, { duration: `${duration}ms` });
    }
  }
}

export function trackNetworkRequest(duration: number, success: boolean) {
  if (!success) networkMetrics.failed++;
  networkMetrics.times.push(duration);
  if (networkMetrics.times.length > 100) networkMetrics.times.shift();
}

export function usePerformanceMonitor(interval = 5000) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => getInitialMetrics());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateMetrics = useCallback(() => {
    const newMetrics = collectMetrics();
    setMetrics(newMetrics);
  }, []);

  useEffect(() => {
    // Initial collection
    updateMetrics();
    
    // Set up periodic collection
    intervalRef.current = setInterval(updateMetrics, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, updateMetrics]);

  return {
    metrics,
    refresh: updateMetrics,
    clearSlowRenders: () => {
      slowRenders.length = 0;
      updateMetrics();
    },
  };
}

function getInitialMetrics(): PerformanceMetrics {
  return {
    pageLoadTime: 0,
    domContentLoaded: 0,
    firstContentfulPaint: 0,
    memoryUsage: null,
    jsHeapSize: null,
    queryStats: {},
    componentRenders: {},
    slowRenders: [],
    pendingRequests: 0,
    failedRequests: 0,
    avgRequestTime: 0,
  };
}

function collectMetrics(): PerformanceMetrics {
  const metrics = getInitialMetrics();
  
  // Navigation timing
  if (performance.timing) {
    const timing = performance.timing;
    metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
  }
  
  // First Contentful Paint
  const paintEntries = performance.getEntriesByType("paint");
  const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint");
  if (fcpEntry) {
    metrics.firstContentfulPaint = Math.round(fcpEntry.startTime);
  }
  
  // Memory (Chrome only)
  const memory = (performance as any).memory;
  if (memory) {
    metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    metrics.jsHeapSize = Math.round(memory.totalJSHeapSize / 1024 / 1024);
  }
  
  // Query stats
  metrics.queryStats = getAllQueryStats();
  
  // Component renders
  metrics.componentRenders = { ...componentRenders };
  metrics.slowRenders = [...slowRenders].slice(-20);
  
  // Network metrics
  metrics.failedRequests = networkMetrics.failed;
  metrics.avgRequestTime = networkMetrics.times.length > 0
    ? Math.round(networkMetrics.times.reduce((a, b) => a + b, 0) / networkMetrics.times.length)
    : 0;
  
  return metrics;
}

// HOC for tracking component performance
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function TrackedComponent(props: P) {
    const startTime = useRef(performance.now());
    
    useEffect(() => {
      const duration = performance.now() - startTime.current;
      trackComponentRender(componentName, duration);
    });
    
    return <WrappedComponent {...props} />;
  };
}

// Hook for measuring render time
export function useRenderTime(componentName: string) {
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    const duration = performance.now() - startTime.current;
    trackComponentRender(componentName, duration);
  });
}
