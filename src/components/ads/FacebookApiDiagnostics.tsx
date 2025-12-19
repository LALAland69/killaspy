import { useFacebookApiStatus } from "@/hooks/useFacebookApiStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Shield, Key, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function FacebookApiDiagnostics() {
  const { isChecking, checkStatus, latestCheckResult } = useFacebookApiStatus();

  const diagnostics = latestCheckResult?.diagnostics;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Diagnóstico da API do Facebook
            </CardTitle>
            <CardDescription>
              Verifique token, permissões e conexão com a Ad Library
            </CardDescription>
          </div>
          <Button onClick={checkStatus} disabled={isChecking} size="sm">
            {isChecking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Executar Diagnóstico
          </Button>
        </div>
      </CardHeader>

      {diagnostics && (
        <CardContent className="space-y-4">
          {/* Token Info */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Key className="h-4 w-4" />
              Informações do Token
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <DiagnosticItem
                label="Válido"
                value={diagnostics.is_valid}
                type="boolean"
              />
              <DiagnosticItem
                label="Tipo"
                value={diagnostics.token_type}
              />
              <DiagnosticItem
                label="Comprimento"
                value={`${diagnostics.token_length} chars`}
              />
              <DiagnosticItem
                label="Expira"
                value={diagnostics.expires_at === "never" ? "Nunca" : diagnostics.expires_at}
              />
            </div>
            {diagnostics.token_prefix && (
              <div className="text-xs text-muted-foreground font-mono">
                Prefixo: {diagnostics.token_prefix}
              </div>
            )}
          </div>

          {/* Permissions */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              Permissões
            </div>
            <div className="flex flex-wrap gap-1.5">
              {diagnostics.scopes?.map((scope) => (
                <Badge
                  key={scope}
                  variant={scope === "ads_read" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {scope === "ads_read" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {scope}
                </Badge>
              ))}
            </div>
            <DiagnosticItem
              label="Permissão ads_read"
              value={diagnostics.has_ads_read}
              type="boolean"
              critical
            />
          </div>

          {/* Ad Library Connection */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4" />
              Conexão com Ad Library
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <DiagnosticItem
                label="HTTP Status"
                value={diagnostics.ad_library_http_status}
                expected={200}
              />
              <DiagnosticItem
                label="Funcionando"
                value={diagnostics.ad_library_working}
                type="boolean"
                critical
              />
            </div>

            {diagnostics.ad_library_error && (
              <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20 text-xs space-y-1">
                <div className="flex items-center gap-2 text-destructive font-medium">
                  <XCircle className="h-3 w-3" />
                  Erro na Ad Library
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <span>Código: {diagnostics.ad_library_error.code}</span>
                  <span>Tipo: {diagnostics.ad_library_error.type}</span>
                </div>
                <p className="text-muted-foreground">
                  {diagnostics.ad_library_error.message}
                </p>
                {diagnostics.ad_library_error.fbtrace_id && (
                  <code className="block text-[10px] text-muted-foreground mt-1">
                    fbtrace_id: {diagnostics.ad_library_error.fbtrace_id}
                  </code>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className={cn(
            "rounded-lg p-3 text-sm",
            latestCheckResult?.success 
              ? "bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400"
              : latestCheckResult?.error_type === "transient"
              ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400"
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          )}>
            <div className="flex items-center gap-2">
              {latestCheckResult?.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : latestCheckResult?.error_type === "transient" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="font-medium">{latestCheckResult?.message}</span>
            </div>
            {latestCheckResult?.error_type === "transient" && (
              <p className="text-xs mt-1 opacity-80">
                O token está correto mas o Facebook está retornando erros temporários.
                Isso geralmente se resolve em alguns minutos.
              </p>
            )}
          </div>
        </CardContent>
      )}

      {!diagnostics && !isChecking && (
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Clique em "Executar Diagnóstico" para verificar a conexão com a API do Facebook
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function DiagnosticItem({
  label,
  value,
  type,
  expected,
  critical,
}: {
  label: string;
  value: unknown;
  type?: "boolean";
  expected?: number;
  critical?: boolean;
}) {
  let displayValue: React.ReactNode = String(value ?? "—");
  let icon: React.ReactNode = null;

  if (type === "boolean") {
    const isTrue = value === true;
    icon = isTrue ? (
      <CheckCircle2 className="h-3 w-3 text-green-500" />
    ) : (
      <XCircle className={cn("h-3 w-3", critical ? "text-destructive" : "text-muted-foreground")} />
    );
    displayValue = isTrue ? "Sim" : "Não";
  } else if (expected !== undefined && typeof value === "number") {
    const isCorrect = value === expected;
    icon = isCorrect ? (
      <CheckCircle2 className="h-3 w-3 text-green-500" />
    ) : (
      <XCircle className="h-3 w-3 text-destructive" />
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{displayValue}</span>
    </div>
  );
}
