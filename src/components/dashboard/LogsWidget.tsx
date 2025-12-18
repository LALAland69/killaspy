import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Bug, Info, Clock, TrendingUp, ExternalLink } from "lucide-react";
import { useLogs, LogEntry } from "@/lib/logger";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface ApiMetrics {
  totalCalls: number;
  successRate: number;
  avgDuration: number;
  errorCount: number;
}

function calculateApiMetrics(logs: LogEntry[]): ApiMetrics {
  const apiLogs = logs.filter(l => l.category === 'API' || l.category === 'EDGE_FN');
  const recentLogs = apiLogs.filter(l => {
    const logTime = new Date(l.timestamp).getTime();
    const hourAgo = Date.now() - 60 * 60 * 1000;
    return logTime > hourAgo;
  });

  const successLogs = recentLogs.filter(l => l.level !== 'error');
  const durations = recentLogs
    .map(l => {
      const match = l.data?.duration?.match(/(\d+)ms/);
      return match ? parseInt(match[1]) : null;
    })
    .filter((d): d is number => d !== null);

  return {
    totalCalls: recentLogs.length,
    successRate: recentLogs.length > 0 ? (successLogs.length / recentLogs.length) * 100 : 100,
    avgDuration: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
    errorCount: recentLogs.filter(l => l.level === 'error').length,
  };
}

function getLevelIcon(level: string) {
  switch (level) {
    case 'error':
      return <AlertTriangle className="h-3 w-3 text-destructive" />;
    case 'warn':
      return <Bug className="h-3 w-3 text-yellow-500" />;
    default:
      return <Info className="h-3 w-3 text-muted-foreground" />;
  }
}

function getLevelBadge(level: string) {
  switch (level) {
    case 'error':
      return <Badge variant="destructive" className="text-[10px] px-1">ERROR</Badge>;
    case 'warn':
      return <Badge variant="outline" className="text-[10px] px-1 border-yellow-500 text-yellow-500">WARN</Badge>;
    default:
      return null;
  }
}

export function LogsWidget() {
  const { logs } = useLogs();
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<ApiMetrics>({
    totalCalls: 0,
    successRate: 100,
    avgDuration: 0,
    errorCount: 0,
  });

  // Get recent errors and warnings
  const recentIssues = logs
    .filter(l => l.level === 'error' || l.level === 'warn')
    .slice(0, 5);

  useEffect(() => {
    setMetrics(calculateApiMetrics(logs));
  }, [logs]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bug className="h-4 w-4" />
          {t('logs')}
        </CardTitle>
        <Link to="/logs">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <ExternalLink className="h-3 w-3 mr-1" />
            Ver todos
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Chamadas/h
            </div>
            <div className="text-lg font-semibold">{metrics.totalCalls}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              Média (ms)
            </div>
            <div className="text-lg font-semibold">{metrics.avgDuration}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="text-[10px] text-muted-foreground">Sucesso</div>
            <div className={`text-lg font-semibold ${metrics.successRate < 90 ? 'text-destructive' : 'text-green-500'}`}>
              {metrics.successRate.toFixed(0)}%
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="text-[10px] text-muted-foreground">Erros</div>
            <div className={`text-lg font-semibold ${metrics.errorCount > 0 ? 'text-destructive' : ''}`}>
              {metrics.errorCount}
            </div>
          </div>
        </div>

        {/* Recent Issues */}
        <div>
          <div className="text-xs font-medium mb-2 text-muted-foreground">
            Últimos problemas
          </div>
          <ScrollArea className="h-[120px]">
            {recentIssues.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                Nenhum erro recente
              </div>
            ) : (
              <div className="space-y-2">
                {recentIssues.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 p-2 rounded bg-muted/30 text-xs"
                  >
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate">[{log.category}]</span>
                        {getLevelBadge(log.level)}
                      </div>
                      <div className="text-muted-foreground truncate">{log.message}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
