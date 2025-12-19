import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscription: PushSubscription | null;
  isLoading: boolean;
  error: string | null;
}

// VAPID public key would come from environment/backend
// This is a placeholder - actual key should be generated and stored securely
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'unsupported',
    subscription: null,
    isLoading: true,
    error: null
  });

  // Check support and current state
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'Notification' in window && 
                          'serviceWorker' in navigator && 
                          'PushManager' in window;

      if (!isSupported) {
        setState({
          isSupported: false,
          permission: 'unsupported',
          subscription: null,
          isLoading: false,
          error: null
        });
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setState({
          isSupported: true,
          permission: Notification.permission,
          subscription,
          isLoading: false,
          error: null
        });
      } catch (error) {
        setState({
          isSupported: true,
          permission: Notification.permission,
          subscription: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    checkSupport();
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!state.isSupported) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission;
    } catch (error) {
      console.error('[PushNotifications] Permission request failed:', error);
      return 'denied';
    }
  }, [state.isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!state.isSupported) {
      console.warn('[PushNotifications] Push not supported');
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // First ensure we have permission
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await requestPermission();
      }

      if (permission !== 'granted') {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Permissão de notificação negada' 
        }));
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        // Save subscription to backend (would typically send to your server)
        console.log('[PushNotifications] New subscription:', subscription);
        
        // In a real implementation, you'd save this to your backend:
        // await supabase.from('push_subscriptions').insert({
        //   endpoint: subscription.endpoint,
        //   keys: JSON.stringify(subscription.toJSON())
        // });
      }

      setState(prev => ({
        ...prev,
        subscription,
        isLoading: false,
        error: null
      }));

      return subscription;
    } catch (error) {
      console.error('[PushNotifications] Subscribe failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Falha ao subscrever'
      }));
      return null;
    }
  }, [state.isSupported, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) {
      return true;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await state.subscription.unsubscribe();
      
      // Remove from backend
      // await supabase.from('push_subscriptions')
      //   .delete()
      //   .eq('endpoint', state.subscription.endpoint);

      setState(prev => ({
        ...prev,
        subscription: null,
        isLoading: false,
        error: null
      }));

      return true;
    } catch (error) {
      console.error('[PushNotifications] Unsubscribe failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Falha ao cancelar'
      }));
      return false;
    }
  }, [state.subscription]);

  // Show a local notification (for testing)
  const showLocalNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ): Promise<boolean> => {
    if (Notification.permission !== 'granted') {
      console.warn('[PushNotifications] No permission for notifications');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/pwa-icons/icon-192x192.png',
        badge: '/pwa-icons/icon-72x72.png',
        tag: 'killaspy-notification',
        ...options
      });
      return true;
    } catch (error) {
      console.error('[PushNotifications] Show notification failed:', error);
      return false;
    }
  }, []);

  return {
    ...state,
    isSubscribed: !!state.subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification
  };
}
