import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { WinningScoreBadge } from "@/components/ads/WinningScoreBadge";
import {
  ExternalLink,
  Play,
  Image as ImageIcon,
  Loader2,
  Download,
  MoreVertical,
  Heart,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useInfiniteAds, type Ad } from "@/hooks/useAds";
import { useToggleSaveAd } from "@/hooks/useSavedAds";
import { calculateWinningScore } from "@/hooks/useWinningAds";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import type { AdsFilters } from "@/pages/Ads";
import { cn } from "@/lib/utils";

interface AdsGridProps {
  filters?: AdsFilters;
  limit?: number;
  onSelectionChange?: (ads: Ad[]) => void;
}

export function AdsGrid({ filters, onSelectionChange }: AdsGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteAds(
      filters
        ? {
            search: filters.search,
            category: filters.category,
            country: filters.country,
            status: filters.status,
            riskLevel: filters.riskLevel,
            sortBy: filters.sortBy,
            winningTier: filters.winningTier,
          }
        : undefined
    );

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // REFATORAÇÃO: Memoização para evitar recálculo a cada render
  const allAds = useMemo(
    () => data?.pages.flatMap((page) => page.ads) ?? [],
    [data?.pages]
  );

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // REFATORAÇÃO: Referência estável para callback
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  // REFATORAÇÃO: Dependência apenas em selectedIds (Set serializado)
  // Evita loop infinito ao usar allAds como dependência
  const selectedIdsArray = useMemo(
    () => Array.from(selectedIds),
    [selectedIds]
  );

  useEffect(() => {
    if (onSelectionChangeRef.current && selectedIdsArray.length > 0) {
      const selectedAds = allAds.filter((ad) => selectedIds.has(ad.id));
      onSelectionChangeRef.current(selectedAds);
    } else if (onSelectionChangeRef.current && selectedIdsArray.length === 0) {
      onSelectionChangeRef.current([]);
    }
    // REFATORAÇÃO: Removido allAds das dependências para evitar loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdsArray]);

  const toggleSelect = useCallback((adId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(adId)) {
        next.delete(adId);
      } else {
        next.add(adId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border/50 bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allAds.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4 rounded-lg border border-border/50 bg-card">
        <p className="text-sm text-muted-foreground">
          Nenhum anúncio encontrado.
        </p>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {allAds.length} de {totalCount} ads
          {selectedIds.size > 0 && (
            <span className="ml-2 text-primary">
              ({selectedIds.size} selecionados)
            </span>
          )}
        </p>
        {selectedIds.size > 0 && (
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Limpar seleção
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allAds.map((ad) => (
          <AdCard
            key={ad.id}
            ad={ad}
            isSelected={selectedIds.has(ad.id)}
            onToggleSelect={() => toggleSelect(ad.id)}
          />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
        {!hasNextPage && allAds.length > 0 && (
          <p className="text-sm text-muted-foreground">Fim dos resultados</p>
        )}
      </div>
    </div>
  );
}

interface AdCardProps {
  ad: Ad;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

// REFATORAÇÃO: Componente memoizado para evitar re-renders desnecessários
const AdCard = ({ ad, isSelected, onToggleSelect }: AdCardProps) => {
  const navigate = useNavigate();
  const { toggleSave, isSaved, isPending } = useToggleSaveAd();
  const startDate = ad.start_date ? new Date(ad.start_date) : null;
  const saved = isSaved(ad.id);

  // REFATORAÇÃO: Memoização do winning score
  const winningScore = useMemo(() => calculateWinningScore(ad), [ad]);

  // REFATORAÇÃO: Handlers memoizados
  const handleSaveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleSave(ad.id);
    },
    [ad.id, toggleSave]
  );

  const handleAdLibraryClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(
        `https://www.facebook.com/ads/library/?id=${ad.ad_library_id}`,
        "_blank"
      );
    },
    [ad.ad_library_id]
  );

  const handleDetailsClick = useCallback(() => {
    navigate(`/ads/${ad.id}`);
  }, [navigate, ad.id]);

  return (
    <Card
      className={cn(
        "overflow-hidden hover:border-primary/30 transition-colors group",
        isSelected && "border-primary ring-1 ring-primary"
      )}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {onToggleSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onToggleSelect}
                  className="data-[state=checked]:bg-primary"
                />
              )}
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {ad.page_name?.charAt(0) || "A"}
              </div>
              <div>
                <p className="font-medium text-sm line-clamp-1">
                  {ad.page_name || "Unknown Page"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {startDate
                    ? `Visto: ${formatDistanceToNow(startDate, {
                        addSuffix: true,
                        locale: ptBR,
                      })}`
                    : "Recente"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 transition-all",
                  saved ? "text-red-500" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={handleSaveClick}
                disabled={isPending}
              >
                <Heart className={cn("h-4 w-4", saved && "fill-current")} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-primary">
                  {ad.longevity_days ?? 0} dias
                </span>
                {ad.countries && ad.countries.length > 0 && (
                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-secondary rounded">
                    {ad.countries[0]}
                  </span>
                )}
              </div>
              <WinningScoreBadge score={winningScore} size="sm" />
            </div>
            {ad.headline && (
              <p className="text-sm font-medium line-clamp-1">{ad.headline}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {ad.ad_library_id && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleAdLibraryClick}
              >
                Ad Library
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs justify-between"
            onClick={handleDetailsClick}
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
          onClick={handleDetailsClick}
        >
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
            <ScoreBadge score={ad.suspicion_score ?? 0} />
          </div>

          {/* Video Indicator */}
          {ad.media_type === "video" && (
            <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1 flex items-center gap-1">
              <Play className="h-3 w-3 text-white" fill="white" />
              <span className="text-xs text-white">Video</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
