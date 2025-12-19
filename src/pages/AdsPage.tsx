import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdsGrid } from "@/components/ads/AdsGrid";
import { AdVariationsPanel } from "@/components/ads/AdVariationsPanel";
import { VariationPerformanceCharts } from "@/components/ads/VariationPerformanceCharts";
import { VariationExport } from "@/components/ads/VariationExport";
import { AdsFiltersBar } from "@/components/ads/AdsFiltersBar";
import { CopyAnalyzer } from "@/components/ads/CopyAnalyzer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Table2, Copy, TrendingUp, RefreshCw, Loader2, Sparkles, Trophy } from "lucide-react";
import { useAdCategories } from "@/hooks/useAdCategories";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import type { Ad } from "@/hooks/useAds";

export interface AdsFilters {
  search: string;
  searchBy: string;
  category: string;
  country: string;
  language: string;
  platform: string;
  status: string;
  mediaType: string;
  sortBy: string;
  dateRange: string;
  riskLevel: string;
  winningTier: string;
}

const initialFilters: AdsFilters = {
  search: "",
  searchBy: "all",
  category: "all",
  country: "BR",
  language: "pt",
  platform: "all",
  status: "all",
  mediaType: "all",
  sortBy: "winning",
  dateRange: "all",
  riskLevel: "all",
  winningTier: "all",
};

const SEARCH_DEBOUNCE_DELAY = 400;

export default function AdsPage() {
  const [filters, setFilters] = useState<AdsFilters>(initialFilters);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAds, setSelectedAds] = useState<Ad[]>([]);
  const { data: categories } = useAdCategories();

  const debouncedSearch = useDebounce(filters.search, SEARCH_DEBOUNCE_DELAY);
  
  const effectiveFilters = useMemo<AdsFilters>(() => ({
    ...filters,
    search: debouncedSearch,
  }), [filters, debouncedSearch]);

  const totalAds = categories?.reduce((sum, cat) => sum + cat.ads_count, 0) || 0;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleReset = () => {
    setFilters(initialFilters);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Biblioteca de Ads
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pesquise e explore ads coletados automaticamente
              <Badge variant="secondary" className="ml-2">{totalAds.toLocaleString()} ads</Badge>
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Table2 className="h-4 w-4" />
              Todos os Ads
            </TabsTrigger>
            <TabsTrigger value="winners" className="gap-2">
              <Trophy className="h-4 w-4" />
              Winners
            </TabsTrigger>
            <TabsTrigger value="variations" className="gap-2">
              <Copy className="h-4 w-4" />
              Variações
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendências
            </TabsTrigger>
            <TabsTrigger value="copyai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Copy AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
              <AdsFiltersBar 
                filters={filters} 
                onFiltersChange={setFilters}
                categories={categories || []}
              />
              
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Aplicar Filtros
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Limpar Filtros
                </Button>
              </div>
            </div>

            <AdsGrid filters={effectiveFilters} onSelectionChange={setSelectedAds} />
          </TabsContent>

          <TabsContent value="winners" className="space-y-6">
            <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
              <AdsFiltersBar 
                filters={{ ...filters, winningTier: "winners" }} 
                onFiltersChange={setFilters}
                categories={categories || []}
              />
            </div>

            <AdsGrid 
              filters={{ ...effectiveFilters, winningTier: "winners" }} 
              onSelectionChange={setSelectedAds} 
            />
          </TabsContent>

          <TabsContent value="variations" className="space-y-6">
            <div className="flex justify-end">
              <VariationExport />
            </div>
            <AdVariationsPanel />
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="flex justify-end">
              <VariationExport />
            </div>
            <VariationPerformanceCharts />
          </TabsContent>

          <TabsContent value="copyai" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Selecione Ads de Referência</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione anúncios vencedores no grid abaixo para analisar padrões ou gerar novas copies.
                </p>
                <AdsGrid 
                  filters={{ ...effectiveFilters, winningTier: "winners", sortBy: "winning" }} 
                  onSelectionChange={setSelectedAds} 
                />
              </div>
              <div className="space-y-4">
                <CopyAnalyzer selectedAds={selectedAds} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
