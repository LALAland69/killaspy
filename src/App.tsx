import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { logger } from "@/lib/logger";
import { optimizedQueryClient } from "@/lib/queryClient";
import { PageLoadingFallback } from "@/components/ui/loading-spinner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineIndicator } from "@/hooks/useNetworkStatus";
import { ChunkErrorBanner } from "@/components/pwa/ChunkErrorBanner";
import { useRoutePrefetching, prefetchCriticalRoutes } from "@/lib/routePrefetch";

// Eager load critical public pages (avoid chunk-load issues)
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import SalesPage from "./pages/SalesPage";

// Lazy load all other pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const AdsPage = lazy(() => import("./pages/AdsPage"));
const AdDetailPage = lazy(() => import("./pages/AdDetailPage"));
const SavedAdsPage = lazy(() => import("./pages/SavedAdsPage"));
const AdvertisersPage = lazy(() => import("./pages/AdvertisersPage"));
const AdvertiserProfilePage = lazy(() => import("./pages/AdvertiserProfilePage"));
const DomainsPage = lazy(() => import("./pages/DomainsPage"));
const DomainProfilePage = lazy(() => import("./pages/DomainProfilePage"));
const DivergencePage = lazy(() => import("./pages/DivergencePage"));
const TrendsPage = lazy(() => import("./pages/TrendsPage"));
const JobHistoryPage = lazy(() => import("./pages/JobHistoryPage"));
const AdImportPage = lazy(() => import("./pages/AdImportPage"));
const IntelligencePage = lazy(() => import("./pages/IntelligencePage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const SecurityAuditsPage = lazy(() => import("./pages/SecurityAuditsPage"));
const AuditDetailPage = lazy(() => import("./pages/AuditDetailPage"));
const LogsPage = lazy(() => import("./pages/LogsPage"));
const HealthCheckPage = lazy(() => import("./pages/HealthCheckPage"));
const PerformanceDashboardPage = lazy(() => import("./pages/PerformanceDashboardPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const PWATestPage = lazy(() => import("./pages/PWATestPage"));
const AdsDiscoveryPage = lazy(() => import("./pages/AdsDiscoveryPage"));
const ScrapingDashboardPage = lazy(() => import("./pages/ScrapingDashboardPage"));
const FacebookSetupPage = lazy(() => import("./pages/FacebookSetupPage"));

// Navigation logger component with prefetching
function NavigationLogger() {
  const location = useLocation();
  
  // Enable route prefetching
  useRoutePrefetching();
  
  useEffect(() => {
    logger.navigate(document.referrer || 'direct', location.pathname);
  }, [location.pathname]);
  
  return null;
}

// App initialization with prefetching
function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    logger.info('SYSTEM', 'Application initialized', {
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    // Prefetch critical routes after initial load
    prefetchCriticalRoutes();
  }, []);
  
  return <>{children}</>;
}

// Wrapper for lazy loaded protected routes
function LazyProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageLoadingFallback />}>
        {children}
      </Suspense>
    </ProtectedRoute>
  );
}

// Wrapper for lazy loaded public routes
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      {children}
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={optimizedQueryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppInitializer>
            <NavigationLogger />
              <InstallPrompt showDelay={45000} minPageViews={3} />
              <OfflineIndicator />
              <ChunkErrorBanner />
              <Routes>
                {/* Public pages */}
                <Route path="/pagina-de-vendas" element={<SalesPage />} />
                <Route path="/privacidade" element={<PrivacyPage />} />
                <Route path="/termos" element={<TermsPage />} />
                <Route path="/install" element={<LazyRoute><InstallPage /></LazyRoute>} />
                <Route path="/pwa-test" element={<LazyRoute><PWATestPage /></LazyRoute>} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected pages with lazy loading */}
                <Route path="/" element={<LazyProtectedRoute><Index /></LazyProtectedRoute>} />
                <Route path="/ads" element={<LazyProtectedRoute><AdsPage /></LazyProtectedRoute>} />
                <Route path="/ads/:id" element={<LazyProtectedRoute><AdDetailPage /></LazyProtectedRoute>} />
                <Route path="/saved-ads" element={<LazyProtectedRoute><SavedAdsPage /></LazyProtectedRoute>} />
                <Route path="/advertisers" element={<LazyProtectedRoute><AdvertisersPage /></LazyProtectedRoute>} />
                <Route path="/advertisers/:id" element={<LazyProtectedRoute><AdvertiserProfilePage /></LazyProtectedRoute>} />
                <Route path="/domains" element={<LazyProtectedRoute><DomainsPage /></LazyProtectedRoute>} />
                <Route path="/domains/:id" element={<LazyProtectedRoute><DomainProfilePage /></LazyProtectedRoute>} />
                <Route path="/divergence" element={<LazyProtectedRoute><DivergencePage /></LazyProtectedRoute>} />
                <Route path="/trends" element={<LazyProtectedRoute><TrendsPage /></LazyProtectedRoute>} />
                <Route path="/jobs" element={<LazyProtectedRoute><JobHistoryPage /></LazyProtectedRoute>} />
                <Route path="/import" element={<LazyProtectedRoute><AdImportPage /></LazyProtectedRoute>} />
                <Route path="/intelligence" element={<LazyProtectedRoute><IntelligencePage /></LazyProtectedRoute>} />
                <Route path="/alerts" element={<LazyProtectedRoute><AlertsPage /></LazyProtectedRoute>} />
                <Route path="/security-audits" element={<LazyProtectedRoute><SecurityAuditsPage /></LazyProtectedRoute>} />
                <Route path="/security-audits/:id" element={<LazyProtectedRoute><AuditDetailPage /></LazyProtectedRoute>} />
                <Route path="/logs" element={<LazyProtectedRoute><LogsPage /></LazyProtectedRoute>} />
                <Route path="/health" element={<LazyProtectedRoute><HealthCheckPage /></LazyProtectedRoute>} />
                <Route path="/performance" element={<LazyProtectedRoute><PerformanceDashboardPage /></LazyProtectedRoute>} />
                <Route path="/discovery" element={<LazyProtectedRoute><AdsDiscoveryPage /></LazyProtectedRoute>} />
                <Route path="/scraping" element={<LazyProtectedRoute><ScrapingDashboardPage /></LazyProtectedRoute>} />
                <Route path="/facebook-setup" element={<LazyProtectedRoute><FacebookSetupPage /></LazyProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppInitializer>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
