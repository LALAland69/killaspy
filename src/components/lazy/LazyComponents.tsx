/**
 * FASE 6: Lazy Loading Components
 * Componentes pesados carregados sob demanda
 */

import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

// ============= LOADING FALLBACKS =============

export function ChartLoadingFallback() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center bg-muted/30 rounded-lg animate-pulse">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando gráfico...</span>
      </div>
    </div>
  );
}

export function TableLoadingFallback() {
  return (
    <div className="w-full space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function GridLoadingFallback() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-[400px] w-full rounded-lg" />
      ))}
    </div>
  );
}

export function FormLoadingFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-1/3" />
    </div>
  );
}

// ============= LAZY COMPONENT WRAPPER =============

interface LazyComponentOptions {
  fallback?: ReactNode;
  delay?: number;
}

/**
 * Creates a lazy-loaded component with automatic fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
) {
  const LazyComponent = lazy(importFn);
  const { fallback = <ChartLoadingFallback />, delay = 0 } = options;

  return function WrappedLazyComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// ============= LAZY LOADED HEAVY COMPONENTS =============

// Charts - Very heavy due to Recharts
export const LazyAdVelocityChart = createLazyComponent(
  () => import('@/components/dashboard/AdVelocityChart').then(m => ({ default: m.AdVelocityChart })),
  { fallback: <ChartLoadingFallback /> }
);

export const LazyNicheGrowthChart = createLazyComponent(
  () => import('@/components/dashboard/NicheGrowthChart').then(m => ({ default: m.NicheGrowthChart })),
  { fallback: <ChartLoadingFallback /> }
);

export const LazyRiskDistributionChart = createLazyComponent(
  () => import('@/components/dashboard/RiskDistributionChart').then(m => ({ default: m.RiskDistributionChart })),
  { fallback: <ChartLoadingFallback /> }
);

export const LazyWinningDistributionChart = createLazyComponent(
  () => import('@/components/dashboard/WinningDistributionChart').then(m => ({ default: m.WinningDistributionChart })),
  { fallback: <ChartLoadingFallback /> }
);

export const LazyDomainDistributionChart = createLazyComponent(
  () => import('@/components/advertisers/DomainDistributionChart').then(m => ({ default: m.DomainDistributionChart })),
  { fallback: <ChartLoadingFallback /> }
);

export const LazyScoreBreakdownChart = createLazyComponent(
  () => import('@/components/advertisers/ScoreBreakdownChart').then(m => ({ default: m.ScoreBreakdownChart })),
  { fallback: <ChartLoadingFallback /> }
);

export const LazyFunnelAnalysisChart = createLazyComponent(
  () => import('@/components/domains/FunnelAnalysisChart').then(m => ({ default: m.FunnelAnalysisChart })),
  { fallback: <ChartLoadingFallback /> }
);

export const LazyTechStackChart = createLazyComponent(
  () => import('@/components/domains/TechStackChart').then(m => ({ default: m.TechStackChart })),
  { fallback: <ChartLoadingFallback /> }
);

export const LazyVariationPerformanceCharts = createLazyComponent(
  () => import('@/components/ads/VariationPerformanceCharts').then(m => ({ default: m.VariationPerformanceCharts })),
  { fallback: <ChartLoadingFallback /> }
);

// Tables - Medium weight
export const LazyAdsTable = createLazyComponent(
  () => import('@/components/ads/AdsTable').then(m => ({ default: m.AdsTable })),
  { fallback: <TableLoadingFallback /> }
);

export const LazyAdvertisersTable = createLazyComponent(
  () => import('@/components/advertisers/AdvertisersTable').then(m => ({ default: m.AdvertisersTable })),
  { fallback: <TableLoadingFallback /> }
);

export const LazyDomainsTable = createLazyComponent(
  () => import('@/components/domains/DomainsTable').then(m => ({ default: m.DomainsTable })),
  { fallback: <TableLoadingFallback /> }
);

// Grids - Heavy with virtualization
export const LazyAdsGrid = createLazyComponent(
  () => import('@/components/ads/AdsGrid').then(m => ({ default: m.AdsGrid })),
  { fallback: <GridLoadingFallback /> }
);

// Complex Forms/Panels
export const LazyAdVariationsPanel = createLazyComponent(
  () => import('@/components/ads/AdVariationsPanel').then(m => ({ default: m.AdVariationsPanel })),
  { fallback: <FormLoadingFallback /> }
);

export const LazyCopyAnalyzer = createLazyComponent(
  () => import('@/components/ads/CopyAnalyzer').then(m => ({ default: m.CopyAnalyzer })),
  { fallback: <FormLoadingFallback /> }
);

export const LazyAdLibraryImport = createLazyComponent(
  () => import('@/components/ads/AdLibraryImport').then(m => ({ default: m.AdLibraryImport })),
  { fallback: <FormLoadingFallback /> }
);

export const LazyTrendValidationPanel = createLazyComponent(
  () => import('@/components/trends/TrendValidationPanel').then(m => ({ default: m.TrendValidationPanel })),
  { fallback: <FormLoadingFallback /> }
);

export const LazyCompetitiveIntelligenceReport = createLazyComponent(
  () => import('@/components/intelligence/CompetitiveIntelligenceReport').then(m => ({ default: m.CompetitiveIntelligenceReport })),
  { fallback: <FormLoadingFallback /> }
);

export const LazyToolsKnowledgeBase = createLazyComponent(
  () => import('@/components/intelligence/ToolsKnowledgeBase').then(m => ({ default: m.ToolsKnowledgeBase })),
  { fallback: <FormLoadingFallback /> }
);

// Audit Components
export const LazyAuditFindingsList = createLazyComponent(
  () => import('@/components/audit/AuditFindingsList').then(m => ({ default: m.AuditFindingsList })),
  { fallback: <TableLoadingFallback /> }
);

export const LazyCreateAuditDialog = createLazyComponent(
  () => import('@/components/audit/CreateAuditDialog').then(m => ({ default: m.CreateAuditDialog })),
  { fallback: <FormLoadingFallback /> }
);

// PWA Components
export const LazyPWASettingsPanel = createLazyComponent(
  () => import('@/components/pwa/PWASettingsPanel').then(m => ({ default: m.PWASettingsPanel })),
  { fallback: <FormLoadingFallback /> }
);
