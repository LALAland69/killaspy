import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
import { Skeleton } from "@/components/ui/skeleton";

interface AdsGridProps {
  filters?: AdsFilters;
  limit?: number;
  onSelectionChange?: (ads: Ad[]) => void;
}

// PERFORMANCE: Constantes para virtualização
const CARD_HEIGHT = 480; // Altura estimada de cada card
const OVERSCAN = 3; // Quantas linhas extras renderizar fora do viewport

export function AdsGrid({ filters, onSelectionChange }: AdsGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

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

  // PERFORMANCE: Memoização para evitar recálculo a cada render
  const allAds = useMemo(
    () => data?.pages.flatMap((page) => page.ads) ?? [],
    [data?.pages]
  );

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // PERFORMANCE: Calcula número de colunas baseado na largura do container
  const [columns, setColumns] = useState(4);
  
  useEffect(() => {
    const updateColumns = () => {
      const width = parentRef.current?.offsetWidth || window.innerWidth;
      if (width < 768) setColumns(1);
      else if (width < 1024) setColumns(2);
      else if (width < 1280) setColumns(3);
      else setColumns(4);
    };
    
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // PERFORMANCE: Agrupa ads em linhas para virtualização
  const rows = useMemo(() => {
    const result: Ad[][] = [];
    for (let i = 0; i < allAds.length; i += columns) {
      result.push(allAds.slice(i, i + columns));
    }
    return result;
  }, [allAds, columns]);

  // PERFORMANCE: Virtualizer para renderizar apenas linhas visíveis
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT,
    overscan: OVERSCAN,
  });

  // PERFORMANCE: Carrega mais quando próximo do final
  useEffect(() => {
    const lastItem = rowVirtualizer.getVirtualItems().at(-1);
    if (!lastItem) return;

    if (
      lastItem.index >= rows.length - 2 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    rowVirtualizer.getVirtualItems(),
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rows.length,
  ]);

  // Referência estável para callback
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

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
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "forwards" }}
            >
              <AdCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (allAds.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4 rounded-lg border border-border/50 bg-card animate-scale-fade-in">
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

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between animate-fade-in-up">
        <p className="text-sm text-muted-foreground">
          Mostrando {allAds.length} de {totalCount} ads
          {selectedIds.size > 0 && (
            <span className="ml-2 text-primary">
              ({selectedIds.size} selecionados)
            </span>
          )}
          {/* PERFORMANCE: Indicador de virtualização */}
          <span className="ml-2 text-xs text-muted-foreground/60">
            ({virtualItems.length * columns} renderizados)
          </span>
        </p>
        {selectedIds.size > 0 && (
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Limpar seleção
          </Button>
        )}
      </div>

      {/* PERFORMANCE: Container com scroll virtual */}
      <div
        ref={parentRef}
        className="h-[calc(100vh-300px)] overflow-auto rounded-lg"
        style={{ contain: "strict" }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className={cn(
                    "grid gap-4 pr-2",
                    columns === 1 && "grid-cols-1",
                    columns === 2 && "grid-cols-2",
                    columns === 3 && "grid-cols-3",
                    columns === 4 && "grid-cols-4"
                  )}
                >
                  {row.map((ad, colIndex) => (
                    <div
                      key={ad.id}
                      className="opacity-0 animate-scale-fade-in"
                      style={{
                        animationDelay: `${colIndex * 30}ms`,
                        animationFillMode: "forwards",
                      }}
                    >
                      <AdCard
                        ad={ad}
                        isSelected={selectedIds.has(ad.id)}
                        onToggleSelect={() => toggleSelect(ad.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {!hasNextPage && allAds.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Fim dos resultados
        </p>
      )}
    </div>
  );
}

interface AdCardProps {
  ad: Ad;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

// SKELETON: Componente de loading para cada card
const AdCardSkeleton = () => (
  <Card className="overflow-hidden h-full">
    <CardContent className="p-0 flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="p-4 space-y-3 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-5 w-8 rounded" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Actions Skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded" />
        </div>
        <Skeleton className="h-8 w-full rounded" />

        {/* Preview Text Skeleton */}
        <div className="flex items-start gap-2 pt-1">
          <Skeleton className="h-4 w-4 shrink-0" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>

      {/* Media Preview Skeleton */}
      <Skeleton className="aspect-square w-full rounded-none" />
    </CardContent>
  </Card>
);

// PERFORMANCE: Componente memoizado para evitar re-renders desnecessários
const AdCard = ({ ad, isSelected, onToggleSelect }: AdCardProps) => {
  const navigate = useNavigate();
  const { toggleSave, isSaved, isPending } = useToggleSaveAd();
  const startDate = ad.start_date ? new Date(ad.start_date) : null;
  const saved = isSaved(ad.id);

  // Memoização do winning score
  const winningScore = useMemo(() => calculateWinningScore(ad), [ad]);

  // Handlers memoizados
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
        "overflow-hidden hover:border-primary/30 transition-colors group h-full",
        isSelected && "border-primary ring-1 ring-primary"
      )}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 space-y-3 flex-1">
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
