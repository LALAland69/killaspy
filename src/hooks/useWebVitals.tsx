import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null;  // Largest Contentful Paint
  fid: number | null;  // First Input Delay
  cls: number | null;  // Cumulative Layout Shift
  fcp: number | null;  // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  
  // Custom metrics
  pageLoadTime: number | null;
  domContentLoaded: number | null;
  resourceCount: number;
  jsHeapSize: number | null;
}

interface UsePerformanceOptions {
  /** Enable reporting to console */
  debug?: boolean;
  /** Threshold for slow LCP in ms */
  lcpThreshold?: number;
  /** Threshold for slow FID in ms */
  fidThreshold?: number;
  /** Threshold for poor CLS */
  clsThreshold?: number;
}

/**
 * Hook for monitoring Core Web Vitals and performance metrics
 */
export function useWebVitals(options: UsePerformanceOptions = {}) {
  const { 
    debug = false, 
    lcpThreshold = 2500, 
    fidThreshold = 100, 
    clsThreshold = 0.1 
  } = options;
  
  const metricsRef = useRef<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    pageLoadTime: null,
    domContentLoaded: null,
    resourceCount: 0,
    jsHeapSize: null
  });

  const reportMetric = useCallback((name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') => {
    if (debug) {
      const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`[Performance] ${emoji} ${name}: ${value.toFixed(2)} (${rating})`);
    }
  }, [debug]);

  useEffect(() => {
    // Check if Performance Observer is supported
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('[Performance] PerformanceObserver not supported');
      return;
    }

    const observers: PerformanceObserver[] = [];

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          const value = lastEntry.startTime;
          metricsRef.current.lcp = value;
          const rating = value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
          reportMetric('LCP', value, rating);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcpObserver);
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          const value = entry.processingStart - entry.startTime;
          metricsRef.current.fid = value;
          const rating = value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
          reportMetric('FID', value, rating);
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      observers.push(fidObserver);
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        metricsRef.current.cls = clsValue;
        const rating = clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor';
        reportMetric('CLS', clsValue, rating);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      observers.push(clsObserver);
    } catch (e) {
      // CLS not supported
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metricsRef.current.fcp = entry.startTime;
            const rating = entry.startTime <= 1800 ? 'good' : entry.startTime <= 3000 ? 'needs-improvement' : 'poor';
            reportMetric('FCP', entry.startTime, rating);
          }
        });
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      observers.push(fcpObserver);
    } catch (e) {
      // FCP not supported
    }

    // Navigation timing (TTFB, page load)
    try {
      const navObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (entry.entryType === 'navigation') {
            // Time to First Byte
            const ttfb = entry.responseStart - entry.requestStart;
            metricsRef.current.ttfb = ttfb;
            const ttfbRating = ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor';
            reportMetric('TTFB', ttfb, ttfbRating);

            // DOM Content Loaded
            metricsRef.current.domContentLoaded = entry.domContentLoadedEventEnd;
            
            // Page Load Time
            metricsRef.current.pageLoadTime = entry.loadEventEnd;
          }
        });
      });
      navObserver.observe({ type: 'navigation', buffered: true });
      observers.push(navObserver);
    } catch (e) {
      // Navigation timing not supported
    }

    // Resource count
    if (performance.getEntriesByType) {
      metricsRef.current.resourceCount = performance.getEntriesByType('resource').length;
    }

    // JS Heap Size (Chrome only)
    if ((performance as any).memory) {
      metricsRef.current.jsHeapSize = (performance as any).memory.usedJSHeapSize;
    }

    // Cleanup
    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [reportMetric]);

  const getMetrics = useCallback(() => metricsRef.current, []);

  const getWebVitalsScore = useCallback((): 'good' | 'needs-improvement' | 'poor' => {
    const { lcp, fid, cls } = metricsRef.current;
    
    if (lcp === null || cls === null) return 'needs-improvement';
    
    const lcpGood = lcp <= lcpThreshold;
    const fidGood = fid === null || fid <= fidThreshold;
    const clsGood = cls <= clsThreshold;

    if (lcpGood && fidGood && clsGood) return 'good';
    if (!lcpGood && !clsGood) return 'poor';
    return 'needs-improvement';
  }, [lcpThreshold, fidThreshold, clsThreshold]);

  return {
    getMetrics,
    getWebVitalsScore
  };
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(onReport: (metric: { name: string; value: number; rating: string }) => void) {
  if (typeof PerformanceObserver === 'undefined') return;

  const metrics = ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint'];
  
  metrics.forEach(metricType => {
    try {
      new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry: any) => {
          let value = entry.startTime;
          let name = entry.name || metricType;
          
          if (metricType === 'first-input') {
            value = entry.processingStart - entry.startTime;
            name = 'FID';
          } else if (metricType === 'layout-shift') {
            value = entry.value;
            name = 'CLS';
          } else if (metricType === 'largest-contentful-paint') {
            name = 'LCP';
          } else if (entry.name === 'first-contentful-paint') {
            name = 'FCP';
          }

          const rating = getRating(name, value);
          onReport({ name, value, rating });
        });
      }).observe({ type: metricType, buffered: true });
    } catch (e) {
      // Metric not supported
    }
  });
}

function getRating(name: string, value: number): string {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800]
  };

  const [good, needsImprovement] = thresholds[name] || [Infinity, Infinity];
  if (value <= good) return 'good';
  if (value <= needsImprovement) return 'needs-improvement';
  return 'poor';
}
