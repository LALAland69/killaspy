import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useDashboardRealtime } from "@/hooks/useRealtimeSubscription";
import { getAllQueryStats } from "@/lib/queryClient";
import { 
  Activity, 
  Cpu, 
  Database, 
  Gauge, 
  RefreshCw, 
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Wifi,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function PerformanceDashboardPage() {
  const { metrics, refresh, clearSlowRenders } = usePerformanceMonitor(3000);
  const { isSubscribed } = useDashboardRealtime();
  const [memoryHistory, setMemoryHistory] = useState<Array<{ time: string; memory: number }>>([]);

  // Track memory over time
  useEffect(() => {
    if (metrics.memoryUsage !== null) {
      setMemoryHistory((prev) => {
        const newEntry = {
          time: new Date().toLocaleTimeString(),
          memory: metrics.memoryUsage!,
        };
        return [...prev.slice(-20), newEntry];
      });
    }
  }, [metrics.memoryUsage]);

  // Format query stats for chart
  const queryData = Object.entries(metrics.queryStats).map(([key, stats]) => ({
    name: key.length > 20 ? key.substring(0, 20) + "..." : key,
    fullName: key,
    avg: stats.avg,
    max: stats.max,
    count: stats.count,
  }));

  // Performance score calculation
  const calculateHealthScore = () => {
    let score = 100;
    
    // Deduct for slow renders
    score -= Math.min(30, metrics.slowRenders.length * 2);
    
    // Deduct for high memory
    if (metrics.memoryUsage && metrics.memoryUsage > 100) {
      score -= Math.min(20, (metrics.memoryUsage - 100) / 5);
    }
    
    // Deduct for slow queries
    const slowQueries = Object.values(metrics.queryStats).filter(s => s.avg > 500).length;
    score -= slowQueries * 10;
    
    // Deduct for failed requests
    score -= metrics.failedRequests * 5;
    
    return Math.max(0, Math.round(score));
  };

  const healthScore = calculateHealthScore();
  const healthColor = healthScore >= 80 ? "text-green-500" : healthScore >= 60 ? "text-yellow-500" : "text-red-500";

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Performance Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sistema de monitoramento em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isSubscribed ? "default" : "secondary"} className="gap-1">
              <Wifi className="h-3 w-3" />
              {isSubscribed ? "Realtime Ativo" : "Conectando..."}
            </Badge>
            <Button onClick={refresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Health Score Card */}
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${healthColor}`}>
                  {healthScore}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Health Score</p>
                  <p className="text-xs text-muted-foreground">
                    {healthScore >= 80 ? "Sistema saudável" : 
                     healthScore >= 60 ? "Atenção necessária" : "Problemas detectados"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{metrics.pageLoadTime || 0}ms</p>
                  <p className="text-xs text-muted-foreground">Page Load</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{metrics.firstContentfulPaint || 0}ms</p>
                  <p className="text-xs text-muted-foreground">FCP</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{metrics.avgRequestTime || 0}ms</p>
                  <p className="text-xs text-muted-foreground">Avg Request</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid gap-4 grid-cols-4">
          <Card className="border-border/50 bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.memoryUsage ?? "N/A"}{metrics.memoryUsage !== null && " MB"}
                </p>
                <p className="text-xs text-muted-foreground">Memory Usage</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Database className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {Object.keys(metrics.queryStats).length}
                </p>
                <p className="text-xs text-muted-foreground">Cached Queries</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.slowRenders.length}
                </p>
                <p className="text-xs text-muted-foreground">Slow Renders</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.failedRequests}
                </p>
                <p className="text-xs text-muted-foreground">Failed Requests</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Memory Usage Over Time */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Memory Usage Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={memoryHistory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Query Performance */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Query Performance (avg ms)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={queryData.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                      formatter={(value, name, props) => [
                        `${value}ms`,
                        props.payload.fullName,
                      ]}
                    />
                    <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Slow Renders & Query Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Slow Renders */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Slow Renders ({'>'}16ms)
              </CardTitle>
              <Button onClick={clearSlowRenders} size="sm" variant="ghost">
                Clear
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {metrics.slowRenders.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Nenhum render lento detectado
                  </div>
                ) : (
                  <div className="space-y-2">
                    {metrics.slowRenders.slice().reverse().map((render, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <span className="text-sm font-mono text-foreground">
                          {render.component}
                        </span>
                        <Badge
                          variant={render.duration > 100 ? "destructive" : "secondary"}
                        >
                          {Math.round(render.duration)}ms
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Query Stats */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Database className="h-4 w-4" />
                Query Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {queryData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Nenhuma query executada
                  </div>
                ) : (
                  <div className="space-y-2">
                    {queryData.map((query, i) => (
                      <div
                        key={i}
                        className="p-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-foreground truncate max-w-[200px]">
                            {query.fullName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {query.count}x
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Avg: {query.avg}ms</span>
                          <span>Max: {query.max}ms</span>
                        </div>
                        <Progress 
                          value={Math.min(100, (query.avg / 500) * 100)} 
                          className="h-1 mt-1"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
