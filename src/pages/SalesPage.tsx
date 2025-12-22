import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { SEOHead, organizationJsonLd } from "@/components/seo/SEOHead";
import { 
  Eye, 
  Target, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Play,
  Code,
  Globe,
  Rocket,
  Users,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// SEO configuration
const seoConfig = {
  title: "KillaSpy - Espione Anúncios do Facebook Ads e Descubra Estratégias Vencedoras",
  description: "Plataforma de inteligência competitiva para análise de anúncios. Monitore concorrentes, detecte winning ads e descubra estratégias de marketing digital.",
  canonicalUrl: "https://killaspy.online/pagina-de-vendas",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "KillaSpy",
  "url": "https://killaspy.online",
  "description": seoConfig.description,
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://killaspy.online/ads?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "KillaSpy",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "297",
    "highPrice": "1497",
    "priceCurrency": "BRL",
    "offerCount": "3"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "127"
  }
};

const combinedJsonLd = {
  "@context": "https://schema.org",
  "@graph": [organizationJsonLd, websiteJsonLd, productJsonLd]
};

// Hook para detectar quando elemento está visível na viewport
function useInView(threshold = 0.1) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Componente de animação de partículas para o hero
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  );
}

export default function SalesPage() {
  const heroRef = useInView();
  const featuresRef = useInView();
  const apiRef = useInView();
  const pricingRef = useInView();
  const testimonialsRef = useInView();
  
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: Eye,
      title: "Espionagem de Anúncios",
      description: "Monitore todos os anúncios dos seus concorrentes no Facebook Ads Library em tempo real.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Detecção de Cloaking",
      description: "Identifique ofertas ocultas e páginas de vendas reais que concorrentes tentam esconder.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: TrendingUp,
      title: "Análise de Tendências",
      description: "Descubra nichos em crescimento e oportunidades antes da concorrência.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Target,
      title: "Winning Ads Detection",
      description: "Identifique automaticamente os anúncios vencedores com maior longevidade e engajamento.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Zap,
      title: "IA para Copywriting",
      description: "Gere copies otimizados baseados nos padrões de sucesso dos melhores anúncios.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: BarChart3,
      title: "Dashboard Inteligente",
      description: "Visualize métricas de mercado, distribuição de riscos e velocidade de anúncios.",
      gradient: "from-indigo-500 to-purple-500"
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
      highlighted: false,
      cta: "Começar Grátis"
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
      highlighted: true,
      cta: "Mais Popular"
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
      highlighted: false,
      cta: "Falar com Vendas"
    }
  ];

  const testimonials = [
    {
      name: "Carlos M.",
      role: "Media Buyer",
      company: "Scale Agency",
      content: "Com o KillaSpy, consegui identificar uma oferta que estava convertendo muito bem e adaptei para meu nicho. ROI de 340% no primeiro mês.",
      avatar: "CM"
    },
    {
      name: "Amanda S.",
      role: "Gestora de Tráfego",
      company: "Digital First",
      content: "A detecção de cloaking é absurda. Descobri ofertas que meus concorrentes escondiam há meses. Mudou completamente minha estratégia.",
      avatar: "AS"
    },
    {
      name: "Roberto L.",
      role: "Dono de Agência",
      company: "Performance Lab",
      content: "Usamos o KillaSpy para todos os nossos clientes. A análise de winning ads economiza horas de pesquisa manual.",
      avatar: "RL"
    }
  ];

  const faqs = [
    {
      question: "Como funciona o período de teste?",
      answer: "Você tem 7 dias grátis para testar todas as funcionalidades. Sem necessidade de cartão de crédito. Se não gostar, é só cancelar."
    },
    {
      question: "Os dados são atualizados em tempo real?",
      answer: "Sim! Nossa plataforma sincroniza com a Facebook Ads Library a cada hora, garantindo que você tenha sempre os dados mais recentes."
    },
    {
      question: "Posso usar a API para integrações?",
      answer: "Sim, no plano Enterprise você tem acesso completo à nossa API REST para integrar com suas ferramentas e automações."
    },
    {
      question: "Vocês oferecem suporte em português?",
      answer: "Sim! Todo nosso suporte é em português brasileiro, com atendimento de segunda a sexta das 9h às 18h."
    }
  ];

  const metrics = [
    { value: "50M+", label: "Anúncios Analisados", icon: Eye },
    { value: "2.5K+", label: "Clientes Ativos", icon: Users },
    { value: "99.9%", label: "Uptime Garantido", icon: Clock },
    { value: "340%", label: "ROI Médio", icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title={seoConfig.title}
        description={seoConfig.description}
        canonicalUrl={seoConfig.canonicalUrl}
        jsonLd={combinedJsonLd}
      />
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-110">
              <Eye className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">KillaSpy</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/privacidade" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block">
              Privacidade
            </Link>
            <Link to="/termos" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block">
              Termos
            </Link>
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="group">
                Começar Agora
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - com animações premium */}
      <section className="py-20 md:py-32 relative overflow-hidden" ref={heroRef.ref}>
        <ParticleBackground />
        <div className="container mx-auto px-4 relative">
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${heroRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="secondary" className="mb-6 animate-fade-in">
              <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
              Inteligência Competitiva para Anunciantes
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Descubra as Ofertas que Seus{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Concorrentes Escondem
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Monitore anúncios do Facebook, detecte cloaking, identifique winning ads e 
              domine seu mercado com inteligência de dados em tempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto group text-lg px-8 py-6">
                  <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                  Teste Grátis por 7 Dias
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto group text-lg px-8 py-6">
                <Play className="w-5 h-5 mr-2" />
                Ver Demonstração
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Lock className="w-4 h-4" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Cancele quando quiser
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                Setup em 2 minutos
              </span>
            </p>
          </div>

          {/* Metrics bar */}
          <div className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto transition-all duration-1000 delay-300 ${heroRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {metrics.map((metric, index) => (
              <div key={index} className="text-center p-4 rounded-lg bg-muted/30 backdrop-blur-sm border border-border/50">
                <metric.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl md:text-3xl font-bold text-foreground">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid - com stagger animation */}
      <section className="py-20 bg-muted/30 relative" ref={featuresRef.ref}>
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${featuresRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Tudo que Você Precisa para{" "}
              <span className="text-primary">Dominar o Mercado</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Ferramentas profissionais de inteligência competitiva em uma única plataforma.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`p-6 bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-500 border-border/50 group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 ${featuresRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API Showcase */}
      <section className="py-20" ref={apiRef.ref}>
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-700 ${apiRef.isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge variant="outline" className="mb-4">
                <Code className="w-3 h-3 mr-1" />
                API Própria
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Integre com Suas{" "}
                <span className="text-primary">Ferramentas</span>
              </h2>
              <p className="text-muted-foreground mb-6 text-lg">
                Nossa API RESTful permite integrar os dados do KillaSpy diretamente 
                em suas automações, dashboards e sistemas internos.
              </p>
              <ul className="space-y-3 mb-8">
                {["Endpoints documentados", "Rate limiting generoso", "Webhooks em tempo real", "SDKs para Python e Node.js"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button variant="outline" className="group">
                  Ver Documentação
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            <div className={`transition-all duration-700 delay-200 ${apiRef.isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="bg-zinc-900 rounded-xl p-6 font-mono text-sm overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <pre className="text-green-400 overflow-x-auto">
{`// Buscar winning ads
const response = await fetch(
  'https://api.killaspy.com/v1/ads/winning',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  }
);

const { ads, meta } = await response.json();
// ads: Array de anúncios vencedores
// meta: Paginação e filtros`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Como Funciona</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simples de Usar, Poderoso nos Resultados
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, title: "Configure suas Categorias", desc: "Defina os nichos e palavras-chave que deseja monitorar.", icon: Target },
              { step: 2, title: "Colete Automaticamente", desc: "Nossa IA coleta e analisa milhares de anúncios diariamente.", icon: Zap },
              { step: 3, title: "Descubra Oportunidades", desc: "Identifique winning ads, ofertas ocultas e tendências.", icon: TrendingUp }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/25">
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 -mt-2">
                  <span className="text-sm font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20" ref={pricingRef.ref}>
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${pricingRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="outline" className="mb-4">Preços</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Planos que Cabem no Seu{" "}
              <span className="text-primary">Bolso</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Escolha o plano ideal para o tamanho da sua operação.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`p-8 relative transition-all duration-500 hover:shadow-xl ${plan.highlighted 
                  ? 'border-primary bg-gradient-to-b from-primary/5 to-transparent scale-105 shadow-lg shadow-primary/10' 
                  : 'border-border/50 hover:border-primary/50'} ${pricingRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block">
                  <Button 
                    className="w-full py-6 text-lg" 
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30" ref={testimonialsRef.ref}>
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${testimonialsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="outline" className="mb-4">Depoimentos</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O que Nossos <span className="text-primary">Clientes</span> Dizem
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className={`p-6 border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-lg ${testimonialsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role} • {testimonial.company}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"{testimonial.content}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Perguntas Frequentes
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card 
                key={index} 
                className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'border-primary' : 'border-border/50'}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-40' : 'max-h-0'}`}>
                  <p className="px-6 pb-6 text-muted-foreground">{faq.answer}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-2xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              <Rocket className="w-3 h-3 mr-1" />
              Comece Agora
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Pronto para{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Dominar Seu Mercado?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Junte-se a milhares de profissionais que já usam o KillaSpy para 
              descobrir oportunidades e escalar suas campanhas.
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-10 py-7 group">
                <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Começar Teste Grátis
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              7 dias grátis • Sem cartão de crédito • Suporte em português
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">KillaSpy</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacidade" className="hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <Link to="/termos" className="hover:text-foreground transition-colors">
                Termos
              </Link>
              <a href="mailto:suporte@killaspy.com" className="hover:text-foreground transition-colors">
                Contato
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 KillaSpy. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}