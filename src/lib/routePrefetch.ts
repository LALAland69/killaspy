/**
 * FASE 6: Route Prefetching
 * Preload de rotas críticas para navegação instantânea
 */

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Map of routes to their import functions
const routeModules: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/Index'),
  '/ads': () => import('@/pages/AdsPage'),
  '/advertisers': () => import('@/pages/AdvertisersPage'),
  '/domains': () => import('@/pages/DomainsPage'),
  '/import': () => import('@/pages/AdImportPage'),
  '/trends': () => import('@/pages/TrendsPage'),
  '/intelligence': () => import('@/pages/IntelligencePage'),
  '/divergence': () => import('@/pages/DivergencePage'),
  '/saved-ads': () => import('@/pages/SavedAdsPage'),
  '/jobs': () => import('@/pages/JobHistoryPage'),
  '/alerts': () => import('@/pages/AlertsPage'),
  '/security-audits': () => import('@/pages/SecurityAuditsPage'),
  '/logs': () => import('@/pages/LogsPage'),
  '/health': () => import('@/pages/HealthCheckPage'),
  '/performance': () => import('@/pages/PerformanceDashboardPage'),
};

// Related routes - prefetch these when user is on a specific route
const relatedRoutes: Record<string, string[]> = {
  '/': ['/ads', '/advertisers', '/domains'],
  '/ads': ['/saved-ads', '/advertisers', '/import'],
  '/advertisers': ['/ads', '/domains'],
  '/domains': ['/advertisers', '/divergence'],
  '/import': ['/ads', '/jobs'],
  '/trends': ['/intelligence', '/ads'],
  '/intelligence': ['/trends', '/ads'],
  '/security-audits': ['/alerts', '/logs'],
};

// Cache for already prefetched routes
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a single route
 */
function prefetchRoute(path: string): void {
  if (prefetchedRoutes.has(path)) return;
  
  const importFn = routeModules[path];
  if (!importFn) return;
  
  // Use requestIdleCallback for non-blocking prefetch
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().then(() => {
        prefetchedRoutes.add(path);
        console.debug(`[PREFETCH] Route prefetched: ${path}`);
      }).catch(() => {
        // Silent fail - prefetch is optional
      });
    }, { timeout: 5000 });
  } else {
    // Fallback for Safari
    setTimeout(() => {
      importFn().then(() => {
        prefetchedRoutes.add(path);
      }).catch(() => {});
    }, 100);
  }
}

/**
 * Prefetch multiple routes
 */
function prefetchRoutes(paths: string[]): void {
  paths.forEach((path, index) => {
    // Stagger prefetches to avoid blocking
    setTimeout(() => prefetchRoute(path), index * 100);
  });
}

/**
 * Hook to enable route prefetching based on current location
 */
export function useRoutePrefetching(): void {
  const location = useLocation();
  
  useEffect(() => {
    // Prefetch related routes after a delay
    const timer = setTimeout(() => {
      const related = relatedRoutes[location.pathname] || [];
      prefetchRoutes(related);
    }, 1000); // Wait 1s after navigation to start prefetching
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
}

/**
 * Hook to prefetch on link hover
 */
export function useLinkPrefetch(to: string) {
  const prefetch = useCallback(() => {
    prefetchRoute(to);
  }, [to]);
  
  return {
    onMouseEnter: prefetch,
    onFocus: prefetch,
  };
}

/**
 * Prefetch critical routes on app startup
 */
export function prefetchCriticalRoutes(): void {
  // Wait for initial render to complete
  setTimeout(() => {
    const criticalRoutes = ['/', '/ads', '/import'];
    prefetchRoutes(criticalRoutes);
  }, 2000);
}

/**
 * Manual prefetch trigger - useful for navigation menus
 */
export function triggerPrefetch(path: string): void {
  prefetchRoute(path);
}
