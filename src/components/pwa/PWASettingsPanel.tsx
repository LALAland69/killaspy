import { useState, useEffect } from 'react';
import { 
  Download, 
  Bell, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Check,
  X,
  Smartphone,
  Monitor,
  Loader2,
  HardDrive
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNetworkStatus, useStandaloneMode } from '@/hooks/useNetworkStatus';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { getOfflineStats } from '@/lib/offlineDb';
import { toast } from 'sonner';

interface OfflineStats {
  syncQueueSize: number;
  cachedItems: number;
  offlineAds: number;
}

export function PWASettingsPanel() {
  const { isInstallable, isInstalled, platform, promptInstall } = usePWAInstall();
  const { isOnline, effectiveType, saveData } = useNetworkStatus();
  const isStandalone = useStandaloneMode();
  const { pendingItems, syncNow, isSyncing } = useBackgroundSync();
  const { 
    isSupported: pushSupported, 
    permission: pushPermission,
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading: pushLoading,
    showLocalNotification
  } = usePushNotifications();

  const [offlineStats, setOfflineStats] = useState<OfflineStats | null>(null);
  const [isInstallingApp, setIsInstallingApp] = useState(false);

  // Load offline stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getOfflineStats();
        setOfflineStats(stats);
      } catch (error) {
        console.error('Failed to load offline stats:', error);
      }
    };
    
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    setIsInstallingApp(true);
    const result = await promptInstall();
    setIsInstallingApp(false);
    
    if (result === 'accepted') {
      toast.success('App instalado com sucesso!');
    }
  };

  const handleTogglePush = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) toast.info('Notificações desativadas');
    } else {
      const subscription = await subscribe();
      if (subscription) {
        toast.success('Notificações ativadas!');
        // Test notification
        await showLocalNotification('Notificações Ativas', {
          body: 'Você receberá alertas sobre novos anúncios e divergências.',
        });
      }
    }
  };

  const handleTestNotification = async () => {
    const success = await showLocalNotification('Teste de Notificação', {
      body: 'Esta é uma notificação de teste do KillaSpy.',
      data: { type: 'test' }
    });
    
    if (!success) {
      toast.error('Falha ao enviar notificação');
    }
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'ios':
      case 'android':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Instalação do App
          </CardTitle>
          <CardDescription>
            Instale o KillaSpy como um aplicativo nativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPlatformIcon()}
              <div>
                <p className="text-sm font-medium capitalize">{platform}</p>
                <p className="text-xs text-muted-foreground">
                  {isStandalone ? 'Executando como app' : 'Executando no navegador'}
                </p>
              </div>
            </div>
            
            {isInstalled || isStandalone ? (
              <Badge variant="default" className="gap-1">
                <Check className="h-3 w-3" />
                Instalado
              </Badge>
            ) : isInstallable ? (
              <Button 
                size="sm" 
                onClick={handleInstall}
                disabled={isInstallingApp}
              >
                {isInstallingApp ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Instalar App
              </Button>
            ) : (
              <Badge variant="outline">Não disponível</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-primary" />
            ) : (
              <WifiOff className="h-5 w-5 text-destructive" />
            )}
            Status de Rede
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Conexão</span>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {effectiveType && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Tipo de Conexão</span>
              <Badge variant="outline">{effectiveType.toUpperCase()}</Badge>
            </div>
          )}

          {saveData && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Economia de Dados</span>
              <Badge variant="secondary">Ativo</Badge>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Itens Pendentes</span>
              <span className="text-sm font-medium">{pendingItems}</span>
            </div>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => syncNow()}
              disabled={!isOnline || isSyncing || pendingItems === 0}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sincronizar Agora
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Receba alertas em tempo real sobre novos anúncios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pushSupported ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Ativar Notificações</p>
                  <p className="text-xs text-muted-foreground">
                    {pushPermission === 'denied' 
                      ? 'Permissão negada no navegador'
                      : 'Alertas sobre novos ads e divergências'
                    }
                  </p>
                </div>
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handleTogglePush}
                  disabled={pushLoading || pushPermission === 'denied'}
                />
              </div>

              {isSubscribed && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleTestNotification}
                >
                  Enviar Notificação de Teste
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Notificações push não são suportadas neste navegador.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Offline Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Armazenamento Offline
          </CardTitle>
          <CardDescription>
            Dados armazenados localmente para acesso offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {offlineStats ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Anúncios em Cache</span>
                  <span className="font-medium">{offlineStats.offlineAds}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Itens em Cache</span>
                  <span className="font-medium">{offlineStats.cachedItems}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Fila de Sync</span>
                  <span className="font-medium">{offlineStats.syncQueueSize}</span>
                </div>
              </div>

              <Separator />

              <p className="text-xs text-muted-foreground">
                Os dados são sincronizados automaticamente quando você está online.
                O cache expira após um período configurável.
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
