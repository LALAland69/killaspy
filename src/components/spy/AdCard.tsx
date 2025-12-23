import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Globe, 
  Clock, 
  ExternalLink, 
  Bookmark,
  Image,
  Video,
  Play,
  Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdCardProps {
  ad: {
    id: string;
    ad_library_id?: string;
    page_name?: string;
    primary_text?: string;
    headline?: string;
    cta?: string;
    media_url?: string;
    media_type?: string;
    start_date?: string;
    end_date?: string;
    countries?: string[];
    status?: string;
    longevity_days?: number;
    winning_score?: number;
    created_at: string;
    advertisers?: {
      id: string;
      name: string;
      page_id?: string;
      total_ads?: number;
    };
  };
}

export function AdCard({ ad }: AdCardProps) {
  const getMediaIcon = () => {
    switch (ad.media_type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'carousel':
        return <Play className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (ad.status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  const getWinningBadge = () => {
    if (!ad.winning_score) return null;
    
    if (ad.winning_score >= 80) {
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">🏆 Champion</Badge>;
    }
    if (ad.winning_score >= 60) {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Strong</Badge>;
    }
    if (ad.winning_score >= 40) {
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Promising</Badge>;
    }
    return null;
  };

  const adLibraryUrl = ad.ad_library_id 
    ? `https://www.facebook.com/ads/library/?id=${ad.ad_library_id}`
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Media Preview */}
      <div className="relative aspect-video bg-muted">
        {ad.media_url ? (
          ad.media_type === 'video' ? (
            <video 
              src={ad.media_url} 
              className="w-full h-full object-cover"
              muted
              loop
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => e.currentTarget.pause()}
            />
          ) : (
            <img 
              src={ad.media_url} 
              alt={ad.headline || 'Ad preview'} 
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getMediaIcon()}
            <span className="ml-2 text-sm text-muted-foreground">Sem preview</span>
          </div>
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="secondary" className="text-xs">
            {getMediaIcon()}
            <span className="ml-1 capitalize">{ad.media_type || 'image'}</span>
          </Badge>
          {ad.status && (
            <Badge className={getStatusColor()}>
              {ad.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          )}
        </div>

        {/* Longevity badge */}
        {ad.longevity_days && ad.longevity_days > 7 && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
              <Clock className="h-3 w-3 mr-1" />
              {ad.longevity_days}d
            </Badge>
          </div>
        )}

        {/* View on Facebook */}
        {adLibraryUrl && (
          <a 
            href={adLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button size="sm" variant="secondary" className="h-8">
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver original
            </Button>
          </a>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Advertiser */}
        <div className="flex items-center justify-between">
          <a 
            href={`/advertisers/${ad.advertisers?.id || ad.id}`}
            className="font-medium hover:text-primary transition-colors truncate"
          >
            {ad.page_name || ad.advertisers?.name || 'Anunciante'}
          </a>
          {getWinningBadge()}
        </div>

        {/* Headline */}
        {ad.headline && (
          <h4 className="font-semibold text-sm line-clamp-2">
            {ad.headline}
          </h4>
        )}

        {/* Primary text */}
        {ad.primary_text && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {ad.primary_text}
          </p>
        )}

        {/* CTA */}
        {ad.cta && (
          <Badge variant="outline" className="text-xs">
            {ad.cta}
          </Badge>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
          {ad.countries && ad.countries.length > 0 && (
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {ad.countries.slice(0, 2).join(', ')}
              {ad.countries.length > 2 && `+${ad.countries.length - 2}`}
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(ad.created_at), { 
              addSuffix: true,
              locale: ptBR 
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
          <Button variant="ghost" size="sm">
            <Bookmark className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
