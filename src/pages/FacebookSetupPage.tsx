import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useFacebookApiStatus } from "@/hooks/useFacebookApiStatus";

export default function FacebookSetupPage() {
  const { isWorking, statusInfo, isLoading, isChecking, checkStatus } = useFacebookApiStatus();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const testUrls = [
    {
      label: "Teste 1 - Array JSON",
      url: "https://graph.facebook.com/v21.0/ads_archive?access_token=3739100463050486|61a14fc116103fd34bd72634761f74c3&search_terms=Nike&ad_reached_countries=%5B%22US%22%5D&fields=id,page_name&limit=5"
    },
    {
      label: "Teste 2 - String simples",
      url: "https://graph.facebook.com/v21.0/ads_archive?access_token=3739100463050486|61a14fc116103fd34bd72634761f74c3&search_terms=Nike&ad_reached_countries=US&fields=id,page_name&limit=5"
    },
    {
      label: "Teste 3 - Com search_page_ids",
      url: "https://graph.facebook.com/v21.0/ads_archive?access_token=3739100463050486|61a14fc116103fd34bd72634761f74c3&search_terms=Nike&ad_reached_countries=US&search_page_ids=all&fields=id,page_name&limit=5"
    }
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Configuração Facebook API
            </h1>
          </div>
          <p className="text-muted-foreground">
            Status e troubleshooting da integração com Facebook Ad Library API
          </p>
        </div>

        {/* Status Card */}
        <Card className={isWorking ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {isLoading || isChecking ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : isWorking ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              )}
              Status da API
            </CardTitle>
            <CardDescription>
              Última verificação: {statusInfo?.checked_at ? new Date(statusInfo.checked_at).toLocaleString('pt-BR') : 'Nunca'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={isWorking ? "default" : "secondary"} className={isWorking ? "bg-green-500" : "bg-amber-500"}>
                {isWorking ? "Funcionando" : "Aguardando"}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={checkStatus}
                disabled={isChecking}
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Verificar Agora
              </Button>
            </div>

            {statusInfo?.message && (
              <p className="text-sm text-muted-foreground">
                {statusInfo.message}
              </p>
            )}

            {statusInfo?.diagnostics && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token Format:</span>
                  <span>{statusInfo.diagnostics.token_format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Version:</span>
                  <span>{statusInfo.diagnostics.ad_library_version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HTTP Status:</span>
                  <span className={statusInfo.diagnostics.ad_library_http_status === 200 ? "text-green-500" : "text-amber-500"}>
                    {statusInfo.diagnostics.ad_library_http_status}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Propagation Notice */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">App em Modo LIVE (22/12/2025)</h3>
                <p className="text-sm text-muted-foreground">
                  O app Facebook foi publicado em modo LIVE hoje. A propagação pelos servidores do 
                  Facebook pode levar de <strong>15 a 30 minutos</strong>. Durante este período, 
                  erros temporários (código 1) são esperados.
                </p>
                <p className="text-sm text-muted-foreground">
                  Se o erro persistir após 30 minutos, verifique as configurações abaixo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Troubleshooting
            </CardTitle>
            <CardDescription>
              Passos para resolver problemas comuns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">1</Badge>
                <h4 className="font-medium">Verificar Modo do App</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Certifique-se que o app está em modo <strong>LIVE</strong> no Facebook Developers.
              </p>
              <div className="pl-8">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Facebook Developers
                  </a>
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">2</Badge>
                <h4 className="font-medium">Configurar Domínios do App</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Adicione o domínio do Supabase nas configurações do app:
              </p>
              <div className="pl-8 bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                <code className="text-sm">unucjuxitmawvmvvzxqq.supabase.co</code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard("unucjuxitmawvmvvzxqq.supabase.co")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">3</Badge>
                <h4 className="font-medium">Verificar Privacy Policy e Terms</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                As páginas de Termos e Privacidade devem estar configuradas:
              </p>
              <div className="pl-8 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Link to="/termos" className="text-sm text-primary hover:underline">
                    https://killaspy.online/termos
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Link to="/privacidade" className="text-sm text-primary hover:underline">
                    https://killaspy.online/privacidade
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">4</Badge>
                <h4 className="font-medium">Token de Acesso</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                O token no formato <code>APP_ID|APP_SECRET</code> está configurado corretamente.
              </p>
              <div className="pl-8 bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formato:</span>
                  <span className="text-green-500">✓ APP_ID|APP_SECRET</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamanho:</span>
                  <span>49 caracteres</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              URLs de Teste
            </CardTitle>
            <CardDescription>
              Teste estas URLs diretamente no navegador para verificar a API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testUrls.map((test, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{test.label}</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(test.url)}
                    >
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
          </CardContent>
        </Card>

        {/* Error Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Códigos de Erro Comuns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg">
                <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                  Código 1
                </Badge>
                <div>
                  <p className="font-medium text-foreground">Erro Temporário / Desconhecido</p>
                  <p className="text-sm text-muted-foreground">
                    Geralmente ocorre durante propagação do modo LIVE ou instabilidade do Facebook. 
                    Aguarde 15-30 minutos e tente novamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                  Código 190
                </Badge>
                <div>
                  <p className="font-medium text-foreground">Token Inválido</p>
                  <p className="text-sm text-muted-foreground">
                    O token de acesso expirou ou é inválido. Gere um novo token no Facebook Developers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                  Código 100
                </Badge>
                <div>
                  <p className="font-medium text-foreground">Parâmetros Inválidos</p>
                  <p className="text-sm text-muted-foreground">
                    Um ou mais parâmetros da requisição estão incorretos. Verifique o formato dos campos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                  Código 4
                </Badge>
                <div>
                  <p className="font-medium text-foreground">Rate Limit Excedido</p>
                  <p className="text-sm text-muted-foreground">
                    Muitas requisições em pouco tempo. Aguarde alguns minutos antes de tentar novamente.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Links Úteis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start" asChild>
                <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Facebook Developers
                </a>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <a href="https://developers.facebook.com/docs/graph-api/reference/ads_archive/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Documentação Ad Library API
                </a>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <a href="https://www.facebook.com/ads/library/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Facebook Ad Library
                </a>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/scraping">
                  <Key className="h-4 w-4 mr-2" />
                  Scraping Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}