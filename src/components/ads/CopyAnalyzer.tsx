import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  FileText, 
  Copy, 
  Loader2, 
  CheckCircle, 
  Lightbulb,
  Wand2,
  Trophy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Ad } from "@/hooks/useAds";
import { cn } from "@/lib/utils";

interface CopyAnalyzerProps {
  selectedAds: Ad[];
}

export function CopyAnalyzer({ selectedAds }: CopyAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [generatedCopies, setGeneratedCopies] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (selectedAds.length === 0) {
      toast.error("Selecione pelo menos um anúncio para analisar");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-copy", {
        body: { 
          ads: selectedAds.map(ad => ({
            headline: ad.headline,
            primary_text: ad.primary_text,
            cta: ad.cta,
            longevity_days: ad.longevity_days,
          })),
          action: "analyze" 
        },
      });

      if (error) throw error;
      
      setAnalysisResult(data.result);
      toast.success("Análise concluída!");
    } catch (e) {
      console.error("Analysis error:", e);
      toast.error("Erro ao analisar copies");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedAds.length === 0) {
      toast.error("Selecione pelo menos um anúncio como referência");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-copy", {
        body: { 
          ads: selectedAds.map(ad => ({
            headline: ad.headline,
            primary_text: ad.primary_text,
            cta: ad.cta,
          })),
          action: "generate" 
        },
      });

      if (error) throw error;
      
      setGeneratedCopies(data.result);
      toast.success("Copies geradas com sucesso!");
    } catch (e) {
      console.error("Generation error:", e);
      toast.error("Erro ao gerar copies");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copiado para a área de transferência");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Análise de Copy com IA
        </CardTitle>
        <CardDescription>
          Analise padrões de anúncios vencedores e gere copies otimizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analyze" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Analisar Padrões
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-2">
              <Wand2 className="h-4 w-4" />
              Gerar Copies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {selectedAds.length} anúncio(s) selecionado(s)
                </p>
                <p className="text-xs text-muted-foreground">
                  Selecione anúncios vencedores para análise de padrões
                </p>
              </div>
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || selectedAds.length === 0}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Analisar
              </Button>
            </div>

            {/* Selected ads preview */}
            {selectedAds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedAds.slice(0, 5).map((ad) => (
                  <Badge key={ad.id} variant="secondary" className="gap-1">
                    <Trophy className="h-3 w-3" />
                    {ad.page_name?.slice(0, 20)}...
                    <span className="text-primary">{ad.longevity_days}d</span>
                  </Badge>
                ))}
                {selectedAds.length > 5 && (
                  <Badge variant="outline">+{selectedAds.length - 5} mais</Badge>
                )}
              </div>
            )}

            {analysisResult && (
              <ScrollArea className="h-[400px] rounded-lg border border-border/50 p-4">
                <div className="prose prose-sm prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                    {analysisResult}
                  </pre>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Gerar variações baseadas em {selectedAds.length} referência(s)
                </p>
                <p className="text-xs text-muted-foreground">
                  A IA criará copies seguindo os padrões dos anúncios selecionados
                </p>
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || selectedAds.length === 0}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Gerar
              </Button>
            </div>

            {generatedCopies && (
              <div className="space-y-4">
                <ScrollArea className="h-[400px] rounded-lg border border-border/50 p-4">
                  <div className="space-y-4">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                      {generatedCopies}
                    </pre>
                  </div>
                </ScrollArea>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => copyToClipboard(generatedCopies, 0)}
                >
                  {copiedIndex === 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copiar Tudo
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
