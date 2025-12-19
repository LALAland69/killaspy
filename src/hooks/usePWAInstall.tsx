import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isStandalone: false,
    platform: 'unknown'
  });

  // Detect platform
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    let platform: PWAInstallState['platform'] = 'desktop';
    if (isIOS) platform = 'ios';
    else if (isAndroid) platform = 'android';

    setInstallState(prev => ({
      ...prev,
      isIOS,
      isStandalone,
      isInstalled: isStandalone,
      platform
    }));
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallState(prev => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallState(prev => ({ 
        ...prev, 
        isInstallable: false,
        isInstalled: true 
      }));
      // Track install
      console.log('[PWA] App installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger install prompt
  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) {
      return 'unavailable';
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setInstallState(prev => ({ 
          ...prev, 
          isInstallable: false,
          isInstalled: true 
        }));
      }
      
      return outcome;
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return 'unavailable';
    }
  }, [deferredPrompt]);

  // Get iOS install instructions
  const getIOSInstallInstructions = useCallback(() => {
    return {
      steps: [
        'Toque no botão de compartilhar (ícone com seta para cima)',
        'Role para baixo e toque em "Adicionar à Tela Início"',
        'Toque em "Adicionar" para confirmar'
      ],
      icon: 'share' as const
    };
  }, []);

  return {
    ...installState,
    promptInstall,
    getIOSInstallInstructions,
    canPrompt: !!deferredPrompt
  };
}
