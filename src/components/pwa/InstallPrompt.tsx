import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X, Share, Plus, Smartphone, Monitor, CheckCircle } from 'lucide-react';

interface InstallPromptProps {
  /**
   * Delay in milliseconds before showing the prompt
   * @default 30000 (30 seconds)
   */
  showDelay?: number;
  /**
   * Minimum number of page views before showing
   * @default 2
   */
  minPageViews?: number;
}

export function InstallPrompt({ showDelay = 30000, minPageViews = 2 }: InstallPromptProps) {
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
      {/* Install Banner */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 md:left-auto md:right-4 md:w-96">
          <Card className="border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {platform === 'ios' || platform === 'android' ? (
                    <Smartphone className="h-8 w-8 text-primary" />
                  ) : (
                    <Monitor className="h-8 w-8 text-primary" />
                  )}
                  <div>
                    <CardTitle className="text-base">Instalar KillaSpy</CardTitle>
                    <CardDescription className="text-xs">
                      Acesso rápido direto da sua tela inicial
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Funciona offline</span>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Atualizações automáticas</span>
                </div>
                <Button onClick={handleInstall} className="w-full" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Instalar Agora
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
