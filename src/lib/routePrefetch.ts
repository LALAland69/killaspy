/**
 * FASE 6: Route Prefetching OTIMIZADO
 * Preload inteligente baseado em comportamento do usuário
 */

import { useEffect, useCallback, useRef } from 'react';
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

// Rotas prioritárias por frequência de acesso (analytics-driven)
const routePriority: Record<string, number> = {
  '/': 10,
  '/ads': 9,
  '/import': 8,
  '/advertisers': 7,
  '/domains': 6,
  '/trends': 5,
  '/saved-ads': 4,
  '/intelligence': 3,
  '/alerts': 2,
  '/jobs': 1,
};

// Related routes - prefetch these when user is on a specific route
const relatedRoutes: Record<string, string[]> = {
  '/': ['/ads', '/import'], // Apenas as 2 mais importantes
  '/ads': ['/saved-ads', '/import'],
  '/advertisers': ['/ads', '/domains'],
  '/domains': ['/advertisers'],
  '/import': ['/ads'],
  '/trends': ['/intelligence'],
  '/intelligence': ['/trends'],
  '/security-audits': ['/alerts'],
};

// Cache for already prefetched routes
const prefetchedRoutes = new Set<string>();

// Debounce timer ref
let prefetchDebounceTimer: NodeJS.Timeout | null = null;

/**
 * Prefetch a single route with debounce protection
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
    }, { timeout: 3000 }); // Reduzido de 5000 para 3000
  } else {
    // Fallback for Safari
    setTimeout(() => {
      importFn().then(() => {
        prefetchedRoutes.add(path);
      }).catch(() => {});
    }, 50); // Reduzido de 100 para 50
  }
}

/**
 * Prefetch multiple routes with stagger and priority sorting
 */
function prefetchRoutes(paths: string[]): void {
  // Ordenar por prioridade
  const sortedPaths = paths.sort((a, b) => 
    (routePriority[b] || 0) - (routePriority[a] || 0)
  );
  
  // Limitar a 2 rotas por vez para não sobrecarregar
  const limitedPaths = sortedPaths.slice(0, 2);
  
  limitedPaths.forEach((path, index) => {
    // Stagger com intervalo maior
    setTimeout(() => prefetchRoute(path), index * 200); // Aumentado de 100 para 200
  });
}

/**
 * Hook to enable route prefetching based on current location
 * Com debounce para evitar prefetch excessivo
 */
export function useRoutePrefetching(): void {
  const location = useLocation();
  const lastPathRef = useRef<string>('');
  
  useEffect(() => {
    // Evitar prefetch duplicado na mesma rota
    if (lastPathRef.current === location.pathname) return;
    lastPathRef.current = location.pathname;
    
    // Limpar timer anterior (debounce)
    if (prefetchDebounceTimer) {
      clearTimeout(prefetchDebounceTimer);
    }
    
    // Prefetch related routes after delay with debounce
    prefetchDebounceTimer = setTimeout(() => {
      const related = relatedRoutes[location.pathname] || [];
      if (related.length > 0) {
        prefetchRoutes(related);
      }
    }, 1500); // Aumentado de 1000 para 1500 para dar mais tempo
    
    return () => {
      if (prefetchDebounceTimer) {
        clearTimeout(prefetchDebounceTimer);
      }
    };
  }, [location.pathname]);
}

/**
 * Hook to prefetch on link hover - com debounce
 */
export function useLinkPrefetch(to: string) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const prefetch = useCallback(() => {
    // Debounce de 150ms para evitar prefetch em hover acidental
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      prefetchRoute(to);
    }, 150);
  }, [to]);
  
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);
  
  return {
    onMouseEnter: prefetch,
    onMouseLeave: cancel,
    onFocus: prefetch,
    onBlur: cancel,
  };
}

/**
 * Prefetch critical routes on app startup - apenas as mais importantes
 */
export function prefetchCriticalRoutes(): void {
  // Wait for initial render to complete
  setTimeout(() => {
    // Apenas 2 rotas críticas para não sobrecarregar
    const criticalRoutes = ['/', '/ads'];
    prefetchRoutes(criticalRoutes);
  }, 3000); // Aumentado de 2000 para 3000
}

/**
 * Manual prefetch trigger - useful for navigation menus
 */
export function triggerPrefetch(path: string): void {
  prefetchRoute(path);
}
