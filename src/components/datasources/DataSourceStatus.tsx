import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Database, Users, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export function DataSourceStatus() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['datasource-overview'],
    queryFn: async () => {
      // Get total ads count
      const { count: adsCount } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true });

      // Get total advertisers count
      const { count: advertisersCount } = await supabase
        .from('advertisers')
        .select('*', { count: 'exact', head: true });

      // Get recent imports
      const { data: recentJobs } = await supabase
        .from('job_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get ads imported today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayCount } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      return {
        totalAds: adsCount || 0,
        totalAdvertisers: advertisersCount || 0,
        adsToday: todayCount || 0,
        recentJobs: recentJobs || [],
      };
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const lastJob = stats?.recentJobs?.[0];
  const lastJobStatus = lastJob?.status;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Anúncios</p>
              <p className="text-2xl font-bold">{stats?.totalAds?.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Users className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Anunciantes</p>
              <p className="text-2xl font-bold">{stats?.totalAdvertisers?.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Importados Hoje</p>
              <p className="text-2xl font-bold">{stats?.adsToday?.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${
              lastJobStatus === 'completed' ? 'bg-green-500/10' :
              lastJobStatus === 'failed' ? 'bg-red-500/10' :
              lastJobStatus === 'running' ? 'bg-yellow-500/10' :
              'bg-muted'
            }`}>
              {lastJobStatus === 'completed' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : lastJobStatus === 'failed' ? (
                <XCircle className="h-6 w-6 text-red-600" />
              ) : lastJobStatus === 'running' ? (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              ) : (
                <Clock className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Último Job</p>
              <div className="flex items-center gap-2">
                <Badge variant={
                  lastJobStatus === 'completed' ? 'default' :
                  lastJobStatus === 'failed' ? 'destructive' :
                  'secondary'
                }>
                  {lastJobStatus || 'Nenhum'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
