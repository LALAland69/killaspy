import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdsPage from "./pages/AdsPage";
import AdDetailPage from "./pages/AdDetailPage";
import SavedAdsPage from "./pages/SavedAdsPage";
import AdvertisersPage from "./pages/AdvertisersPage";
import AdvertiserProfilePage from "./pages/AdvertiserProfilePage";
import DomainsPage from "./pages/DomainsPage";
import DomainProfilePage from "./pages/DomainProfilePage";
import DivergencePage from "./pages/DivergencePage";
import TrendsPage from "./pages/TrendsPage";
import JobHistoryPage from "./pages/JobHistoryPage";
import AdImportPage from "./pages/AdImportPage";
import IntelligencePage from "./pages/IntelligencePage";
import AlertsPage from "./pages/AlertsPage";
import SecurityAuditsPage from "./pages/SecurityAuditsPage";
import AuditDetailPage from "./pages/AuditDetailPage";
import LogsPage from "./pages/LogsPage";
import NotFound from "./pages/NotFound";
import SalesPage from "./pages/SalesPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public pages */}
              <Route path="/pagina-de-vendas" element={<SalesPage />} />
              <Route path="/privacidade" element={<PrivacyPage />} />
              <Route path="/termos" element={<TermsPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/ads" element={
                <ProtectedRoute>
                  <AdsPage />
                </ProtectedRoute>
              } />
              <Route path="/ads/:id" element={
                <ProtectedRoute>
                  <AdDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/saved-ads" element={
                <ProtectedRoute>
                  <SavedAdsPage />
                </ProtectedRoute>
              } />
              <Route path="/advertisers" element={
                <ProtectedRoute>
                  <AdvertisersPage />
                </ProtectedRoute>
              } />
              <Route path="/advertisers/:id" element={
                <ProtectedRoute>
                  <AdvertiserProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/domains" element={
                <ProtectedRoute>
                  <DomainsPage />
                </ProtectedRoute>
              } />
              <Route path="/domains/:id" element={
                <ProtectedRoute>
                  <DomainProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/divergence" element={
                <ProtectedRoute>
                  <DivergencePage />
                </ProtectedRoute>
              } />
              <Route path="/trends" element={
                <ProtectedRoute>
                  <TrendsPage />
                </ProtectedRoute>
              } />
              <Route path="/jobs" element={
                <ProtectedRoute>
                  <JobHistoryPage />
                </ProtectedRoute>
              } />
              <Route path="/import" element={
                <ProtectedRoute>
                  <AdImportPage />
                </ProtectedRoute>
              } />
              <Route path="/intelligence" element={
                <ProtectedRoute>
                  <IntelligencePage />
                </ProtectedRoute>
              } />
              <Route path="/alerts" element={
                <ProtectedRoute>
                  <AlertsPage />
                </ProtectedRoute>
              } />
              <Route path="/security-audits" element={
                <ProtectedRoute>
                  <SecurityAuditsPage />
                </ProtectedRoute>
              } />
              <Route path="/security-audits/:id" element={
                <ProtectedRoute>
                  <AuditDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/logs" element={
                <ProtectedRoute>
                  <LogsPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
