import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  TrendingUp, 
  BarChart3, 
  Eye,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Flame,
  Clock,
  Globe,
  Image,
  Video,
  Play
} from "lucide-react";
import { AdCard } from "@/components/spy/AdCard";
import { TrendingAds } from "@/components/spy/TrendingAds";
import { AdvertiserRankings } from "@/components/spy/AdvertiserRankings";
import { AdFiltersPanel } from "@/components/spy/AdFiltersPanel";
import { AnalyticsOverview } from "@/components/spy/AnalyticsOverview";

export interface AdFilters {
  search: string;
  country: string;
  mediaType: string;
  dateRange: string;
  status: string;
  minLongevity: number;
  sortBy: string;
}

const defaultFilters: AdFilters = {
  search: '',
  country: 'all',
  mediaType: 'all',
  dateRange: 'all',
  status: 'all',
  minLongevity: 0,
  sortBy: 'newest',
};

export default function AdSpyPage() {
  const [filters, setFilters] = useState<AdFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch ads with filters
  const { data: ads, isLoading, refetch } = useQuery({
    queryKey: ['spy-ads', filters],
    queryFn: async () => {
      let query = supabase
        .from('ads')
        .select(`
          *,
          advertisers (id, name, page_id, total_ads, avg_suspicion_score)
        `)
        .limit(100);

      // Apply filters
      if (filters.search) {
        query = query.or(`primary_text.ilike.%${filters.search}%,headline.ilike.%${filters.search}%,page_name.ilike.%${filters.search}%`);
      }

      if (filters.country !== 'all') {
        query = query.contains('countries', [filters.country]);
      }

      if (filters.mediaType !== 'all') {
        query = query.eq('media_type', filters.mediaType);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.minLongevity > 0) {
        query = query.gte('longevity_days', filters.minLongevity);
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case '3months':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      // Sorting
      switch (filters.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'longevity':
          query = query.order('longevity_days', { ascending: false });
          break;
        case 'winning':
          query = query.order('winning_score', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  const handleFilterChange = (key: keyof AdFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.country !== 'all') count++;
    if (filters.mediaType !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.minLongevity > 0) count++;
    return count;
  }, [filters]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6" />
              Ad Spy
            </h1>
            <p className="text-muted-foreground">
              Pesquise, analise e descubra anúncios de alta performance
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por texto, headline ou anunciante..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select 
              value={filters.country} 
              onValueChange={(v) => handleFilterChange('country', v)}
            >
              <SelectTrigger className="w-[140px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue placeholder="País" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="US">EUA</SelectItem>
                <SelectItem value="BR">Brasil</SelectItem>
                <SelectItem value="GB">Reino Unido</SelectItem>
                <SelectItem value="CA">Canadá</SelectItem>
                <SelectItem value="AU">Austrália</SelectItem>
                <SelectItem value="DE">Alemanha</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.mediaType} 
              onValueChange={(v) => handleFilterChange('mediaType', v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mídia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Imagem
                  </div>
                </SelectItem>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Vídeo
                  </div>
                </SelectItem>
                <SelectItem value="carousel">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Carrossel
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.dateRange} 
              onValueChange={(v) => handleFilterChange('dateRange', v)}
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <AdFiltersPanel 
            filters={filters} 
            onChange={handleFilterChange}
            onClear={clearFilters}
          />
        )}

        {/* Main Content */}
        <Tabs defaultValue="discover" className="space-y-4">
          <TabsList>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Descoberta
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="longevity" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Longevidade
            </TabsTrigger>
            <TabsTrigger value="advertisers" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Anunciantes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {ads?.length || 0} anúncios encontrados
                </p>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(v) => handleFilterChange('sortBy', v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                    <SelectItem value="oldest">Mais antigos</SelectItem>
                    <SelectItem value="longevity">Maior longevidade</SelectItem>
                    <SelectItem value="winning">Winning Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="pt-6">
                        <div className="h-48 bg-muted rounded mb-4" />
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : ads && ads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ads.map((ad) => (
                    <AdCard key={ad.id} ad={ad} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Nenhum anúncio encontrado</h3>
                    <p className="text-sm text-muted-foreground">
                      Tente ajustar seus filtros ou importar mais dados
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <a href="/data-sources">Importar Dados</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending">
            <TrendingAds />
          </TabsContent>

          {/* Longevity Tab */}
          <TabsContent value="longevity">
            <TrendingAds sortBy="longevity" title="Anúncios com Maior Longevidade" />
          </TabsContent>

          {/* Advertisers Tab */}
          <TabsContent value="advertisers">
            <AdvertiserRankings />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsOverview />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
