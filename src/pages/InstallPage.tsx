import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff, 
  Zap, 
  Shield, 
  Bell, 
  CheckCircle,
  Share,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InstallPage() {
  const navigate = useNavigate();
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

  const handleInstall = async () => {
    if (canPrompt) {
      const result = await promptInstall();
      if (result === 'accepted') {
        navigate('/');
      }
    }
  };

  const iosInstructions = getIOSInstallInstructions();

  const features = [
    {
      icon: Zap,
      title: 'Acesso Instantâneo',
      description: 'Abra o app direto da sua tela inicial, como um app nativo'
    },
    {
      icon: WifiOff,
      title: 'Funciona Offline',
      description: 'Acesse dados em cache mesmo sem conexão com a internet'
    },
    {
      icon: Bell,
      title: 'Notificações',
      description: 'Receba alertas de novos anúncios e atividades importantes'
    },
    {
      icon: Shield,
      title: 'Seguro',
      description: 'Dados protegidos com criptografia de ponta a ponta'
    }
  ];

  if (isInstalled || isStandalone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle>App Instalado!</CardTitle>
            <CardDescription>
              O KillaSpy já está instalado no seu dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Ir para o Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
            {platform === 'ios' || platform === 'android' ? (
              <Smartphone className="h-10 w-10 text-primary-foreground" />
            ) : (
              <Monitor className="h-10 w-10 text-primary-foreground" />
            )}
          </div>
          
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Instale o KillaSpy
          </h1>
          <p className="mx-auto mb-8 max-w-md text-muted-foreground">
            Tenha acesso rápido à plataforma de inteligência de anúncios mais poderosa do mercado
          </p>

          {/* Features Grid */}
          <div className="mx-auto mb-12 grid max-w-2xl grid-cols-2 gap-4 text-left sm:grid-cols-4">
            {features.map((feature, index) => (
              <div key={index} className="rounded-lg bg-card/50 p-4">
                <feature.icon className="mb-2 h-6 w-6 text-primary" />
                <h3 className="text-sm font-medium">{feature.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Installation Instructions */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-md">
          {isIOS ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Instalação no Safari
                </CardTitle>
                <CardDescription>
                  Siga os passos abaixo para adicionar à tela inicial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {iosInstructions.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-medium">{step}</p>
                      {index === 0 && (
                        <div className="mt-3 flex items-center gap-3 rounded-lg bg-muted p-3">
                          <Share className="h-8 w-8 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            Procure este ícone na barra inferior do Safari
                          </span>
                        </div>
                      )}
                      {index === 1 && (
                        <div className="mt-3 flex items-center gap-3 rounded-lg bg-muted p-3">
                          <div className="flex items-center gap-2">
                            <Plus className="h-6 w-6 rounded border border-primary text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Role para baixo no menu até encontrar esta opção
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : isInstallable && canPrompt ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Pronto para Instalar</CardTitle>
                <CardDescription>
                  Clique no botão abaixo para adicionar o KillaSpy ao seu dispositivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Instalar KillaSpy
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Instalação Disponível</CardTitle>
                <CardDescription>
                  Use o menu do seu navegador para instalar o app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Chrome/Edge:</p>
                  <p>Clique nos 3 pontos (⋮) → "Instalar aplicativo"</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Firefox:</p>
                  <p>Clique no ícone de casa na barra de endereço</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Back to App */}
          <div className="mt-8 text-center">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Continuar no navegador
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
