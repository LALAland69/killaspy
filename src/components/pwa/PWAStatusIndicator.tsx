import { useState } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Bell, 
  BellOff,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

export function PWAStatusIndicator() {
  const { isOnline, effectiveType } = useNetworkStatus();
  const { pendingItems, isSyncing, syncNow, lastSyncAt } = useBackgroundSync();
  const { 
    isSupported: pushSupported, 
    permission: pushPermission,
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading: pushLoading
  } = usePushNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleSync = async () => {
    await syncNow();
  };

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  // Determine status color
  const getStatusColor = () => {
    if (!isOnline) return 'text-destructive';
    if (pendingItems > 0) return 'text-warning';
    return 'text-primary';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative h-9 w-9", getStatusColor())}
        >
          {isOnline ? (
            <Cloud className="h-4 w-4" />
          ) : (
            <CloudOff className="h-4 w-4" />
          )}
          {pendingItems > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-warning text-warning-foreground"
            >
              {pendingItems > 9 ? '9+' : pendingItems}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Cloud className="h-4 w-4 text-primary" />
              ) : (
                <CloudOff className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {isOnline && effectiveType && (
              <Badge variant="outline" className="text-xs">
                {effectiveType.toUpperCase()}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Sync Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sincronização</span>
              {pendingItems > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {pendingItems} pendente(s)
                </Badge>
              )}
            </div>
            
            {lastSyncAt && (
              <p className="text-xs text-muted-foreground">
                Última sync: {lastSyncAt.toLocaleTimeString()}
              </p>
            )}

            <Button 
              size="sm" 
              variant="outline" 
              className="w-full gap-2"
              onClick={handleSync}
              disabled={!isOnline || isSyncing || pendingItems === 0}
            >
              {isSyncing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
          </div>

          <Separator />

          {/* Push Notifications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSubscribed ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Notificações Push</span>
              </div>
              
              {pushSupported ? (
                <Switch 
                  checked={isSubscribed}
                  onCheckedChange={handleTogglePush}
                  disabled={pushLoading || pushPermission === 'denied'}
                />
              ) : (
                <Badge variant="outline" className="text-xs">
                  Não suportado
                </Badge>
              )}
            </div>

            {pushPermission === 'denied' && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Permissão negada no navegador
              </p>
            )}

            {isSubscribed && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                Você receberá alertas em tempo real
              </p>
            )}
          </div>

          {/* Offline Mode Info */}
          {!isOnline && (
            <>
              <Separator />
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Modo offline ativo.</strong> Suas alterações serão 
                  sincronizadas automaticamente quando a conexão for restaurada.
                </p>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
