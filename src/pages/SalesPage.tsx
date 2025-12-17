import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Eye, 
  Target, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Globe, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock
} from "lucide-react";

export default function SalesPage() {
  const features = [
    {
      icon: Eye,
      title: "Espionagem de Anúncios",
      description: "Monitore todos os anúncios dos seus concorrentes no Facebook Ads Library em tempo real."
    },
    {
      icon: Shield,
      title: "Detecção de Cloaking",
      description: "Identifique ofertas ocultas e páginas de vendas reais que concorrentes tentam esconder."
    },
    {
      icon: TrendingUp,
      title: "Análise de Tendências",
      description: "Descubra nichos em crescimento e oportunidades antes da concorrência."
    },
    {
      icon: Target,
      title: "Winning Ads",
      description: "Identifique automaticamente os anúncios vencedores com maior longevidade e engajamento."
    },
    {
      icon: Zap,
      title: "IA para Copy",
      description: "Gere copies otimizados baseados nos padrões de sucesso dos melhores anúncios."
    },
    {
      icon: BarChart3,
      title: "Dashboard Inteligente",
      description: "Visualize métricas de mercado, distribuição de riscos e velocidade de anúncios."
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "R$ 297",
      period: "/mês",
      description: "Para quem está começando",
      features: [
        "Até 5.000 anúncios monitorados",
        "3 categorias de busca",
        "Alertas básicos",
        "Suporte por email"
      ],
      highlighted: false
    },
    {
      name: "Professional",
      price: "R$ 697",
      period: "/mês",
      description: "Para profissionais de marketing",
      features: [
        "Até 50.000 anúncios monitorados",
        "Categorias ilimitadas",
        "Detecção de cloaking",
        "Análise de copy com IA",
        "Alertas em tempo real",
        "Suporte prioritário"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "R$ 1.497",
      period: "/mês",
      description: "Para agências e grandes operações",
      features: [
        "Anúncios ilimitados",
        "API de integração",
        "Security Audits completos",
        "Relatórios personalizados",
        "Onboarding dedicado",
        "Suporte 24/7"
      ],
      highlighted: false
    }
  ];

  const testimonials = [
    {
      name: "Carlos M.",
      role: "Media Buyer",
      content: "Com o KillaSpy, consegui identificar uma oferta que estava convertendo muito bem e adaptei para meu nicho. ROI de 340% no primeiro mês."
    },
    {
      name: "Amanda S.",
      role: "Gestora de Tráfego",
      content: "A detecção de cloaking é absurda. Descobri ofertas que meus concorrentes escondiam há meses. Mudou completamente minha estratégia."
    },
    {
      name: "Roberto L.",
      role: "Dono de Agência",
      content: "Usamos o KillaSpy para todos os nossos clientes. A análise de winning ads economiza horas de pesquisa manual."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">KillaSpy</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacidade" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacidade
            </Link>
            <Link to="/termos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Termos
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Começar Agora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              Inteligência Competitiva para Anunciantes
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Descubra as Ofertas que Seus 
              <span className="text-primary"> Concorrentes Escondem</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Monitore anúncios do Facebook, detecte cloaking, identifique winning ads e 
              domine seu mercado com inteligência de dados em tempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Teste Grátis por 7 Dias
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Ver Demonstração
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              <Lock className="w-3 h-3 inline mr-1" />
              Sem cartão de crédito • Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que Você Precisa para Dominar o Mercado
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais de inteligência competitiva em uma única plataforma.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 bg-card hover:bg-card/80 transition-colors border-border/50">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como Funciona
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Configure suas Categorias</h3>
              <p className="text-sm text-muted-foreground">
                Defina os nichos e palavras-chave que deseja monitorar.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Colete Automaticamente</h3>
              <p className="text-sm text-muted-foreground">
                Nossa IA coleta e analisa milhares de anúncios diariamente.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Descubra Oportunidades</h3>
              <p className="text-sm text-muted-foreground">
                Identifique winning ads, ofertas ocultas e tendências de mercado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos que Cabem no Seu Bolso
            </h2>
            <p className="text-muted-foreground">
              Escolha o plano ideal para o tamanho da sua operação.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`p-6 relative ${plan.highlighted ? 'border-primary bg-primary/5 scale-105' : 'border-border/50'}`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Mais Popular
                  </Badge>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block">
                  <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                    Começar Agora
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O que Nossos Clientes Dizem
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 border-border/50">
                <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pronto para Dominar Seu Mercado?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Junte-se a centenas de profissionais que já usam o KillaSpy para 
            descobrir oportunidades e escalar suas campanhas.
          </p>
          <Link to="/auth">
            <Button size="lg">
              Começar Teste Grátis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Eye className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">KillaSpy</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacidade" className="hover:text-foreground transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
              <span>© 2025 KillaSpy. Todos os direitos reservados.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
