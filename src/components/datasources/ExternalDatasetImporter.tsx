import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Globe, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Loader2
} from "lucide-react";

interface ImportProgress {
  total: number;
  processed: number;
  imported: number;
  updated: number;
  errors: number;
  status: 'idle' | 'fetching' | 'processing' | 'completed' | 'error';
}

export function ExternalDatasetImporter() {
  const queryClient = useQueryClient();
  const [adId, setAdId] = useState('');
  const [pageId, setPageId] = useState('');
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    imported: 0,
    updated: 0,
    errors: 0,
    status: 'idle'
  });

  // Fetch single ad from external API
  const fetchAdMutation = useMutation({
    mutationFn: async (id: string) => {
      setProgress(p => ({ ...p, status: 'fetching' }));
      
      const { data, error } = await supabase.functions.invoke('import-external-ads', {
        body: { action: 'fetch_ad', ad_id: id }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      setProgress(p => ({ ...p, status: 'completed', imported: 1 }));
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast.success(`Anúncio ${data.ad?.id || 'importado'} adicionado com sucesso`);
    },
    onError: (error: Error) => {
      setProgress(p => ({ ...p, status: 'error' }));
      toast.error(`Erro ao importar: ${error.message}`);
    }
  });

  // Fetch ads from a page
  const fetchPageMutation = useMutation({
    mutationFn: async (id: string) => {
      setProgress({ total: 0, processed: 0, imported: 0, updated: 0, errors: 0, status: 'fetching' });
      
      const { data, error } = await supabase.functions.invoke('import-external-ads', {
        body: { action: 'fetch_page', page_id: id, limit: 100 }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      setProgress(p => ({ 
        ...p, 
        status: 'completed', 
        total: data.total || 0,
        imported: data.imported || 0,
        updated: data.updated || 0,
        errors: data.errors || 0
      }));
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      toast.success(`Importados ${data.imported} anúncios de ${data.total} encontrados`);
    },
    onError: (error: Error) => {
      setProgress(p => ({ ...p, status: 'error' }));
      toast.error(`Erro ao importar página: ${error.message}`);
    }
  });

  const handleFetchAd = () => {
    if (!adId.trim()) {
      toast.error('Digite o ID do anúncio');
      return;
    }
    fetchAdMutation.mutate(adId.trim());
  };

  const handleFetchPage = () => {
    if (!pageId.trim()) {
      toast.error('Digite o Page ID');
      return;
    }
    fetchPageMutation.mutate(pageId.trim());
  };

  const isLoading = fetchAdMutation.isPending || fetchPageMutation.isPending;
  const progressPercent = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* ad-archive.nexxxt.cloud */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            ad-archive.nexxxt.cloud
          </CardTitle>
          <CardDescription>
            Importar dados do arquivo público de anúncios políticos. Requer verificação prévia de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Requisitos de Acesso</AlertTitle>
            <AlertDescription>
              Este dataset requer que você tenha acesso verificado à API do Facebook Ad Library.
              <a 
                href="https://ad-archive.nexxxt.cloud" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
              >
                Verificar acesso <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Import by Ad ID */}
            <div className="space-y-3">
              <Label>Importar por Ad ID</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 855757530477365"
                  value={adId}
                  onChange={(e) => setAdId(e.target.value)}
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleFetchAd} 
                  disabled={isLoading || !adId.trim()}
                >
                  {fetchAdMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Busca um anúncio específico pelo seu ID na biblioteca
              </p>
            </div>

            {/* Import by Page ID */}
            <div className="space-y-3">
              <Label>Importar por Page ID</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 282592881929497"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleFetchPage} 
                  disabled={isLoading || !pageId.trim()}
                >
                  {fetchPageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Busca todos os anúncios de uma página/anunciante
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          {progress.status !== 'idle' && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {progress.status === 'fetching' && 'Buscando dados...'}
                  {progress.status === 'processing' && 'Processando...'}
                  {progress.status === 'completed' && 'Concluído!'}
                  {progress.status === 'error' && 'Erro na importação'}
                </span>
                {progress.total > 0 && (
                  <span>{progress.processed}/{progress.total}</span>
                )}
              </div>
              
              {progress.total > 0 && (
                <Progress value={progressPercent} />
              )}

              {progress.status === 'completed' && (
                <div className="flex gap-4 text-sm">
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {progress.imported} importados
                  </Badge>
                  {progress.updated > 0 && (
                    <Badge variant="secondary">
                      {progress.updated} atualizados
                    </Badge>
                  )}
                  {progress.errors > 0 && (
                    <Badge variant="destructive">
                      {progress.errors} erros
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Direct Link Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como obter IDs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Ad ID:</strong> Acesse a biblioteca de anúncios do Facebook, clique em um anúncio e copie o ID da URL:
            <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">
              facebook.com/ads/library/?id=<span className="text-primary">123456789</span>
            </code>
          </div>
          <div>
            <strong>Page ID:</strong> Na biblioteca, procure por um anunciante e use o parâmetro view_all_page_id:
            <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">
              view_all_page_id=<span className="text-primary">987654321</span>
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
