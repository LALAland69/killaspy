import { useState } from "react";
import { AdsTable } from "@/components/ads/AdsTable";
import { AdVariationsPanel } from "@/components/ads/AdVariationsPanel";
import { VariationPerformanceCharts } from "@/components/ads/VariationPerformanceCharts";
import { VariationExport } from "@/components/ads/VariationExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Download, Table2, Copy, TrendingUp, Search, Database } from "lucide-react";
import { useAdCategories } from "@/hooks/useAdCategories";
import { Badge } from "@/components/ui/badge";

export interface AdsFilters {
  search: string;
  category: string;
  country: string;
  status: string;
  riskLevel: string;
}

export default function Ads() {
  const [filters, setFilters] = useState<AdsFilters>({
    search: "",
    category: "all",
    country: "all",
    status: "all",
    riskLevel: "all",
  });
  const { data: categories } = useAdCategories();

  const totalAds = categories?.reduce((sum, cat) => sum + cat.ads_count, 0) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Database className="h-5 w-5" />
            Biblioteca de Ads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pesquise na biblioteca interna do KillaSpy
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
            Variações de Criativos
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar na biblioteca..."
                className="h-9 w-72 pl-9 bg-secondary/50"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger className="h-9 w-44 bg-secondary/50">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.ads_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.country}
              onValueChange={(value) => setFilters({ ...filters, country: value })}
            >
              <SelectTrigger className="h-9 w-32 bg-secondary/50">
                <SelectValue placeholder="País" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="US">Estados Unidos</SelectItem>
                <SelectItem value="BR">Brasil</SelectItem>
                <SelectItem value="UK">Reino Unido</SelectItem>
                <SelectItem value="CA">Canadá</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="h-9 w-32 bg-secondary/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.riskLevel}
              onValueChange={(value) => setFilters({ ...filters, riskLevel: value })}
            >
              <SelectTrigger className="h-9 w-36 bg-secondary/50">
                <SelectValue placeholder="Nível de Risco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="high">Alto (61-100)</SelectItem>
                <SelectItem value="medium">Médio (31-60)</SelectItem>
                <SelectItem value="low">Baixo (0-30)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              Mais Filtros
            </Button>
          </div>

          {/* Table */}
          <AdsTable filters={filters} />

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">Mostrando ads da biblioteca interna</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm">
                Próximo
              </Button>
            </div>
          </div>
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
