import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { 
  ExternalLink, 
  Play, 
  Image as ImageIcon, 
  Loader2, 
  Download,
  MoreVertical,
  Heart,
  FileText,
  ChevronRight
} from "lucide-react";
import { useAds, type Ad } from "@/hooks/useAds";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import type { AdsFilters } from "@/pages/Ads";

interface AdsGridProps {
  filters?: AdsFilters;
  limit?: number;
}

export function AdsGrid({ filters, limit }: AdsGridProps) {
  const { data: ads, isLoading } = useAds(limit, filters ? {
    search: filters.search,
    category: filters.category,
    country: filters.country,
    status: filters.status,
    riskLevel: filters.riskLevel,
  } : undefined);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border/50 bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ads || ads.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4 rounded-lg border border-border/50 bg-card">
        <p className="text-sm text-muted-foreground">Nenhum anúncio encontrado.</p>
        <Button asChild>
          <Link to="/import">
            <Download className="h-4 w-4 mr-2" />
            Configurar Coleta Automática
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}

function AdCard({ ad }: { ad: Ad }) {
  const startDate = ad.start_date ? new Date(ad.start_date) : null;
  const activeAdsCount = Math.floor(Math.random() * 50) + 5; // Placeholder
  
  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-colors group">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {ad.page_name?.charAt(0) || "A"}
              </div>
              <div>
                <p className="font-medium text-sm line-clamp-1">{ad.page_name || "Unknown Page"}</p>
                <p className="text-xs text-muted-foreground">
                  {startDate ? `Visto: ${formatDistanceToNow(startDate, { addSuffix: true, locale: ptBR })}` : "Recente"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">{activeAdsCount}</span>
              <span className="text-sm text-primary font-medium">ads</span>
              {ad.countries && ad.countries.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {ad.countries[0]}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Found: {startDate ? format(startDate, "dd MMM yyyy", { locale: ptBR }) : "N/A"}
            </p>
            <p className="text-xs">
              <span className="text-muted-foreground">Highest:</span>{" "}
              <span className="text-primary font-medium">{activeAdsCount + 5} Active Ads</span>{" "}
              <span className="text-muted-foreground">
                {startDate ? formatDistanceToNow(startDate, { addSuffix: true, locale: ptBR }) : ""}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
              Page on Ad Library
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="w-full h-8 text-xs justify-between">
            Detalhes
            <ChevronRight className="h-3 w-3" />
          </Button>

          {/* Preview Text */}
          {ad.primary_text && (
            <div className="flex items-start gap-2 pt-1">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground line-clamp-2">
                {ad.primary_text}
              </p>
            </div>
          )}
        </div>

        {/* Media Preview */}
        <div className="relative aspect-square bg-secondary">
          {ad.media_url ? (
            <img 
              src={ad.media_url} 
              alt="Ad preview" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {ad.media_type === "video" ? (
                <Play className="h-12 w-12 text-muted-foreground/50" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
              )}
            </div>
          )}
          
          {/* Score Badge */}
          <div className="absolute top-2 right-2">
            <ScoreBadge score={ad.suspicion_score || 0} />
          </div>

          {/* Video Indicator */}
          {ad.media_type === "video" && (
            <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1 flex items-center gap-1">
              <Play className="h-3 w-3 text-white" fill="white" />
              <span className="text-xs text-white">0:00</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
