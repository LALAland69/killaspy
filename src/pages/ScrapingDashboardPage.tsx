import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Users,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FacebookApiStatusBanner from '@/components/ads/FacebookApiStatusBanner';

interface JobRun {
  id: string;
  job_name: string;
  task_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  ads_processed: number | null;
  divergences_found: number | null;
  error_message: string | null;
  duration_ms: number | null;
  metadata: Record<string, any> | null;
}

interface Stats {
  totalAds: number;
  totalAdvertisers: number;
  todayAds: number;
  activeJobs: number;
}

export default function ScrapingDashboardPage() {
  const queryClient = useQueryClient();

  // Query for job runs
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['scraping-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as JobRun[];
    },
    refetchInterval: 5000, // Refresh every 5s
  });

  // Query for statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['scraping-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [adsResult, advertisersResult, todayAdsResult, activeJobsResult] = await Promise.all([
        supabase.from('ads').select('id', { count: 'exact', head: true }),
        supabase.from('advertisers').select('id', { count: 'exact', head: true }),
        supabase.from('ads').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('job_runs').select('id', { count: 'exact', head: true }).eq('status', 'running'),
      ]);

      return {
        totalAds: adsResult.count || 0,
        totalAdvertisers: advertisersResult.count || 0,
        todayAds: todayAdsResult.count || 0,
        activeJobs: activeJobsResult.count || 0,
      } as Stats;
    },
    refetchInterval: 10000,
  });

  // Mutation to trigger manual scraping
  const triggerScraping = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('facebook-ad-library', {
        body: { action: 'scheduled' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Scraping iniciado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['scraping-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao iniciar scraping: ${error.message}`);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-primary/20 text-primary">Executando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Facebook API Status Banner */}
        <FacebookApiStatusBanner />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                Scraping Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground">
              Monitore e controle a coleta automática de anúncios
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => triggerScraping.mutate()}
              disabled={triggerScraping.isPending}
            >
              {triggerScraping.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Executar Agora
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Total de Anúncios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.totalAds.toLocaleString('pt-BR')
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Anunciantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.totalAdvertisers.toLocaleString('pt-BR')
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Novos Hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `+${stats?.todayAds.toLocaleString('pt-BR')}`
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Jobs Ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.activeJobs || 0
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Execuções
            </CardTitle>
            <CardDescription>
              Últimas 20 execuções do sistema de scraping
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-muted rounded" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors gap-2"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="font-medium text-foreground">
                          {job.job_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(job.started_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-7 sm:ml-0">
                      <div className="text-sm text-muted-foreground">
                        {job.ads_processed !== null && (
                          <span>{job.ads_processed} anúncios</span>
                        )}
                        {job.duration_ms && (
                          <span className="ml-2">• {formatDuration(job.duration_ms)}</span>
                        )}
                      </div>
                      {getStatusBadge(job.status)}
                    </div>

                    {job.error_message && (
                      <div className="w-full mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive flex items-start gap-2">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{job.error_message}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Database className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma execução registrada ainda
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => triggerScraping.mutate()}
                  disabled={triggerScraping.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar primeira execução
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cron Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  Scraping Automático Configurado
                </p>
                <p className="text-muted-foreground">
                  O sistema executa automaticamente a cada 6 horas para buscar novos anúncios
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
