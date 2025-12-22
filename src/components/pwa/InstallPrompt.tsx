import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X, Share, Plus, Smartphone, Monitor, CheckCircle } from 'lucide-react';

interface InstallPromptProps {
  /**
   * Delay in milliseconds before showing the prompt
   * @default 10000 (10 seconds - reduced for better conversion)
   */
  showDelay?: number;
  /**
   * Minimum number of page views before showing
   * @default 2
   */
  minPageViews?: number;
}

export function InstallPrompt({ showDelay = 10000, minPageViews = 2 }: InstallPromptProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSDialog, setShowIOSDialog] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isStandalone,
    platform,
    promptInstall, 
    canPrompt,
    getIOSInstallInstructions 
  } = usePWAInstall();

  // Check if user has dismissed before
  useEffect(() => {
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
  }, []);

  // Show banner after delay and page views
  useEffect(() => {
    if (isInstalled || isStandalone || dismissed) return;

    // Track page views
    const currentViews = parseInt(sessionStorage.getItem('pwa-page-views') || '0', 10);
    sessionStorage.setItem('pwa-page-views', String(currentViews + 1));

    if (currentViews + 1 < minPageViews) return;

    // Show after delay
    const timer = setTimeout(() => {
      if (isInstallable || isIOS) {
        setShowBanner(true);
      }
    }, showDelay);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isStandalone, isIOS, dismissed, showDelay, minPageViews]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSDialog(true);
      setShowBanner(false);
    } else if (canPrompt) {
      const result = await promptInstall();
      if (result === 'accepted') {
        setShowBanner(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  };

  const iosInstructions = getIOSInstallInstructions();

  // Don't render if already installed
  if (isInstalled || isStandalone) return null;

  return (
    <>
      {/* Install Banner - com animação melhorada */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in md:left-auto md:right-4 md:w-96">
          <Card className="border-primary/20 bg-card/95 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {platform === 'ios' || platform === 'android' ? (
                      <Smartphone className="h-10 w-10 text-primary animate-pulse" />
                    ) : (
                      <Monitor className="h-10 w-10 text-primary animate-pulse" />
                    )}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Instalar KillaSpy</CardTitle>
                    <CardDescription className="text-xs">
                      Acesso instantâneo da sua tela inicial
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-destructive/10"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-3">
                {/* Benefícios destacados */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span>Funciona offline</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span>Carrega mais rápido</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span>Notificações push</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span>Atualiza sozinho</span>
                  </div>
                </div>
                <Button onClick={handleInstall} className="w-full group" size="sm">
                  <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                  Instalar Agora - É Grátis!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* iOS Installation Dialog */}
      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Instalar no iPhone/iPad
            </DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para adicionar o KillaSpy à sua tela inicial
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {iosInstructions.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{step}</p>
                  {index === 0 && (
                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                      <Share className="h-5 w-5" />
                      <span className="text-xs">Este ícone na barra do Safari</span>
                    </div>
                  )}
                  {index === 1 && (
                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                      <Plus className="h-5 w-5 rounded border" />
                      <span className="text-xs">Adicionar à Tela de Início</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowIOSDialog(false)}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
