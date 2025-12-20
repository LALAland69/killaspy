import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFacebookApiHistory } from "@/hooks/useFacebookApiHistory";
import { CheckCircle2, XCircle, Clock, Activity, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function FacebookApiHistoryPanel() {
  const { data: history, isLoading } = useFacebookApiHistory();

  const successCount = history?.filter(r => r.status === "completed" && r.metadata?.success).length || 0;
  const errorCount = history?.filter(r => r.status === "failed" || !r.metadata?.success).length || 0;
  const totalChecks = history?.length || 0;
  const uptimePercent = totalChecks > 0 ? Math.round((successCount / totalChecks) * 100) : 0;

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Status API Facebook (24h)
          </CardTitle>
          {totalChecks > 0 && (
            <Badge 
              variant={uptimePercent >= 90 ? "default" : uptimePercent >= 50 ? "secondary" : "destructive"}
              className="text-xs"
            >
              {uptimePercent}% uptime
            </Badge>
          )}
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            {successCount} OK
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-destructive" />
            {errorCount} Erros
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {totalChecks} verificações
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : totalChecks === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Nenhuma verificação nas últimas 24h
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2">
              {history?.map((record) => {
                const isSuccess = record.status === "completed" && record.metadata?.success;
                const httpStatus = record.metadata?.diagnostics?.ad_library_http_status;
                const errorCode = record.metadata?.diagnostics?.error_code;

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isSuccess ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {isSuccess ? "API Operacional" : "Erro Detectado"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {httpStatus && `HTTP ${httpStatus}`}
                          {errorCode && ` • Erro ${errorCode}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(record.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
