import { useState } from "react";
import { AdsGrid } from "@/components/ads/AdsGrid";
import { AdVariationsPanel } from "@/components/ads/AdVariationsPanel";
import { VariationPerformanceCharts } from "@/components/ads/VariationPerformanceCharts";
import { VariationExport } from "@/components/ads/VariationExport";
import { AdsFiltersBar } from "@/components/ads/AdsFiltersBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Table2, Copy, TrendingUp, RefreshCw, Loader2 } from "lucide-react";
import { useAdCategories } from "@/hooks/useAdCategories";
import { Badge } from "@/components/ui/badge";

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
}

const initialFilters: AdsFilters = {
  search: "",
  searchBy: "all",
  category: "all",
  country: "all",
  language: "all",
  platform: "all",
  status: "all",
  mediaType: "all",
  sortBy: "recent",
  dateRange: "all",
  riskLevel: "all",
};

export default function Ads() {
  const [filters, setFilters] = useState<AdsFilters>(initialFilters);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: categories } = useAdCategories();

  const totalAds = categories?.reduce((sum, cat) => sum + cat.ads_count, 0) || 0;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleReset = () => {
    setFilters(initialFilters);
  };

  return (
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
          <TabsTrigger value="variations" className="gap-2">
            <Copy className="h-4 w-4" />
            Variações
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Filters Panel */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <AdsFiltersBar 
              filters={filters} 
              onFiltersChange={setFilters}
              categories={categories || []}
            />
            
            {/* Action buttons */}
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

          {/* Ads Grid */}
          <AdsGrid filters={filters} />
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
      </Tabs>
    </div>
  );
}
