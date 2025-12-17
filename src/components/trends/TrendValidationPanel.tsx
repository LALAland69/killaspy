import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  Loader2,
  Globe,
  BarChart3,
  ArrowUpRight,
  History
} from "lucide-react";
import { useValidateTrend, useTrendValidations, TrendValidation } from "@/hooks/useTrendValidation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const regions = [
  { value: "BR", label: "Brasil" },
  { value: "US", label: "Estados Unidos" },
  { value: "PT", label: "Portugal" },
  { value: "ES", label: "Espanha" },
  { value: "GB", label: "Reino Unido" },
  { value: "DE", label: "Alemanha" },
  { value: "FR", label: "França" },
];

const directionIcons = {
  rising: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const directionColors = {
  rising: "text-green-400",
  stable: "text-yellow-400",
  declining: "text-red-400",
};

const directionLabels = {
  rising: "Em Alta",
  stable: "Estável",
  declining: "Em Queda",
};

export function TrendValidationPanel() {
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("BR");
  const [selectedTrend, setSelectedTrend] = useState<TrendValidation | null>(null);
  
  const validateTrend = useValidateTrend();
  const { data: recentTrends = [], isLoading } = useTrendValidations();

  const handleValidate = () => {
    if (!keyword.trim()) return;
    validateTrend.mutate({ keyword: keyword.trim(), region });
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Validação de Tendências
          </CardTitle>
          <CardDescription>
            Valide tendências de mercado em tempo real usando dados do Google Trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Digite uma palavra-chave para validar..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleValidate()}
              />
            </div>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-[180px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleValidate} disabled={validateTrend.isPending || !keyword.trim()}>
              {validateTrend.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Validar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trends */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-4 w-4" />
              Validações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentTrends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma validação realizada ainda
              </p>
            ) : (
              recentTrends.slice(0, 10).map((trend) => {
                const direction = (trend.trend_direction || "stable") as keyof typeof directionIcons;
                const Icon = directionIcons[direction];
                const colorClass = directionColors[direction];
                
                return (
                  <div
                    key={trend.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => setSelectedTrend(trend)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${colorClass}`} />
                      <div>
                        <p className="font-medium text-sm">{trend.keyword}</p>
                        <p className="text-xs text-muted-foreground">{trend.region}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={colorClass}>
                        {trend.trend_score || 0}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Trend Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {selectedTrend ? `Análise: ${selectedTrend.keyword}` : "Selecione uma Tendência"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTrend ? (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-primary">{selectedTrend.trend_score || 0}</p>
                    <p className="text-xs text-muted-foreground">Score de Tendência</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center gap-2">
                      {(() => {
                        const direction = (selectedTrend.trend_direction || "stable") as keyof typeof directionIcons;
                        const Icon = directionIcons[direction];
                        const colorClass = directionColors[direction];
                        return (
                          <>
                            <Icon className={`h-6 w-6 ${colorClass}`} />
                            <span className={`text-lg font-semibold ${colorClass}`}>
                              {directionLabels[direction]}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Direção</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-lg font-semibold">{selectedTrend.region}</p>
                    <p className="text-xs text-muted-foreground">Região</p>
                  </div>
                </div>

                {/* Interest Over Time Chart */}
                {selectedTrend.interest_over_time && (selectedTrend.interest_over_time as Array<{ date: string; value: number }>).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Interesse ao Longo do Tempo</h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedTrend.interest_over_time as Array<{ date: string; value: number }>}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary) / 0.2)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Related Queries */}
                {selectedTrend.related_queries && (selectedTrend.related_queries as Array<{ query: string; value: number }>).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Pesquisas Relacionadas</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedTrend.related_queries as Array<{ query: string; value: number }>).map((q, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {q.query}
                          <ArrowUpRight className="h-3 w-3" />
                          <span className="text-primary">{q.value}%</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Validado {formatDistanceToNow(new Date(selectedTrend.validated_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
                <p>Selecione uma tendência da lista ou faça uma nova validação</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
