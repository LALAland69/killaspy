import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAdById } from "@/hooks/useAds";
import { useToggleSaveAd } from "@/hooks/useSavedAds";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  ExternalLink, 
  Heart, 
  Play, 
  Image as ImageIcon,
  Calendar,
  Globe,
  Link as LinkIcon,
  AlertTriangle,
  Clock,
  Eye,
  Target,
  FileText,
  Share2,
  Copy,
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: ad, isLoading, error } = useAdById(id || "");
  const { toggleSave, isSaved, isPending } = useToggleSaveAd();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error || !ad) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-muted-foreground">Ad não encontrado</p>
          <Button asChild>
            <Link to="/ads">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Ads
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const saved = isSaved(ad.id);
  const startDate = ad.start_date ? new Date(ad.start_date) : null;
  const endDate = ad.end_date ? new Date(ad.end_date) : null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/ads">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Detalhes do Ad</h1>
              <p className="text-sm text-muted-foreground">
                {ad.page_name || "Unknown Page"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={saved ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSave(ad.id)}
              disabled={isPending}
              className={cn(saved && "bg-red-500 hover:bg-red-600")}
            >
              <Heart className={cn("h-4 w-4 mr-2", saved && "fill-current")} />
              {saved ? "Salvo" : "Salvar"}
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            {ad.ad_library_id && (
              <Button 
                size="sm"
                onClick={() => window.open(`https://www.facebook.com/ads/library/?id=${ad.ad_library_id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver no Ad Library
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Preview */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-secondary rounded-t-lg overflow-hidden">
                  {ad.media_url ? (
                    <img 
                      src={ad.media_url} 
                      alt="Ad preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {ad.media_type === "video" ? (
                        <Play className="h-16 w-16 text-muted-foreground/50" />
                      ) : (
                        <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                      )}
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4">
                    <ScoreBadge score={ad.suspicion_score || 0} />
                  </div>

                  {ad.media_type && (
                    <Badge className="absolute bottom-4 left-4" variant="secondary">
                      {ad.media_type === "video" ? (
                        <><Play className="h-3 w-3 mr-1" />Video</>
                      ) : (
                        <><ImageIcon className="h-3 w-3 mr-1" />Image</>
                      )}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ad Copy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Conteúdo do Ad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ad.headline && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Headline
                    </label>
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <p className="text-sm font-medium">{ad.headline}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 shrink-0"
                        onClick={() => copyToClipboard(ad.headline!, "Headline")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {ad.primary_text && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Texto Principal
                    </label>
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <p className="text-sm whitespace-pre-wrap">{ad.primary_text}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 shrink-0"
                        onClick={() => copyToClipboard(ad.primary_text!, "Texto")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {ad.cta && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Call to Action
                    </label>
                    <Badge variant="secondary" className="mt-1">{ad.cta}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cloaking Analysis */}
            {(ad.is_cloaked_flag || ad.detected_black_url) && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Análise de Cloaking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      Cloaking Detectado
                    </Badge>
                  </div>

                  {ad.white_url && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        White URL (Safe)
                      </label>
                      <p className="text-sm font-mono bg-secondary p-2 rounded mt-1 break-all">
                        {ad.white_url}
                      </p>
                    </div>
                  )}

                  {ad.detected_black_url && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Black URL (Real Offer)
                      </label>
                      <p className="text-sm font-mono bg-destructive/10 text-destructive p-2 rounded mt-1 break-all">
                        {ad.detected_black_url}
                      </p>
                    </div>
                  )}

                  {ad.cloaker_token && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Cloaker Token
                      </label>
                      <p className="text-sm font-mono bg-secondary p-2 rounded mt-1">
                        {ad.cloaker_token}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Score de Suspeita
                  </span>
                  <ScoreBadge score={ad.suspicion_score || 0} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Longevidade
                  </span>
                  <span className="text-sm font-medium">
                    {ad.longevity_days || 0} dias
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Status
                  </span>
                  <Badge variant={ad.status === "active" ? "default" : "secondary"}>
                    {ad.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data Início
                    </span>
                    <span className="text-sm">
                      {startDate ? format(startDate, "dd/MM/yyyy") : "N/A"}
                    </span>
                  </div>

                  {endDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Data Fim
                      </span>
                      <span className="text-sm">
                        {format(endDate, "dd/MM/yyyy")}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Países
                  </span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {ad.countries?.map((country) => (
                      <Badge key={country} variant="outline" className="text-xs">
                        {country}
                      </Badge>
                    )) || <span className="text-sm">N/A</span>}
                  </div>
                </div>

                {ad.language && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Idioma
                    </span>
                    <span className="text-sm">{ad.language}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Advertiser */}
            {ad.advertisers && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Anunciante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {ad.advertisers.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{ad.advertisers.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ad.advertisers.total_ads} ads totais
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/advertisers/${ad.advertisers.id}`}>
                      Ver Perfil do Anunciante
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Domain */}
            {ad.domains && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Domínio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-mono text-sm">{ad.domains.domain}</p>
                  {ad.final_lp_url && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Landing Page
                      </label>
                      <p className="text-xs font-mono bg-secondary p-2 rounded mt-1 break-all">
                        {ad.final_lp_url}
                      </p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/domains/${ad.domains.id}`}>
                      Ver Análise do Domínio
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* IDs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">IDs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ad.ad_library_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Ad Library ID</span>
                    <code className="text-xs bg-secondary px-2 py-1 rounded">
                      {ad.ad_library_id}
                    </code>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Internal ID</span>
                  <code className="text-xs bg-secondary px-2 py-1 rounded">
                    {ad.id.slice(0, 8)}...
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
