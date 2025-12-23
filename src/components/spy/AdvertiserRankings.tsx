import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, ExternalLink, BarChart3 } from "lucide-react";

export function AdvertiserRankings() {
  const { data: advertisers, isLoading } = useQuery({
    queryKey: ['advertiser-rankings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisers')
        .select('*')
        .order('total_ads', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
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
          <Users className="h-5 w-5" />
          Top Anunciantes
        </h2>
        <Badge variant="outline">
          {advertisers?.length || 0} anunciantes
        </Badge>
      </div>

      <div className="grid gap-4">
        {advertisers?.map((advertiser, index) => (
          <Card key={advertiser.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  ${index === 0 ? 'bg-yellow-500/20 text-yellow-600' : ''}
                  ${index === 1 ? 'bg-gray-300/20 text-gray-600' : ''}
                  ${index === 2 ? 'bg-orange-500/20 text-orange-600' : ''}
                  ${index > 2 ? 'bg-muted text-muted-foreground' : ''}
                `}>
                  #{index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{advertiser.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {advertiser.total_ads || 0} anúncios
                    </span>
                    {advertiser.active_ads !== null && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {advertiser.active_ads} ativos
                      </span>
                    )}
                    {advertiser.countries !== null && (
                      <span>{advertiser.countries} países</span>
                    )}
                  </div>
                </div>

                {/* Score */}
                {advertiser.avg_suspicion_score !== null && (
                  <Badge 
                    variant={advertiser.avg_suspicion_score > 50 ? "destructive" : "secondary"}
                  >
                    Score: {advertiser.avg_suspicion_score}
                  </Badge>
                )}

                {/* Action */}
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/advertisers/${advertiser.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!advertisers || advertisers.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum anunciante encontrado. Importe dados para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
