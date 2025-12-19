import { AppLayout } from "@/components/layout/AppLayout";
import { useSavedAds } from "@/hooks/useSavedAds";
import { useAds } from "@/hooks/useAds";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { 
  Heart, 
  Loader2, 
  Play, 
  Image as ImageIcon, 
  ChevronRight,
  FileText,
  Trash2,
  ExternalLink
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToggleSaveAd } from "@/hooks/useSavedAds";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function SavedAdsPage() {
  const { data: savedAds, isLoading: loadingSaved } = useSavedAds();
  const { data: allAds, isLoading: loadingAds } = useAds();

  const isLoading = loadingSaved || loadingAds;

  // Get full ad details for saved ads
  const savedAdsWithDetails = savedAds?.map(saved => {
    const ad = allAds?.find(a => a.id === saved.ad_id);
    return { ...saved, ad };
  }).filter(s => s.ad) || [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Ads Salvos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Seus ads favoritos para análise posterior
              <Badge variant="secondary" className="ml-2">
                {savedAdsWithDetails.length} salvos
              </Badge>
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-border/50 bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : savedAdsWithDetails.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-4 rounded-lg border border-border/50 bg-card">
            <Heart className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum ad salvo ainda.</p>
            <Button asChild>
              <Link to="/ads">
                Explorar Biblioteca de Ads
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {savedAdsWithDetails.map(({ ad, created_at }) => (
              ad && <SavedAdCard key={ad.id} ad={ad} savedAt={created_at} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function SavedAdCard({ ad, savedAt }: { ad: any; savedAt: string }) {
  const navigate = useNavigate();
  const { toggleSave, isPending } = useToggleSaveAd();
  const startDate = ad.start_date ? new Date(ad.start_date) : null;
  
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
                  Salvo {formatDistanceToNow(new Date(savedAt), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                toggleSave(ad.id);
              }}
              disabled={isPending}
            >
              <Heart className="h-4 w-4 fill-current" />
            </Button>
          </div>

          {/* Stats */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-primary">
                {ad.longevity_days || 0} dias
              </span>
              {ad.countries && ad.countries.length > 0 && (
                <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-secondary rounded">
                  {ad.countries[0]}
                </span>
              )}
            </div>
            {ad.headline && (
              <p className="text-sm font-medium line-clamp-1">{ad.headline}</p>
            )}
          </div>

          {/* Actions */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-8 text-xs justify-between"
            onClick={() => navigate(`/ads/${ad.id}`)}
          >
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
        <div 
          className="relative aspect-square bg-secondary cursor-pointer"
          onClick={() => navigate(`/ads/${ad.id}`)}
        >
          {ad.media_url ? (
            <OptimizedImage
              src={ad.media_url}
              alt="Ad preview"
              containerClassName="w-full h-full"
              objectFit="cover"
              placeholder="blur"
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
        </div>
      </CardContent>
    </Card>
  );
}
