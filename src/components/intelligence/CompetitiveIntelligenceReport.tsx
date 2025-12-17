import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAds } from "@/hooks/useAds";
import { useAdvertisers } from "@/hooks/useAdvertisers";
import { useDomains } from "@/hooks/useDomains";
import {
  FileText,
  Target,
  TrendingUp,
  Zap,
  Users,
  Globe,
  BarChart3,
  Loader2,
  Download,
  RefreshCw,
  Trophy,
  AlertTriangle,
} from "lucide-react";

interface ReportData {
  niche: string;
  competitors: string[];
  keywords: string[];
  generatedAt: Date;
  insights: {
    topAds: Array<{
      id: string;
      headline: string;
      engagement: number;
      longevity: number;
      platform: string;
    }>;
    topKeywords: string[];
    marketTrend: 'growing' | 'stable' | 'declining';
    recommendations: string[];
    riskScore: number;
  };
}

export function CompetitiveIntelligenceReport() {
  const { toast } = useToast();
  const { data: ads, isLoading: adsLoading } = useAds();
  const { data: advertisers, isLoading: advertisersLoading } = useAdvertisers();
  const { data: domains, isLoading: domainsLoading } = useDomains();

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<ReportData | null>(null);

  const [formData, setFormData] = useState({
    niche: "",
    competitors: "",
    keywords: "",
  });

  const handleGenerateReport = async () => {
    if (!formData.niche) {
      toast({
        title: "Nicho obrigatório",
        description: "Por favor, informe o nicho/mercado alvo",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // Simulate report generation with progress
    const steps = [
      { progress: 20, label: "Analisando anúncios..." },
      { progress: 40, label: "Identificando padrões..." },
      { progress: 60, label: "Calculando métricas..." },
      { progress: 80, label: "Gerando insights..." },
      { progress: 100, label: "Finalizando relatório..." },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(step.progress);
    }

    // Generate report based on real data
    const topAds = (ads || [])
      .filter(ad => ad.engagement_score !== null)
      .sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0))
      .slice(0, 5)
      .map(ad => ({
        id: ad.id,
        headline: ad.headline || "Sem headline",
        engagement: ad.engagement_score || 0,
        longevity: ad.longevity_days || 0,
        platform: "Facebook",
      }));

    const uniqueOfferCategories = [...new Set((ads || []).map(ad => ad.offer_category).filter(Boolean))];
    
    const avgSuspicionScore = (ads || []).reduce((sum, ad) => sum + (ad.suspicion_score || 0), 0) / (ads?.length || 1);

    const generatedReport: ReportData = {
      niche: formData.niche,
      competitors: formData.competitors.split(",").map(c => c.trim()).filter(Boolean),
      keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
      generatedAt: new Date(),
      insights: {
        topAds,
        topKeywords: uniqueOfferCategories.slice(0, 10) as string[],
        marketTrend: avgSuspicionScore > 50 ? 'declining' : avgSuspicionScore > 30 ? 'stable' : 'growing',
        recommendations: [
          "Focar em criativos com alto engajamento visual",
          "Testar variações de copy com base nos anúncios de maior longevidade",
          "Monitorar os concorrentes de alto suspicion score para identificar táticas",
          "Diversificar plataformas de anúncios",
          "Implementar testes A/B sistemáticos",
        ],
        riskScore: Math.round(avgSuspicionScore),
      },
    };

    setReport(generatedReport);
    setIsGenerating(false);

    toast({
      title: "Relatório gerado",
      description: "Análise de inteligência competitiva concluída",
    });
  };

  const handleExportReport = () => {
    if (!report) return;

    const reportContent = `
RELATÓRIO DE INTELIGÊNCIA COMPETITIVA AVANÇADA (KILLASPY)
=========================================================

Data de Geração: ${report.generatedAt.toLocaleString()}

1. PARÂMETROS DA ANÁLISE
------------------------
Nicho/Mercado: ${report.niche}
Concorrentes: ${report.competitors.join(", ") || "Não especificados"}
Palavras-chave: ${report.keywords.join(", ") || "Não especificadas"}

2. TOP 5 ANÚNCIOS VENCEDORES
----------------------------
${report.insights.topAds.map((ad, i) => `
${i + 1}. ${ad.headline}
   - Engajamento: ${ad.engagement}
   - Longevidade: ${ad.longevity} dias
   - Plataforma: ${ad.platform}
`).join("")}

3. CATEGORIAS DE OFERTAS IDENTIFICADAS
--------------------------------------
${report.insights.topKeywords.join(", ")}

4. TENDÊNCIA DE MERCADO
-----------------------
Status: ${report.insights.marketTrend === 'growing' ? 'CRESCIMENTO' : report.insights.marketTrend === 'stable' ? 'ESTÁVEL' : 'DECLÍNIO'}

5. SCORE DE RISCO
-----------------
${report.insights.riskScore}/100

6. RECOMENDAÇÕES
----------------
${report.insights.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

=========================================================
Gerado por KillaSpy - Plataforma de Inteligência Competitiva
`;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `killaspy-report-${new Date().toISOString().split("T")[0]}.txt`;
    link.click();

    toast({
      title: "Relatório exportado",
      description: "Download iniciado",
    });
  };

  const isLoading = adsLoading || advertisersLoading || domainsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Relatório de Inteligência Competitiva
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere análises avançadas baseadas nos dados coletados
          </p>
        </div>
        {report && (
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Parâmetros de Análise
            </CardTitle>
            <CardDescription>
              Configure os parâmetros para gerar o relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nicho/Mercado Alvo *</label>
              <Input
                placeholder="Ex: Saúde e Bem-Estar"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Concorrentes (separados por vírgula)</label>
              <Textarea
                placeholder="Ex: site1.com, site2.com"
                value={formData.competitors}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Palavras-chave (separadas por vírgula)</label>
              <Textarea
                placeholder="Ex: emagrecimento, suplemento"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                rows={2}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleGenerateReport}
              disabled={isGenerating || isLoading}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-center text-muted-foreground">
                  {progress}% concluído
                </p>
              </div>
            )}

            {/* Data Stats */}
            <div className="pt-4 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Dados disponíveis:</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-lg font-semibold">{ads?.length || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Anúncios</div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-lg font-semibold">{advertisers?.length || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Anunciantes</div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-lg font-semibold">{domains?.length || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Domínios</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Output */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resultado da Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!report ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <BarChart3 className="h-16 w-16 mb-4 opacity-20" />
                <p>Configure os parâmetros e gere o relatório</p>
                <p className="text-sm">A análise será baseada nos dados do KillaSpy</p>
              </div>
            ) : (
              <Tabs defaultValue="summary" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="summary">Resumo</TabsTrigger>
                  <TabsTrigger value="ads">Top Anúncios</TabsTrigger>
                  <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <Globe className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-sm font-medium">{report.niche}</div>
                      <div className="text-xs text-muted-foreground">Nicho</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-sm font-medium">{report.competitors.length || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">Concorrentes</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-sm font-medium capitalize">
                        {report.insights.marketTrend === 'growing' ? 'Crescimento' : 
                         report.insights.marketTrend === 'stable' ? 'Estável' : 'Declínio'}
                      </div>
                      <div className="text-xs text-muted-foreground">Tendência</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${
                        report.insights.riskScore > 60 ? 'text-red-500' : 
                        report.insights.riskScore > 30 ? 'text-yellow-500' : 'text-green-500'
                      }`} />
                      <div className="text-sm font-medium">{report.insights.riskScore}/100</div>
                      <div className="text-xs text-muted-foreground">Score de Risco</div>
                    </div>
                  </div>

                  {report.insights.topKeywords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Categorias Identificadas:</p>
                      <div className="flex flex-wrap gap-2">
                        {report.insights.topKeywords.map((kw, i) => (
                          <Badge key={i} variant="secondary">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ads">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {report.insights.topAds.length > 0 ? (
                        report.insights.topAds.map((ad, index) => (
                          <div key={ad.id} className="p-4 rounded-lg border bg-card">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-muted'
                                }`}>
                                  {index === 0 ? <Trophy className="h-4 w-4" /> : index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{ad.headline}</p>
                                  <p className="text-xs text-muted-foreground">{ad.platform}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline">Eng: {ad.engagement}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {ad.longevity}d ativo
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Nenhum anúncio encontrado</p>
                          <p className="text-sm">Importe mais dados para análise</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="recommendations">
                  <div className="space-y-3">
                    {report.insights.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-primary">{index + 1}</span>
                        </div>
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
