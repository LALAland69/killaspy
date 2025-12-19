import { useState, useEffect, useCallback, useRef } from 'react';

export interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  delta?: number;
}

export interface WebVitalsState {
  lcp: WebVitalMetric | null;
  fid: WebVitalMetric | null;
  cls: WebVitalMetric | null;
  fcp: WebVitalMetric | null;
  ttfb: WebVitalMetric | null;
  inp: WebVitalMetric | null;
}

export interface WebVitalsHistory {
  timestamp: number;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}

// Thresholds according to Google's Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

function getRating(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Enhanced Web Vitals monitoring hook with history tracking
 */
export function useWebVitalsMonitor() {
  const [vitals, setVitals] = useState<WebVitalsState>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null,
  });

  const [history, setHistory] = useState<WebVitalsHistory[]>([]);
  const clsAccumulator = useRef(0);
  const inpAccumulator = useRef<number[]>([]);

  // Add to history periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        const entry: WebVitalsHistory = {
          timestamp: Date.now(),
          lcp: vitals.lcp?.value ?? null,
          fid: vitals.fid?.value ?? null,
          cls: vitals.cls?.value ?? null,
          fcp: vitals.fcp?.value ?? null,
          ttfb: vitals.ttfb?.value ?? null,
        };
        return [...prev.slice(-60), entry]; // Keep last 60 entries (5 minutes at 5s intervals)
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [vitals]);

  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;

    const observers: PerformanceObserver[] = [];

    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          const value = lastEntry.startTime;
          setVitals(prev => ({
            ...prev,
            lcp: {
              name: 'LCP',
              value,
              rating: getRating('LCP', value),
              timestamp: Date.now(),
            }
          }));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcpObserver);
    } catch (e) {}

    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const value = entry.processingStart - entry.startTime;
          setVitals(prev => ({
            ...prev,
            fid: {
              name: 'FID',
              value,
              rating: getRating('FID', value),
              timestamp: Date.now(),
            }
          }));
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      observers.push(fidObserver);
    } catch (e) {}

    // CLS Observer
    try {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsAccumulator.current += entry.value;
            setVitals(prev => ({
              ...prev,
              cls: {
                name: 'CLS',
                value: clsAccumulator.current,
                rating: getRating('CLS', clsAccumulator.current),
                timestamp: Date.now(),
                delta: entry.value,
              }
            }));
          }
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      observers.push(clsObserver);
    } catch (e) {}

    // FCP Observer
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            setVitals(prev => ({
              ...prev,
              fcp: {
                name: 'FCP',
                value: entry.startTime,
                rating: getRating('FCP', entry.startTime),
                timestamp: Date.now(),
              }
            }));
          }
        });
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      observers.push(fcpObserver);
    } catch (e) {}

    // Navigation timing (TTFB)
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.entryType === 'navigation') {
            const ttfb = entry.responseStart - entry.requestStart;
            setVitals(prev => ({
              ...prev,
              ttfb: {
                name: 'TTFB',
                value: ttfb,
                rating: getRating('TTFB', ttfb),
                timestamp: Date.now(),
              }
            }));
          }
        });
      });
      navObserver.observe({ type: 'navigation', buffered: true });
      observers.push(navObserver);
    } catch (e) {}

    // INP (Interaction to Next Paint) - Modern replacement for FID
    try {
      const inpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const duration = entry.duration;
          inpAccumulator.current.push(duration);
          // INP is the 98th percentile of interaction durations
          const sorted = [...inpAccumulator.current].sort((a, b) => a - b);
          const p98Index = Math.floor(sorted.length * 0.98);
          const inp = sorted[p98Index] || sorted[sorted.length - 1];
          
          setVitals(prev => ({
            ...prev,
            inp: {
              name: 'INP',
              value: inp,
              rating: getRating('INP', inp),
              timestamp: Date.now(),
            }
          }));
        });
      });
      // Use type assertion to handle durationThreshold which is valid but not in TS types
      inpObserver.observe({ type: 'event', buffered: true } as PerformanceObserverInit);
      observers.push(inpObserver);
    } catch (e) {}

    return () => {
      observers.forEach(o => o.disconnect());
    };
  }, []);

  // Calculate overall score
  const getOverallScore = useCallback((): number => {
    let score = 100;
    const weights = { lcp: 25, fid: 25, cls: 25, fcp: 15, ttfb: 10 };

    if (vitals.lcp) {
      if (vitals.lcp.rating === 'needs-improvement') score -= weights.lcp * 0.5;
      else if (vitals.lcp.rating === 'poor') score -= weights.lcp;
    }
    if (vitals.fid) {
      if (vitals.fid.rating === 'needs-improvement') score -= weights.fid * 0.5;
      else if (vitals.fid.rating === 'poor') score -= weights.fid;
    }
    if (vitals.cls) {
      if (vitals.cls.rating === 'needs-improvement') score -= weights.cls * 0.5;
      else if (vitals.cls.rating === 'poor') score -= weights.cls;
    }
    if (vitals.fcp) {
      if (vitals.fcp.rating === 'needs-improvement') score -= weights.fcp * 0.5;
      else if (vitals.fcp.rating === 'poor') score -= weights.fcp;
    }
    if (vitals.ttfb) {
      if (vitals.ttfb.rating === 'needs-improvement') score -= weights.ttfb * 0.5;
      else if (vitals.ttfb.rating === 'poor') score -= weights.ttfb;
    }

    return Math.max(0, Math.round(score));
  }, [vitals]);

  const getOverallRating = useCallback((): 'good' | 'needs-improvement' | 'poor' => {
    const score = getOverallScore();
    if (score >= 90) return 'good';
    if (score >= 50) return 'needs-improvement';
    return 'poor';
  }, [getOverallScore]);

  // Reset metrics (useful for SPA navigation)
  const reset = useCallback(() => {
    clsAccumulator.current = 0;
    inpAccumulator.current = [];
    setVitals({
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      inp: null,
    });
  }, []);

  return {
    vitals,
    history,
    getOverallScore,
    getOverallRating,
    reset,
    thresholds: THRESHOLDS,
  };
}

/**
 * Format metric value for display
 */
export function formatMetricValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Get color for metric rating
 */
export function getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good': return 'text-green-500';
    case 'needs-improvement': return 'text-yellow-500';
    case 'poor': return 'text-red-500';
  }
}

/**
 * Get background color for metric rating
 */
export function getRatingBgColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good': return 'bg-green-500/20';
    case 'needs-improvement': return 'bg-yellow-500/20';
    case 'poor': return 'bg-red-500/20';
  }
}
