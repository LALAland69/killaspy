import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye, DollarSign, Bookmark, Globe, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AdDiscoveryCardProps {
  ad: {
    id: string;
    page_name?: string;
    ad_snapshot_url?: string;
    media_url?: string;
    primary_text?: string;
    headline?: string;
    start_date?: string;
    countries?: string[];
    status?: string;
    winning_score?: number;
    engagement_score?: number;
    longevity_days?: number;
  };
  onSave?: (adId: string) => void;
  isSaved?: boolean;
}

export default function AdDiscoveryCard({ ad, onSave, isSaved = false }: AdDiscoveryCardProps) {
  const [imageError, setImageError] = useState(false);
  const [saved, setSaved] = useState(isSaved);

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(ad.id);
  };

  const handleViewAd = () => {
    if (ad.ad_snapshot_url) {
      window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não disponível';
    try {
      return format(new Date(dateString), "d 'de' MMM, yyyy", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (score >= 40) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      {/* Thumbnail/Preview */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {!imageError && (ad.media_url || ad.ad_snapshot_url) ? (
          <img
            src={ad.media_url || ad.ad_snapshot_url}
            alt={`Anúncio de ${ad.page_name || 'Anunciante'}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Eye className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge 
            variant={ad.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {ad.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {/* Score Badge */}
        {ad.winning_score !== undefined && (
          <div className="absolute top-2 right-2">
            <Badge className={cn('text-xs border', getScoreColor(ad.winning_score))}>
              Score: {ad.winning_score}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Advertiser Name */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-1 flex-1">
            {ad.page_name || 'Anunciante Desconhecido'}
          </h3>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(ad.start_date)}</span>
          {ad.longevity_days !== undefined && ad.longevity_days > 0 && (
            <span className="ml-2 text-primary">• {ad.longevity_days} dias ativos</span>
          )}
        </div>

        {/* Ad Text */}
        {ad.primary_text && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {ad.primary_text}
          </p>
        )}

        {ad.headline && (
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {ad.headline}
          </p>
        )}

        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {ad.engagement_score !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>Engajamento: {ad.engagement_score}</span>
            </div>
          )}
        </div>

        {/* Countries */}
        {ad.countries && ad.countries.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Globe className="h-3 w-3 text-muted-foreground" />
            {ad.countries.slice(0, 3).map((country) => (
              <Badge key={country} variant="outline" className="text-xs py-0">
                {country}
              </Badge>
            ))}
            {ad.countries.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{ad.countries.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={handleViewAd}
            disabled={!ad.ad_snapshot_url}
          >
            <ExternalLink className="h-3 w-3 mr-1.5" />
            Ver Anúncio
          </Button>
          <Button 
            variant={saved ? 'secondary' : 'outline'} 
            size="sm"
            onClick={handleSave}
            className={cn(
              'transition-colors',
              saved && 'bg-primary/20 text-primary border-primary/30'
            )}
          >
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
