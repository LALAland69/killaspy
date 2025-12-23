import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Clock, TrendingUp, ArrowUp } from "lucide-react";
import { AdCard } from "./AdCard";

interface TrendingAdsProps {
  sortBy?: 'newest' | 'longevity' | 'winning';
  title?: string;
  limit?: number;
}

export function TrendingAds({ 
  sortBy = 'newest', 
  title = 'Anúncios em Alta',
  limit = 12 
}: TrendingAdsProps) {
  const { data: ads, isLoading } = useQuery({
    queryKey: ['trending-ads', sortBy],
    queryFn: async () => {
      let query = supabase
        .from('ads')
        .select(`
          *,
          advertisers (id, name, page_id, total_ads)
        `)
        .limit(limit);

      switch (sortBy) {
        case 'longevity':
          query = query
            .not('longevity_days', 'is', null)
            .gt('longevity_days', 7)
            .order('longevity_days', { ascending: false });
          break;
        case 'winning':
          query = query
            .not('winning_score', 'is', null)
            .gt('winning_score', 50)
            .order('winning_score', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const getIcon = () => {
    switch (sortBy) {
      case 'longevity':
        return <Clock className="h-5 w-5" />;
      case 'winning':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Flame className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {getIcon()}
          {title}
        </h2>
        <Badge variant="outline">
          {ads?.length || 0} anúncios
        </Badge>
      </div>

      {ads && ads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad, index) => (
            <div key={ad.id} className="relative">
              {index < 3 && (
                <div className="absolute -top-2 -left-2 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    #{index + 1}
                    <ArrowUp className="h-3 w-3 ml-1" />
                  </Badge>
                </div>
              )}
              <AdCard ad={ad} />
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">
              Nenhum anúncio encontrado para esta categoria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
