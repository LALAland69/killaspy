import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Database, 
  Upload, 
  Globe, 
  FileJson, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Download,
  ExternalLink,
  Server,
  Zap
} from "lucide-react";
import { ExternalDatasetImporter } from "@/components/datasources/ExternalDatasetImporter";
import { ManualImporter } from "@/components/datasources/ManualImporter";
import { DataSourceStatus } from "@/components/datasources/DataSourceStatus";

export default function DataSourcesPage() {
  const queryClient = useQueryClient();

  // Query for data source stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['datasource-stats'],
    queryFn: async () => {
      const { data: ads, error: adsError } = await supabase
        .from('ads')
        .select('id, created_at', { count: 'exact', head: true });
      
      const { data: advertisers, error: advError } = await supabase
        .from('advertisers')
        .select('id', { count: 'exact', head: true });

      const { data: recentJobs } = await supabase
        .from('job_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        totalAds: ads || 0,
        totalAdvertisers: advertisers || 0,
        recentJobs: recentJobs || [],
      };
    },
    refetchInterval: 30000,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6" />
              Data Sources
            </h1>
            <p className="text-muted-foreground">
              Configure múltiplas fontes para agregar dados de anúncios
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['datasource-stats'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Status Overview */}
        <DataSourceStatus />

        {/* Main Tabs */}
        <Tabs defaultValue="external" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="external" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Datasets Externos
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importação Manual
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              API Oficial
            </TabsTrigger>
          </TabsList>

          {/* External Datasets Tab */}
          <TabsContent value="external">
            <ExternalDatasetImporter />
          </TabsContent>

          {/* Manual Import Tab */}
          <TabsContent value="manual">
            <ManualImporter />
          </TabsContent>

          {/* Official API Tab */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Meta Ads Library API Oficial
                </CardTitle>
                <CardDescription>
                  Use a API oficial do Facebook para buscar anúncios (requer token válido)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Status da API Oficial</AlertTitle>
                  <AlertDescription>
                    A API oficial do Facebook pode ter bloqueios ou limitações de rate.
                    Considere usar fontes alternativas para maior volume de dados.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button variant="outline" asChild>
                    <a href="/facebook-setup" className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Configurar Token
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/import" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Ir para Importação
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Alternative Sources Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Fontes de Dados Suportadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">ad-archive.nexxxt.cloud</h4>
                  <Badge variant="default">Gratuito</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cópia completa da Ad Library política. Requer verificação de acesso à API do Facebook.
                </p>
                <a 
                  href="https://ad-archive.nexxxt.cloud" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Acessar →
                </a>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">BigSpy / AdHeart</h4>
                  <Badge variant="secondary">Pago</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ferramentas comerciais com exportação CSV. Importe dados via upload manual.
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">PipiAds</h4>
                  <Badge variant="secondary">Pago</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Especializado em TikTok e Facebook. Base de 100M+ anúncios.
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">AdSpy</h4>
                  <Badge variant="secondary">Pago</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  30M+ anúncios com filtros avançados. Exportação disponível.
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Importação JSON/CSV</h4>
                  <Badge variant="outline">Manual</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Importe dados de qualquer fonte no formato JSON ou CSV padronizado.
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Meta API Oficial</h4>
                  <Badge variant="destructive">Limitado</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  API oficial com rate limits rigorosos e possíveis bloqueios.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
