import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, ArrowLeft } from "lucide-react";
import { SEOHead, createWebPageJsonLd, organizationJsonLd } from "@/components/seo/SEOHead";

export default function PrivacyPage() {
  const seoData = {
    title: "Política de Privacidade | KillaSpy - Plataforma de Inteligência Competitiva",
    description: "Conheça nossa Política de Privacidade. Saiba como a KillaSpy coleta, usa e protege seus dados em conformidade com a LGPD e políticas do Facebook/Meta.",
    canonicalUrl: "https://killaspy.online/privacidade",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd,
      createWebPageJsonLd(
        "Política de Privacidade",
        seoData.description,
        seoData.canonicalUrl,
        "2025-12-22"
      )
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        canonicalUrl={seoData.canonicalUrl}
        jsonLd={jsonLd}
      />
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/pagina-de-vendas" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">KillaSpy</span>
          </Link>
          <Link to="/pagina-de-vendas">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
          Política de Privacidade
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">
            Última atualização: 22 de Dezembro de 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
            <p>
              A KillaSpy Tecnologia Ltda. ("KillaSpy", "nós", "nosso" ou "Empresa") está comprometida 
              em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, 
              divulgamos e protegemos suas informações quando você utiliza nossa plataforma de 
              inteligência competitiva para anunciantes (o "Serviço").
            </p>
            <p>
              Esta política também descreve como tratamos dados obtidos através de integrações com 
              APIs de terceiros, incluindo a Facebook Ad Library API, em conformidade com as políticas 
              do Facebook/Meta e a Lei Geral de Proteção de Dados (LGPD).
            </p>
            <p>
              Ao acessar ou usar o Serviço, você concorda com a coleta e uso de informações de 
              acordo com esta política.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Informações que Coletamos</h2>
            
            <h3 className="text-lg font-medium text-foreground">2.1 Informações Fornecidas por Você</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Informações de Conta:</strong> Nome, endereço de e-mail, senha e informações de contato quando você cria uma conta.</li>
              <li><strong>Informações de Pagamento:</strong> Dados de pagamento processados por nossos provedores terceirizados (Stripe, etc.). Não armazenamos números completos de cartão de crédito.</li>
              <li><strong>Comunicações:</strong> Mensagens, feedbacks e outras comunicações que você nos envia.</li>
              <li><strong>Configurações de Preferência:</strong> Suas preferências de categorias de anúncios, países e palavras-chave monitoradas.</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">2.2 Informações Coletadas Automaticamente</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de Uso:</strong> Informações sobre como você usa o Serviço, incluindo páginas visitadas, funcionalidades utilizadas e ações realizadas.</li>
              <li><strong>Dados do Dispositivo:</strong> Informações sobre seu dispositivo, incluindo endereço IP, tipo de navegador, sistema operacional e identificadores únicos do dispositivo.</li>
              <li><strong>Cookies:</strong> Utilizamos cookies e tecnologias semelhantes para coletar informações e melhorar nosso Serviço.</li>
            </ul>
          </section>

          <section className="space-y-4 p-4 border border-primary/30 rounded-lg bg-primary/5">
            <h2 className="text-xl font-semibold text-foreground">3. Dados de APIs de Terceiros (Facebook/Meta)</h2>
            
            <h3 className="text-lg font-medium text-foreground">3.1 Facebook Ad Library API</h3>
            <p>
              Nosso Serviço utiliza a <strong>Facebook Ad Library API</strong> para acessar dados públicos 
              de anúncios. Estes dados são:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Publicamente Disponíveis:</strong> Todos os dados são públicos e disponibilizados pelo Facebook através da biblioteca de anúncios</li>
              <li><strong>Não Pessoais:</strong> Não coletamos dados pessoais de usuários do Facebook</li>
              <li><strong>Relacionados a Anúncios:</strong> Incluem ID do anúncio, nome da página, conteúdo criativo, datas e países de exibição</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">3.2 Dados que NÃO Coletamos</h3>
            <p>Em conformidade com as políticas do Facebook/Meta, NÃO coletamos:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dados pessoais de usuários do Facebook</li>
              <li>Informações de perfil de usuários</li>
              <li>Métricas de engajamento de usuários individuais</li>
              <li>Dados de segmentação de público</li>
              <li>Informações de pagamento de anunciantes</li>
              <li>Dados de contas privadas ou anúncios não públicos</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">3.3 Uso dos Dados do Facebook</h3>
            <p>Os dados obtidos da Facebook Ad Library API são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Análise de tendências de mercado e publicidade</li>
              <li>Identificação de padrões em anúncios públicos</li>
              <li>Fornecimento de insights competitivos aos nossos usuários</li>
              <li>Pesquisa e melhoria do nosso Serviço</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">3.4 Conformidade com Políticas do Facebook</h3>
            <p>
              Cumprimos integralmente os <strong>Facebook Platform Terms</strong> e as <strong>Meta Developer Policies</strong>, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Não usamos dados para discriminação ou tratamento desfavorável</li>
              <li>Não vendemos dados obtidos através das APIs do Facebook</li>
              <li>Não transferimos dados para data brokers ou serviços de publicidade</li>
              <li>Respeitamos os direitos dos proprietários dos dados</li>
              <li>Mantemos logs de acesso à API para auditoria</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Como Usamos Suas Informações</h2>
            <p>Utilizamos as informações coletadas para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer, manter e melhorar nosso Serviço</li>
              <li>Processar transações e enviar notificações relacionadas</li>
              <li>Responder a suas solicitações, comentários e perguntas</li>
              <li>Enviar informações técnicas, atualizações, alertas de segurança e mensagens de suporte</li>
              <li>Comunicar sobre produtos, serviços, ofertas e eventos (com seu consentimento)</li>
              <li>Monitorar e analisar tendências, uso e atividades</li>
              <li>Detectar, investigar e prevenir fraudes e outras atividades ilegais</li>
              <li>Personalizar e melhorar sua experiência</li>
              <li>Cumprir obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Compartilhamento de Informações</h2>
            
            <h3 className="text-lg font-medium text-foreground">5.1 Quando Compartilhamos</h3>
            <p>Podemos compartilhar suas informações nas seguintes situações:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Provedores de Serviço:</strong> Com empresas terceirizadas que realizam serviços em nosso nome (processamento de pagamentos, hospedagem, análise).</li>
              <li><strong>Conformidade Legal:</strong> Se exigido por lei ou em resposta a processos legais válidos.</li>
              <li><strong>Proteção de Direitos:</strong> Para proteger os direitos, privacidade, segurança ou propriedade nossa, de nossos usuários ou do público.</li>
              <li><strong>Transferência de Negócios:</strong> Em conexão com qualquer fusão, venda de ativos ou aquisição.</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">5.2 O que NÃO Fazemos</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Não vendemos</strong> suas informações pessoais a terceiros</li>
              <li><strong>Não compartilhamos</strong> dados com data brokers</li>
              <li><strong>Não transferimos</strong> dados do Facebook para serviços de publicidade de terceiros</li>
              <li><strong>Não usamos</strong> dados para criar perfis de usuários do Facebook</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas, administrativas e físicas apropriadas 
              para proteger suas informações:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Criptografia:</strong> Dados em trânsito (TLS/SSL) e em repouso</li>
              <li><strong>Controle de Acesso:</strong> Acesso restrito baseado em funções (RBAC)</li>
              <li><strong>Monitoramento:</strong> Monitoramento contínuo de segurança e detecção de ameaças</li>
              <li><strong>Auditorias:</strong> Auditorias regulares de segurança e compliance</li>
              <li><strong>Backups:</strong> Backups criptografados e recuperação de desastres</li>
            </ul>
            <p>
              No entanto, nenhum método de transmissão pela Internet ou armazenamento eletrônico 
              é 100% seguro. Portanto, não podemos garantir segurança absoluta.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Retenção de Dados</h2>
            
            <h3 className="text-lg font-medium text-foreground">7.1 Seus Dados Pessoais</h3>
            <p>
              Retemos suas informações pessoais pelo tempo necessário para cumprir as finalidades 
              descritas nesta Política, ou conforme exigido por lei.
            </p>

            <h3 className="text-lg font-medium text-foreground">7.2 Dados de APIs de Terceiros</h3>
            <p>
              Dados obtidos através da Facebook Ad Library API são:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Armazenados em cache por período limitado para melhorar performance</li>
              <li>Atualizados regularmente para refletir mudanças na biblioteca de anúncios</li>
              <li>Excluídos quando não mais disponíveis publicamente</li>
              <li>Gerenciados de acordo com as políticas de retenção do Facebook</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">7.3 Após Encerramento da Conta</h3>
            <p>
              Quando você encerra sua conta, excluímos ou anonimizamos suas informações pessoais 
              dentro de 30 dias, exceto quando a retenção for necessária para fins legais ou regulatórios.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Seus Direitos (LGPD)</h2>
            <p>De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem o direito de:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Confirmação:</strong> Confirmar a existência de tratamento de seus dados</li>
              <li><strong>Acesso:</strong> Acessar seus dados pessoais</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização/Bloqueio/Eliminação:</strong> Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade</li>
              <li><strong>Portabilidade:</strong> Solicitar a portabilidade dos dados a outro fornecedor</li>
              <li><strong>Eliminação:</strong> Solicitar a eliminação dos dados tratados com base no consentimento</li>
              <li><strong>Informação:</strong> Ser informado sobre as entidades com as quais seus dados foram compartilhados</li>
              <li><strong>Revogação:</strong> Revogar o consentimento a qualquer momento</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, entre em contato com nosso Encarregado de 
              Proteção de Dados (DPO):
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>E-mail:</strong> privacidade@killaspy.online</li>
              <li><strong>Prazo de Resposta:</strong> 15 dias úteis</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Cookies e Tecnologias de Rastreamento</h2>
            
            <h3 className="text-lg font-medium text-foreground">9.1 Tipos de Cookies</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cookies Essenciais:</strong> Necessários para o funcionamento do site (autenticação, segurança)</li>
              <li><strong>Cookies de Desempenho:</strong> Para analisar como você usa nosso site e melhorar a performance</li>
              <li><strong>Cookies Funcionais:</strong> Para lembrar suas preferências e configurações</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">9.2 Gerenciamento de Cookies</h3>
            <p>
              Você pode configurar seu navegador para recusar cookies ou alertá-lo quando cookies 
              estiverem sendo enviados. Note que algumas funcionalidades do Serviço podem não 
              funcionar corretamente se cookies forem desabilitados.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Transferência Internacional de Dados</h2>
            <p>
              Seus dados podem ser transferidos e processados em servidores localizados fora do Brasil, 
              incluindo países onde nossos provedores de serviço operam. Garantimos que:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Transferências são realizadas apenas para países com nível adequado de proteção</li>
              <li>Utilizamos cláusulas contratuais padrão quando necessário</li>
              <li>Mantemos as mesmas proteções independentemente da localização</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">11. Privacidade de Menores</h2>
            <p>
              Nosso Serviço não se destina a pessoas com menos de 18 anos. Não coletamos 
              intencionalmente informações pessoais de menores de 18 anos. Se você é pai/mãe 
              ou responsável e está ciente de que seu filho nos forneceu informações pessoais, 
              entre em contato conosco imediatamente.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">12. Links para Outros Sites</h2>
            <p>
              Nosso Serviço pode conter links para sites de terceiros, incluindo páginas de anúncios 
              do Facebook. Não somos responsáveis pelas práticas de privacidade desses sites. 
              Recomendamos que você revise a política de privacidade de cada site que visitar.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">13. Alterações a Esta Política</h2>
            <p>
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você 
              sobre alterações materiais através de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Aviso por e-mail</li>
              <li>Aviso destacado em nosso site</li>
              <li>Atualização da data de "Última atualização"</li>
            </ul>
            <p>
              Recomendamos que você revise esta Política periodicamente. Alterações entram em 
              vigor quando publicadas nesta página.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">14. Contato</h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos 
              seus dados, entre em contato:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Encarregado (DPO):</strong> privacidade@killaspy.online</li>
              <li><strong>Suporte Geral:</strong> suporte@killaspy.online</li>
              <li><strong>Site:</strong> https://killaspy.online</li>
            </ul>
          </section>

          <section className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
            <h2 className="text-xl font-semibold text-foreground">Declaração de Conformidade</h2>
            <p>
              A KillaSpy declara que esta Política de Privacidade está em conformidade com:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Lei Geral de Proteção de Dados (LGPD)</strong> - Lei nº 13.709/2018</li>
              <li><strong>Marco Civil da Internet</strong> - Lei nº 12.965/2014</li>
              <li><strong>Código de Defesa do Consumidor</strong> - Lei nº 8.078/1990</li>
              <li><strong>Facebook Platform Terms</strong></li>
              <li><strong>Meta Developer Policies</strong></li>
              <li><strong>Facebook Ad Library API Terms of Service</strong></li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 KillaSpy. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/pagina-de-vendas" className="hover:text-foreground transition-colors">
              Início
            </Link>
            <Link to="/termos" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}