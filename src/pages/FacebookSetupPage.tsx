import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  Key,
  Globe,
  Shield,
  RefreshCw,
  Copy,
  Loader2,
  Terminal,
  Play,
  Trash2,
  Download,
  Bug,
  Zap,
  Server,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useFacebookApiStatus } from "@/hooks/useFacebookApiStatus";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticLog {
  id: string;
  timestamp: Date;
  type: "info" | "success" | "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
}

interface TestResult {
  version: string;
  httpStatus: number;
  success: boolean;
  errorCode?: number;
  errorMessage?: string;
  duration: number;
  timestamp: Date;
}

export default function FacebookSetupPage() {
  const { isWorking, statusInfo, isLoading, isChecking, checkStatus, latestCheckResult } = useFacebookApiStatus();
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [isTestingDirectly, setIsTestingDirectly] = useState(false);

  const addLog = (type: DiagnosticLog["type"], message: string, details?: Record<string, unknown>) => {
    const log: DiagnosticLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      message,
      details,
    };
    setLogs((prev) => [log, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  const clearLogs = () => {
    setLogs([]);
    toast.success("Logs limpos");
  };

  const exportLogs = () => {
    const logText = logs
      .map((log) => `[${log.timestamp.toISOString()}] [${log.type.toUpperCase()}] ${log.message}${log.details ? `\n  Details: ${JSON.stringify(log.details, null, 2)}` : ""}`)
      .join("\n\n");
    
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facebook-api-diagnostics-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs exportados");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  // Run comprehensive diagnostics
  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    addLog("info", "Iniciando diagnóstico completo...");
    
    try {
      // Step 1: Check edge function availability
      addLog("info", "Verificando edge function check-facebook-status...");
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke("check-facebook-status");
      const duration = Date.now() - startTime;
      
      if (error) {
        addLog("error", `Edge function falhou: ${error.message}`, { error });
        return;
      }
      
      addLog("success", `Edge function respondeu em ${duration}ms`);
      
      // Parse response
      const status = data?.status;
      if (status) {
        addLog("info", `Status da API: ${status.success ? "Funcionando" : "Com problemas"}`, {
          success: status.success,
          error_code: status.error_code,
          message: status.message,
        });
        
        if (status.diagnostics) {
          addLog("info", "Detalhes do diagnóstico:", status.diagnostics);
          
          // Add test result
          const testResult: TestResult = {
            version: status.diagnostics.ad_library_version || "unknown",
            httpStatus: status.diagnostics.ad_library_http_status || 0,
            success: status.success,
            errorCode: status.error_code,
            errorMessage: status.diagnostics.ad_library_error?.message,
            duration,
            timestamp: new Date(),
          };
          setTestResults((prev) => [testResult, ...prev].slice(0, 20));
          
          // Analyze token
          if (status.diagnostics.token_format) {
            addLog(
              status.diagnostics.token_format === "APP_ID|APP_SECRET" ? "success" : "warning",
              `Token format: ${status.diagnostics.token_format}`,
              { token_length: status.diagnostics.token_length }
            );
          }
          
          // Analyze error
          if (status.diagnostics.ad_library_error) {
            const err = status.diagnostics.ad_library_error;
            addLog("error", `Erro do Facebook: [${err.code}] ${err.type}`, {
              message: err.message,
              fbtrace_id: err.fbtrace_id,
            });
            
            // Provide specific guidance based on error code
            if (err.code === 1) {
              addLog("warning", "Código 1: Erro temporário do Facebook. Pode ser propagação do modo LIVE ou instabilidade.");
            } else if (err.code === 190) {
              addLog("error", "Código 190: Token inválido ou expirado. Regenere o token no Facebook Developers.");
            } else if (err.code === 100) {
              addLog("error", "Código 100: Parâmetros inválidos na requisição.");
            } else if (err.code === 4) {
              addLog("warning", "Código 4: Rate limit excedido. Aguarde alguns minutos.");
            } else if (err.code === 200) {
              addLog("error", "Código 200: Permissão negada. Verifique se o app tem ads_read.");
            } else if (err.code === 270) {
              addLog("error", "Código 270: App não aprovado para usar Ad Library API.");
            }
          }
        }
        
        if (data?.recovered) {
          addLog("success", "🎉 API recuperada! Estava com problemas e agora está funcionando.");
        }
      }
      
    } catch (err) {
      addLog("error", `Erro inesperado: ${err instanceof Error ? err.message : "Erro desconhecido"}`, { error: err });
    } finally {
      setIsRunningDiagnostics(false);
      addLog("info", "Diagnóstico concluído.");
    }
  };

  // Test API directly from browser (will fail due to CORS, but shows the attempt)
  const testApiDirectly = async () => {
    setIsTestingDirectly(true);
    addLog("info", "Testando API diretamente do navegador (esperado: erro CORS)...");
    
    const versions = ["v24.0", "v21.0", "v18.0"];
    
    for (const version of versions) {
      const url = `https://graph.facebook.com/${version}/ads_archive?access_token=3739100463050486|61a14fc116103fd34bd72634761f74c3&ad_reached_countries=["BR"]&search_terms=coca+cola&limit=1&fields=id`;
      
      try {
        addLog("info", `Testando ${version}...`);
        const startTime = Date.now();
        const response = await fetch(url);
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          addLog("success", `${version}: Sucesso em ${duration}ms`, { data_preview: JSON.stringify(data).slice(0, 200) });
          
          setTestResults((prev) => [{
            version,
            httpStatus: response.status,
            success: true,
            duration,
            timestamp: new Date(),
          }, ...prev].slice(0, 20));
        } else {
          const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
          addLog("error", `${version}: HTTP ${response.status} em ${duration}ms`, errorData);
          
          setTestResults((prev) => [{
            version,
            httpStatus: response.status,
            success: false,
            errorCode: errorData?.error?.code,
            errorMessage: errorData?.error?.message,
            duration,
            timestamp: new Date(),
          }, ...prev].slice(0, 20));
        }
      } catch (err) {
        addLog("warning", `${version}: ${err instanceof Error ? err.message : "Erro de rede (provavelmente CORS)"}`, {
          note: "Erros de CORS são normais ao testar do navegador. Use o diagnóstico via edge function."
        });
      }
    }
    
    setIsTestingDirectly(false);
  };

  // Load initial status on mount
  useEffect(() => {
    if (statusInfo) {
      addLog("info", "Status inicial carregado", {
        success: statusInfo.success,
        checked_at: statusInfo.checked_at,
      });
    }
  }, []);

  const getLogIcon = (type: DiagnosticLog["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error": return <XCircle className="h-4 w-4 text-destructive" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Terminal className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const testUrls = [
    {
      label: "Teste 1 - Formato Array JSON",
      url: `https://graph.facebook.com/v21.0/ads_archive?access_token=3739100463050486|61a14fc116103fd34bd72634761f74c3&search_terms=Nike&ad_reached_countries=["US"]&fields=id,page_name&limit=5`
    },
    {
      label: "Teste 2 - Formato String",
      url: `https://graph.facebook.com/v21.0/ads_archive?access_token=3739100463050486|61a14fc116103fd34bd72634761f74c3&search_terms=Nike&ad_reached_countries=US&fields=id,page_name&limit=5`
    }
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Diagnóstico Facebook API
            </h1>
          </div>
          <p className="text-muted-foreground">
            Painel avançado de troubleshooting para Facebook Ad Library API
          </p>
        </div>

        {/* Quick Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={isWorking ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {isLoading || isChecking ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : isWorking ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold">{isWorking ? "Funcionando" : "Com Problemas"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Server className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">HTTP Status</p>
                  <p className="text-lg font-semibold">
                    {statusInfo?.diagnostics?.ad_library_http_status || latestCheckResult?.diagnostics?.ad_library_http_status || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Bug className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Código Erro</p>
                  <p className="text-lg font-semibold">
                    {statusInfo?.error_code || latestCheckResult?.error_code || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={runDiagnostics} disabled={isRunningDiagnostics}>
            {isRunningDiagnostics ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Executar Diagnóstico Completo
          </Button>
          
          <Button variant="outline" onClick={checkStatus} disabled={isChecking}>
            {isChecking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar Status
          </Button>
          
          <Button variant="outline" onClick={testApiDirectly} disabled={isTestingDirectly}>
            {isTestingDirectly ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Testar API Diretamente
          </Button>
        </div>

        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs" className="gap-2">
              <Terminal className="h-4 w-4" />
              Logs ({logs.length})
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <FileText className="h-4 w-4" />
              Resultados ({testResults.length})
            </TabsTrigger>
            <TabsTrigger value="troubleshoot" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Troubleshooting
            </TabsTrigger>
            <TabsTrigger value="urls" className="gap-2">
              <Globe className="h-4 w-4" />
              URLs de Teste
            </TabsTrigger>
          </TabsList>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Console de Diagnóstico</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={exportLogs} disabled={logs.length === 0}>
                      <Download className="h-4 w-4 mr-1" />
                      Exportar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] rounded-lg border bg-muted/30 p-4">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Execute um diagnóstico para ver os logs aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 font-mono text-sm">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2">
                          {getLogIcon(log.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {log.timestamp.toLocaleTimeString("pt-BR")}
                              </span>
                              <span className={`${
                                log.type === "error" ? "text-destructive" :
                                log.type === "success" ? "text-green-500" :
                                log.type === "warning" ? "text-amber-500" :
                                "text-foreground"
                              }`}>
                                {log.message}
                              </span>
                            </div>
                            {log.details && (
                              <pre className="mt-1 text-xs text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Testes</CardTitle>
                <CardDescription>Últimos resultados dos testes de API</CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum teste realizado ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.success
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-destructive/30 bg-destructive/5"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {result.success ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-destructive" />
                            )}
                            <div>
                              <p className="font-medium">{result.version}</p>
                              <p className="text-sm text-muted-foreground">
                                HTTP {result.httpStatus} • {result.duration}ms
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? "OK" : `Erro ${result.errorCode || ""}`}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {result.timestamp.toLocaleTimeString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        {result.errorMessage && (
                          <p className="text-sm text-muted-foreground mt-2 pl-8">
                            {result.errorMessage}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Troubleshooting Tab */}
          <TabsContent value="troubleshoot">
            <div className="space-y-4">
              {/* Propagation Notice */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">App em Modo LIVE</h3>
                      <p className="text-sm text-muted-foreground">
                        Se você acabou de publicar o app em modo LIVE, a propagação pode levar de{" "}
                        <strong>15 a 30 minutos</strong>. Erros temporários (código 1) são esperados durante este período.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Error Codes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    Códigos de Erro e Soluções
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg">
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/30">1</Badge>
                    <div>
                      <p className="font-medium">Erro Temporário / OAuthException</p>
                      <p className="text-sm text-muted-foreground">
                        Propagação do modo LIVE ou instabilidade do Facebook. Aguarde 15-30 min.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                    <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">190</Badge>
                    <div>
                      <p className="font-medium">Token Inválido/Expirado</p>
                      <p className="text-sm text-muted-foreground">
                        Regenere o token no Facebook Developers → Graph API Explorer.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                    <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">100</Badge>
                    <div>
                      <p className="font-medium">Parâmetros Inválidos</p>
                      <p className="text-sm text-muted-foreground">
                        Verifique o formato de ad_reached_countries (deve ser array JSON).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg">
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/30">4</Badge>
                    <div>
                      <p className="font-medium">Rate Limit Excedido</p>
                      <p className="text-sm text-muted-foreground">
                        Muitas requisições. Aguarde 5-15 minutos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                    <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">200</Badge>
                    <div>
                      <p className="font-medium">Permissão Negada</p>
                      <p className="text-sm text-muted-foreground">
                        O app precisa da permissão <code>ads_read</code>. Solicite em App Review.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                    <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">270</Badge>
                    <div>
                      <p className="font-medium">App Não Aprovado</p>
                      <p className="text-sm text-muted-foreground">
                        O app não tem acesso à Ad Library API. Complete o App Review do Facebook.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle>Checklist de Configuração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Token Format</p>
                      <p className="text-sm text-muted-foreground">APP_ID|APP_SECRET configurado</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Páginas Legais</p>
                      <p className="text-sm text-muted-foreground">
                        <Link to="/termos" className="text-primary hover:underline">Termos</Link> e{" "}
                        <Link to="/privacidade" className="text-primary hover:underline">Privacidade</Link> configuradas
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="font-medium">Domínio do App</p>
                        <p className="text-sm text-muted-foreground">Adicionar nas configurações do Facebook:</p>
                      </div>
                    </div>
                    <div className="ml-8 bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                      <code className="text-sm">unucjuxitmawvmvvzxqq.supabase.co</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard("unucjuxitmawvmvvzxqq.supabase.co")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* URLs Tab */}
          <TabsContent value="urls">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  URLs de Teste Manual
                </CardTitle>
                <CardDescription>
                  Copie e teste diretamente no navegador ou use curl/Postman
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testUrls.map((test, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{test.label}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(test.url)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={test.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 overflow-x-auto">
                      <code className="text-xs break-all">{test.url}</code>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Links Úteis</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start" asChild>
                      <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Facebook Developers
                      </a>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                      <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Graph API Explorer
                      </a>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                      <a href="https://developers.facebook.com/docs/graph-api/reference/ads_archive/" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Documentação Ad Library
                      </a>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                      <a href="https://www.facebook.com/ads/library/" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Facebook Ad Library
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
