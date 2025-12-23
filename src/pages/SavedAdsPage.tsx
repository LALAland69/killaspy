import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSavedAds, SavedAd } from "@/hooks/useSavedAds";
import { useAds } from "@/hooks/useAds";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SavedAdEditDialog } from "@/components/ads/SavedAdEditDialog";
import { 
  Heart, 
  Loader2, 
  Play, 
  Image as ImageIcon, 
  ChevronRight,
  FileText,
  Edit2,
  Search,
  Tag,
  Download,
  Filter
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToggleSaveAd } from "@/hooks/useSavedAds";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SavedAdsPage() {
  const { data: savedAds, isLoading: loadingSaved } = useSavedAds();
  const { data: allAds, isLoading: loadingAds } = useAds();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingSavedAd, setEditingSavedAd] = useState<SavedAd | null>(null);

  const isLoading = loadingSaved || loadingAds;

  // Get full ad details for saved ads
  const savedAdsWithDetails = savedAds?.map(saved => {
    const ad = allAds?.find(a => a.id === saved.ad_id);
    return { ...saved, ad };
  }).filter(s => s.ad) || [];

  // Extract all unique tags
  const allTags = [...new Set(savedAds?.flatMap(s => s.tags || []) || [])];

  // Filter by search and tag
  const filteredAds = savedAdsWithDetails.filter(({ ad, tags, notes }) => {
    const matchesSearch = !searchTerm || 
      ad?.page_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad?.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad?.primary_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || (tags && tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredAds.length === 0) {
      toast.error("Nenhum ad para exportar");
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("KillaSpy - Ads Salvos", 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Exportado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    doc.text(`Total: ${filteredAds.length} ads`, 14, 36);
    
    if (selectedTag) {
      doc.text(`Filtro: #${selectedTag}`, 14, 42);
    }

    // Table
    const tableData = filteredAds.map(({ ad, notes, tags, created_at }) => [
      ad?.page_name || "N/A",
      ad?.headline?.substring(0, 50) + (ad?.headline && ad.headline.length > 50 ? "..." : "") || "N/A",
      `${ad?.longevity_days || 0} dias`,
      ad?.countries?.join(", ") || "N/A",
      (tags || []).join(", ") || "-",
      notes?.substring(0, 40) + (notes && notes.length > 40 ? "..." : "") || "-",
    ]);

    autoTable(doc, {
      startY: selectedTag ? 48 : 42,
      head: [["Anunciante", "Headline", "Longevidade", "Países", "Tags", "Notas"]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [124, 58, 237] },
    });

    // Analytics summary
    const avgLongevity = filteredAds.reduce((acc, { ad }) => acc + (ad?.longevity_days || 0), 0) / filteredAds.length;
    const avgScore = filteredAds.reduce((acc, { ad }) => acc + (ad?.suspicion_score || 0), 0) / filteredAds.length;

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("Resumo Analítico", 14, finalY);
    doc.setFontSize(10);
    doc.text(`• Longevidade média: ${avgLongevity.toFixed(1)} dias`, 14, finalY + 8);
    doc.text(`• Score de suspeição médio: ${avgScore.toFixed(1)}`, 14, finalY + 14);
    doc.text(`• Total de tags únicas: ${allTags.length}`, 14, finalY + 20);

    doc.save(`killaspy-saved-ads-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Ads Salvos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Seus ads favoritos para análise posterior
              <Badge variant="secondary" className="ml-2">
                {filteredAds.length} de {savedAdsWithDetails.length}
              </Badge>
            </p>
          </div>
          
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, headline, notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={() => setSelectedTag(null)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full transition-colors",
                  !selectedTag 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                )}
              >
                Todos
              </button>
              {allTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-full transition-colors",
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-border/50 bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-4 rounded-lg border border-border/50 bg-card">
            <Heart className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {savedAdsWithDetails.length === 0 
                ? "Nenhum ad salvo ainda." 
                : "Nenhum resultado encontrado."
              }
            </p>
            {savedAdsWithDetails.length === 0 && (
              <Button asChild>
                <Link to="/ads">
                  Explorar Biblioteca de Ads
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAds.map((savedAd) => (
              savedAd.ad && (
                <SavedAdCard 
                  key={savedAd.id} 
                  savedAd={savedAd}
                  onEdit={() => setEditingSavedAd(savedAd)}
                />
              )
            ))}
          </div>
        )}
      </div>

      <SavedAdEditDialog
        savedAd={editingSavedAd}
        open={!!editingSavedAd}
        onOpenChange={(open) => !open && setEditingSavedAd(null)}
      />
    </AppLayout>
  );
}

interface SavedAdCardProps {
  savedAd: SavedAd & { ad: any };
  onEdit: () => void;
}

function SavedAdCard({ savedAd, onEdit }: SavedAdCardProps) {
  const { ad, created_at, notes, tags } = savedAd;
  const navigate = useNavigate();
  const { toggleSave, isPending } = useToggleSaveAd();
  
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
                  Salvo {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
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
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                  #{tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}

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

          {/* Notes preview */}
          {notes && (
            <div className="flex items-start gap-2 p-2 bg-secondary/50 rounded-md">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground line-clamp-2">
                {notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-8 text-xs justify-between"
            onClick={() => navigate(`/ads/${ad.id}`)}
          >
            Ver detalhes
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Media Preview */}
        <div 
          className="relative aspect-video bg-secondary cursor-pointer"
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
