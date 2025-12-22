import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, Loader2 } from 'lucide-react';
import AdDiscoveryCard from '@/components/ads/AdDiscoveryCard';
import AdDiscoveryFilters, { AdFilters } from '@/components/ads/AdDiscoveryFilters';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import FacebookApiStatusBanner from '@/components/ads/FacebookApiStatusBanner';

export default function AdsDiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AdFilters>({
    country: null,
    platform: null,
    status: null,
    dateFrom: null,
    minScore: null,
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Query ads from database
  const { data: ads, isLoading, error, refetch } = useQuery({
    queryKey: ['discovery-ads', debouncedSearch, filters],
    queryFn: async () => {
      let query = supabase
        .from('ads')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(50);

      // Apply status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply country filter
      if (filters.country) {
        query = query.contains('countries', [filters.country]);
      }

      // Apply date filter
      if (filters.dateFrom) {
        query = query.gte('start_date', filters.dateFrom);
      }

      // Apply score filter
      if (filters.minScore) {
        query = query.gte('winning_score', filters.minScore);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Client-side text search
      if (debouncedSearch && data) {
        const searchLower = debouncedSearch.toLowerCase();
        return data.filter(ad => 
          ad.page_name?.toLowerCase().includes(searchLower) ||
          ad.primary_text?.toLowerCase().includes(searchLower) ||
          ad.headline?.toLowerCase().includes(searchLower)
        );
      }

      return data;
    },
  });

  const handleSaveAd = async (adId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado para salvar anúncios');
        return;
      }

      // Check if already saved
      const { data: existing } = await supabase
        .from('saved_ads')
        .select('id')
        .eq('ad_id', adId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Remove from saved
        await supabase.from('saved_ads').delete().eq('id', existing.id);
        toast.success('Anúncio removido dos salvos');
      } else {
        // Get tenant_id from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();

        if (!profile?.tenant_id) {
          toast.error('Erro ao salvar anúncio');
          return;
        }

        // Save ad
        await supabase.from('saved_ads').insert({
          ad_id: adId,
          user_id: user.id,
          tenant_id: profile.tenant_id,
        });
        toast.success('Anúncio salvo com sucesso!');
      }
    } catch (err) {
      console.error('Error saving ad:', err);
      toast.error('Erro ao salvar anúncio');
    }
  };

  const adsCount = ads?.length || 0;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Facebook API Status Banner */}
        <FacebookApiStatusBanner />

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Descobrir Anúncios
            </h1>
          </div>
          <p className="text-muted-foreground">
            Explore e analise anúncios do Facebook e Instagram
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por anunciante, texto ou headline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-5 text-base"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Atualizar'
            )}
          </Button>
        </div>

        {/* Filters */}
        <AdDiscoveryFilters filters={filters} onFiltersChange={setFilters} />

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            'Carregando...'
          ) : (
            `${adsCount} anúncio${adsCount !== 1 ? 's' : ''} encontrado${adsCount !== 1 ? 's' : ''}`
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
            Erro ao carregar anúncios. Por favor, tente novamente.
          </div>
        )}

        {/* Ads Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : ads && ads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <AdDiscoveryCard 
                key={ad.id} 
                ad={ad} 
                onSave={handleSaveAd}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum anúncio encontrado
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros ou importar novos anúncios
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  country: null,
                  platform: null,
                  status: null,
                  dateFrom: null,
                  minScore: null,
                });
              }}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
