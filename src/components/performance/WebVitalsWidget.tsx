import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Activity, 
  Gauge, 
  MousePointer, 
  LayoutGrid, 
  Clock, 
  Zap,
  Info
} from 'lucide-react';
import { 
  useWebVitalsMonitor, 
  formatMetricValue, 
  getRatingColor,
  getRatingBgColor,
  type WebVitalMetric 
} from '@/hooks/useWebVitalsMonitor';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  metric: WebVitalMetric | null;
  name: string;
  description: string;
  icon: React.ReactNode;
  thresholds: { good: number; poor: number };
}

const MetricCard = memo(function MetricCard({ 
  metric, 
  name, 
  description, 
  icon,
  thresholds 
}: MetricCardProps) {
  const value = metric?.value ?? null;
  const rating = metric?.rating ?? 'needs-improvement';
  const progressValue = value !== null 
    ? Math.min(100, (value / thresholds.poor) * 100)
    : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={cn(
            'transition-all duration-300 hover:shadow-md cursor-help',
            metric && getRatingBgColor(rating)
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center',
                    metric ? getRatingBgColor(rating) : 'bg-muted'
                  )}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
                {metric && (
                  <Badge 
                    variant="outline" 
                    className={cn(getRatingColor(rating), 'border-current')}
                  >
                    {rating === 'good' ? 'Bom' : rating === 'needs-improvement' ? 'Médio' : 'Ruim'}
                  </Badge>
                )}
              </div>
              
              <div className="mt-3">
                <div className="flex items-baseline justify-between mb-1">
                  <span className={cn(
                    'text-2xl font-bold',
                    metric ? getRatingColor(rating) : 'text-muted-foreground'
                  )}>
                    {value !== null ? formatMetricValue(name, value) : '--'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Limite: {name === 'CLS' ? thresholds.good : `${thresholds.good}ms`}
                  </span>
                </div>
                <Progress 
                  value={progressValue} 
                  className="h-1.5"
                />
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">{getMetricExplanation(name)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

function getMetricExplanation(name: string): string {
  const explanations: Record<string, string> = {
    LCP: 'Largest Contentful Paint mede o tempo até o maior elemento visível ser renderizado. Valores abaixo de 2.5s são considerados bons.',
    FID: 'First Input Delay mede o tempo entre a primeira interação do usuário e a resposta do navegador. Valores abaixo de 100ms são bons.',
    CLS: 'Cumulative Layout Shift mede a estabilidade visual da página. Valores abaixo de 0.1 são considerados bons.',
    FCP: 'First Contentful Paint mede o tempo até o primeiro conteúdo ser renderizado. Valores abaixo de 1.8s são bons.',
    TTFB: 'Time to First Byte mede o tempo até o primeiro byte ser recebido do servidor. Valores abaixo de 800ms são bons.',
    INP: 'Interaction to Next Paint mede a responsividade geral às interações. Valores abaixo de 200ms são bons.',
  };
  return explanations[name] || '';
}

export const WebVitalsWidget = memo(function WebVitalsWidget() {
  const { vitals, getOverallScore, getOverallRating, thresholds } = useWebVitalsMonitor();
  
  const overallScore = getOverallScore();
  const overallRating = getOverallRating();

  const metrics = [
    {
      metric: vitals.lcp,
      name: 'LCP',
      description: 'Largest Contentful Paint',
      icon: <Gauge className="h-4 w-4" />,
      thresholds: thresholds.LCP,
    },
    {
      metric: vitals.fid,
      name: 'FID',
      description: 'First Input Delay',
      icon: <MousePointer className="h-4 w-4" />,
      thresholds: thresholds.FID,
    },
    {
      metric: vitals.cls,
      name: 'CLS',
      description: 'Cumulative Layout Shift',
      icon: <LayoutGrid className="h-4 w-4" />,
      thresholds: thresholds.CLS,
    },
    {
      metric: vitals.fcp,
      name: 'FCP',
      description: 'First Contentful Paint',
      icon: <Activity className="h-4 w-4" />,
      thresholds: thresholds.FCP,
    },
    {
      metric: vitals.ttfb,
      name: 'TTFB',
      description: 'Time to First Byte',
      icon: <Clock className="h-4 w-4" />,
      thresholds: thresholds.TTFB,
    },
    {
      metric: vitals.inp,
      name: 'INP',
      description: 'Interaction to Next Paint',
      icon: <Zap className="h-4 w-4" />,
      thresholds: thresholds.INP,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card className={cn(
        'border-2 transition-colors',
        overallRating === 'good' && 'border-green-500/50',
        overallRating === 'needs-improvement' && 'border-yellow-500/50',
        overallRating === 'poor' && 'border-red-500/50'
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Core Web Vitals Score
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm max-w-xs">
                    Score calculado com base nas métricas LCP (25%), FID (25%), CLS (25%), FCP (15%) e TTFB (10%)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={cn(
              'text-5xl font-bold',
              getRatingColor(overallRating)
            )}>
              {overallScore}
            </div>
            <div className="flex-1">
              <Progress 
                value={overallScore} 
                className="h-3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {overallRating === 'good' && 'Excelente! Seu site passa nos Core Web Vitals.'}
                {overallRating === 'needs-improvement' && 'Precisa de melhorias para passar nos Core Web Vitals.'}
                {overallRating === 'poor' && 'Performance ruim. Otimizações são necessárias.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <MetricCard
            key={m.name}
            metric={m.metric}
            name={m.name}
            description={m.description}
            icon={m.icon}
            thresholds={m.thresholds}
          />
        ))}
      </div>
    </div>
  );
});
