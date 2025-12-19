import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNetworkStatus, useStandaloneMode } from '@/hooks/useNetworkStatus';
import { 
  CheckCircle, 
  XCircle, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff,
  Download,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
}

export default function PWATestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isStandalone,
    platform,
    canPrompt 
  } = usePWAInstall();
  
  const { isOnline, effectiveType, downlink, rtt } = useNetworkStatus();
  const standaloneMode = useStandaloneMode();

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Service Worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        results.push({
          name: 'Service Worker',
          status: 'pass',
          message: `Registrado e ativo (scope: ${registration.scope})`
        });
      } else {
        results.push({
          name: 'Service Worker',
          status: 'warning',
          message: 'Suportado mas não registrado ainda'
        });
      }
    } else {
      results.push({
        name: 'Service Worker',
        status: 'fail',
        message: 'Não suportado neste navegador'
      });
    }

    // Test 2: Web App Manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      try {
        const response = await fetch((manifestLink as HTMLLinkElement).href);
        if (response.ok) {
          const manifest = await response.json();
          results.push({
            name: 'Web App Manifest',
            status: 'pass',
            message: `Carregado: "${manifest.name}" com ${manifest.icons?.length || 0} ícones`
          });
        } else {
          results.push({
            name: 'Web App Manifest',
            status: 'fail',
            message: `Erro ao carregar: ${response.status}`
          });
        }
      } catch (e) {
        results.push({
          name: 'Web App Manifest',
          status: 'fail',
          message: 'Erro ao fazer parse do manifest'
        });
      }
    } else {
      results.push({
        name: 'Web App Manifest',
        status: 'fail',
        message: 'Link do manifest não encontrado no HTML'
      });
    }

    // Test 3: HTTPS
    results.push({
      name: 'HTTPS',
      status: location.protocol === 'https:' ? 'pass' : 'warning',
      message: location.protocol === 'https:' 
        ? 'Conexão segura ativa' 
        : 'HTTP detectado (PWA requer HTTPS em produção)'
    });

    // Test 4: Installability
    if (isInstalled || standaloneMode) {
      results.push({
        name: 'Instalação',
        status: 'pass',
        message: 'App já está instalado e rodando em modo standalone'
      });
    } else if (canPrompt) {
      results.push({
        name: 'Instalação',
        status: 'pass',
        message: 'App pode ser instalado (prompt disponível)'
      });
    } else if (isIOS) {
      results.push({
        name: 'Instalação',
        status: 'info',
        message: 'iOS detectado - instalação manual via Safari necessária'
      });
    } else {
      results.push({
        name: 'Instalação',
        status: 'warning',
        message: 'Prompt de instalação não disponível ainda'
      });
    }

    // Test 5: Offline Support
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      if (cacheNames.length > 0) {
        results.push({
          name: 'Cache Offline',
          status: 'pass',
          message: `${cacheNames.length} cache(s) ativo(s): ${cacheNames.join(', ')}`
        });
      } else {
        results.push({
          name: 'Cache Offline',
          status: 'warning',
          message: 'Cache API disponível mas vazio'
        });
      }
    } else {
      results.push({
        name: 'Cache Offline',
        status: 'fail',
        message: 'Cache API não suportada'
      });
    }

    // Test 6: Push Notifications
    if ('Notification' in window) {
      results.push({
        name: 'Notificações',
        status: Notification.permission === 'granted' ? 'pass' : 'info',
        message: `Permissão: ${Notification.permission}`
      });
    } else {
      results.push({
        name: 'Notificações',
        status: 'warning',
        message: 'API de notificações não suportada'
      });
    }

    // Test 7: Display Mode
    const displayModes = ['standalone', 'fullscreen', 'minimal-ui', 'browser'];
    let currentMode = 'browser';
    for (const mode of displayModes) {
      if (window.matchMedia(`(display-mode: ${mode})`).matches) {
        currentMode = mode;
        break;
      }
    }
    results.push({
      name: 'Modo de Exibição',
      status: currentMode === 'standalone' ? 'pass' : 'info',
      message: `Atual: ${currentMode}`
    });

    // Test 8: Theme Color
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    results.push({
      name: 'Theme Color',
      status: themeColorMeta ? 'pass' : 'warning',
      message: themeColorMeta 
        ? `Definido: ${(themeColorMeta as HTMLMetaElement).content}` 
        : 'Meta tag theme-color não encontrada'
    });

    // Test 9: Apple Meta Tags
    const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    results.push({
      name: 'iOS Meta Tags',
      status: appleMeta ? 'pass' : 'warning',
      message: appleMeta 
        ? 'Meta tags Apple configuradas' 
        : 'Meta tags para iOS ausentes'
    });

    // Test 10: Icons
    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    const favicon = document.querySelector('link[rel="icon"]');
    results.push({
      name: 'Ícones',
      status: appleIcon && favicon ? 'pass' : 'warning',
      message: `Favicon: ${favicon ? '✓' : '✗'}, Apple Touch Icon: ${appleIcon ? '✓' : '✗'}`
    });

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary',
      info: 'outline'
    };
    const labels = { pass: 'OK', fail: 'Falha', warning: 'Aviso', info: 'Info' };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Teste do PWA</h1>
          <p className="text-muted-foreground">
            Validação completa das funcionalidades Progressive Web App
          </p>
        </div>

        <Tabs defaultValue="tests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tests">Testes</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="guide">Guia</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Diagnóstico PWA
                  <Button onClick={runTests} disabled={isRunning}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                    {isRunning ? 'Testando...' : 'Executar Testes'}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Clique para verificar todos os requisitos do PWA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Clique em "Executar Testes" para iniciar o diagnóstico
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <p className="font-medium">{result.name}</p>
                            <p className="text-sm text-muted-foreground">{result.message}</p>
                          </div>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {platform === 'ios' || platform === 'android' ? (
                      <Smartphone className="h-5 w-5" />
                    ) : (
                      <Monitor className="h-5 w-5" />
                    )}
                    Dispositivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plataforma</span>
                    <Badge>{platform}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">iOS</span>
                    <Badge variant={isIOS ? 'default' : 'outline'}>{isIOS ? 'Sim' : 'Não'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Standalone</span>
                    <Badge variant={standaloneMode ? 'default' : 'outline'}>
                      {standaloneMode ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instalado</span>
                    <Badge variant={isInstalled ? 'default' : 'outline'}>
                      {isInstalled ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                    Rede
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={isOnline ? 'default' : 'destructive'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <Badge variant="outline">{effectiveType}</Badge>
                  </div>
                  {downlink && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Velocidade</span>
                      <span>{downlink} Mbps</span>
                    </div>
                  )}
                  {rtt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latência</span>
                      <span>{rtt} ms</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Instalação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 md:grid-cols-3">
                    <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                      <span>Instalável</span>
                      <Badge variant={isInstallable ? 'default' : 'outline'}>
                        {isInstallable ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                      <span>Prompt Disponível</span>
                      <Badge variant={canPrompt ? 'default' : 'outline'}>
                        {canPrompt ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                      <span>Instalado</span>
                      <Badge variant={isInstalled ? 'default' : 'outline'}>
                        {isInstalled ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Guia de Teste Manual</CardTitle>
                <CardDescription>
                  Siga estes passos para validar o PWA em diferentes dispositivos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> Android (Chrome)
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Acesse o app no Chrome</li>
                    <li>Aguarde o banner de instalação ou toque nos 3 pontos (⋮)</li>
                    <li>Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</li>
                    <li>Confirme a instalação</li>
                    <li>Abra o app pela tela inicial e verifique se abre em tela cheia</li>
                    <li>Desligue o WiFi e verifique se o app carrega offline</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> iOS (Safari)
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Acesse o app no Safari (não funciona em outros navegadores)</li>
                    <li>Toque no botão de compartilhar (ícone com seta para cima)</li>
                    <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                    <li>Confirme o nome e toque em "Adicionar"</li>
                    <li>Abra o app pela tela inicial</li>
                    <li>Verifique se abre sem barra de navegação do Safari</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Monitor className="h-4 w-4" /> Desktop (Chrome/Edge)
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Acesse o app no navegador</li>
                    <li>Procure o ícone de instalação na barra de endereço</li>
                    <li>Ou clique nos 3 pontos → "Instalar [Nome do App]"</li>
                    <li>Confirme a instalação</li>
                    <li>Verifique se o app abre em janela própria</li>
                    <li>Teste o funcionamento offline</li>
                  </ol>
                </div>

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <h4 className="font-semibold text-yellow-500 mb-2">Checklist de Validação</h4>
                  <ul className="space-y-1 text-sm">
                    <li>✓ Ícone aparece corretamente na tela inicial</li>
                    <li>✓ Splash screen exibe ao abrir (iOS)</li>
                    <li>✓ App abre em modo standalone (sem barra do navegador)</li>
                    <li>✓ Theme color aparece na barra de status</li>
                    <li>✓ App carrega em modo offline</li>
                    <li>✓ Indicador de offline aparece quando desconectado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
