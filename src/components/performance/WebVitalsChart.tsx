import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { useWebVitalsMonitor, type WebVitalsHistory } from '@/hooks/useWebVitalsMonitor';
import { cn } from '@/lib/utils';

interface WebVitalsChartProps {
  metric?: 'lcp' | 'fid' | 'cls' | 'fcp' | 'ttfb';
  showAll?: boolean;
}

const METRIC_CONFIG = {
  lcp: { label: 'LCP', color: '#10b981', threshold: 2500 },
  fid: { label: 'FID', color: '#f59e0b', threshold: 100 },
  cls: { label: 'CLS', color: '#8b5cf6', threshold: 0.1 },
  fcp: { label: 'FCP', color: '#06b6d4', threshold: 1800 },
  ttfb: { label: 'TTFB', color: '#ec4899', threshold: 800 },
} as const;

export const WebVitalsChart = memo(function WebVitalsChart({ 
  metric = 'lcp',
  showAll = false 
}: WebVitalsChartProps) {
  const { history, thresholds } = useWebVitalsMonitor();

  const chartData = useMemo(() => {
    return history.map((entry, index) => ({
      ...entry,
      time: new Date(entry.timestamp).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      index,
    }));
  }, [history]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return 'stable';
    const recent = chartData.slice(-5);
    const old = chartData.slice(-10, -5);
    
    if (recent.length === 0 || old.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, d) => sum + (d[metric] ?? 0), 0) / recent.length;
    const oldAvg = old.reduce((sum, d) => sum + (d[metric] ?? 0), 0) / old.length;
    
    const diff = ((recentAvg - oldAvg) / oldAvg) * 100;
    
    if (diff > 10) return 'up';
    if (diff < -10) return 'down';
    return 'stable';
  }, [chartData, metric]);

  const config = METRIC_CONFIG[metric];

  if (showAll) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Histórico de Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                {Object.entries(METRIC_CONFIG).map(([key, cfg]) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={cfg.label}
                    stroke={cfg.color}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: config.color }}
            />
            {config.label} ao longo do tempo
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              trend === 'up' && 'text-red-500 border-red-500/50',
              trend === 'down' && 'text-green-500 border-green-500/50',
              trend === 'stable' && 'text-muted-foreground'
            )}
          >
            {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
            {trend === 'stable' && <Minus className="h-3 w-3 mr-1" />}
            {trend === 'up' && 'Piorando'}
            {trend === 'down' && 'Melhorando'}
            {trend === 'stable' && 'Estável'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [
                  metric === 'cls' ? value?.toFixed(3) : `${Math.round(value)}ms`,
                  config.label
                ]}
              />
              <ReferenceLine 
                y={config.threshold} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                label={{ 
                  value: 'Limite', 
                  fill: 'hsl(var(--destructive))',
                  fontSize: 10 
                }}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
