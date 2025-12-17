import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
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
            Última atualização: 17 de Dezembro de 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
            <p>
              A KillaSpy ("nós", "nosso" ou "Empresa") está comprometida em proteger sua privacidade. 
              Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos 
              suas informações quando você utiliza nossa plataforma de inteligência competitiva 
              para anunciantes (o "Serviço").
            </p>
            <p>
              Ao acessar ou usar o Serviço, você concorda com a coleta e uso de informações de 
              acordo com esta política. Se você não concordar com os termos desta política, 
              por favor, não acesse o Serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Informações que Coletamos</h2>
            
            <h3 className="text-lg font-medium text-foreground">2.1 Informações Fornecidas por Você</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Informações de Conta:</strong> Nome, endereço de e-mail, senha e informações de contato quando você cria uma conta.</li>
              <li><strong>Informações de Pagamento:</strong> Dados do cartão de crédito ou outras informações de pagamento processadas por nossos provedores de pagamento terceirizados.</li>
              <li><strong>Comunicações:</strong> Mensagens, feedbacks e outras comunicações que você nos envia.</li>
              <li><strong>Configurações de Preferência:</strong> Suas preferências de categorias de anúncios, países e palavras-chave monitoradas.</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">2.2 Informações Coletadas Automaticamente</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de Uso:</strong> Informações sobre como você usa o Serviço, incluindo páginas visitadas, funcionalidades utilizadas e ações realizadas.</li>
              <li><strong>Dados do Dispositivo:</strong> Informações sobre seu dispositivo, incluindo endereço IP, tipo de navegador, sistema operacional e identificadores únicos do dispositivo.</li>
              <li><strong>Cookies e Tecnologias Similares:</strong> Utilizamos cookies e tecnologias semelhantes para coletar informações e melhorar nosso Serviço.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Como Usamos Suas Informações</h2>
            <p>Utilizamos as informações coletadas para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer, manter e melhorar nosso Serviço</li>
              <li>Processar transações e enviar notificações relacionadas</li>
              <li>Responder a suas solicitações, comentários e perguntas</li>
              <li>Enviar informações técnicas, atualizações, alertas de segurança e mensagens de suporte</li>
              <li>Comunicar sobre produtos, serviços, ofertas e eventos</li>
              <li>Monitorar e analisar tendências, uso e atividades</li>
              <li>Detectar, investigar e prevenir transações fraudulentas e outras atividades ilegais</li>
              <li>Personalizar e melhorar sua experiência</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Compartilhamento de Informações</h2>
            <p>Podemos compartilhar suas informações nas seguintes situações:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Provedores de Serviço:</strong> Com empresas terceirizadas que realizam serviços em nosso nome, como processamento de pagamentos, análise de dados, entrega de e-mail e hospedagem.</li>
              <li><strong>Conformidade Legal:</strong> Se exigido por lei ou em resposta a processos legais válidos.</li>
              <li><strong>Proteção de Direitos:</strong> Para proteger os direitos, privacidade, segurança ou propriedade nossa, de nossos usuários ou do público.</li>
              <li><strong>Transferência de Negócios:</strong> Em conexão com qualquer fusão, venda de ativos da empresa ou aquisição.</li>
            </ul>
            <p>
              <strong>Importante:</strong> Não vendemos suas informações pessoais a terceiros.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas, administrativas e físicas apropriadas 
              para proteger suas informações pessoais contra acesso não autorizado, alteração, 
              divulgação ou destruição. Isso inclui:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controles de acesso rigorosos</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Auditorias regulares de segurança</li>
            </ul>
            <p>
              No entanto, nenhum método de transmissão pela Internet ou armazenamento eletrônico 
              é 100% seguro. Portanto, não podemos garantir segurança absoluta.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Retenção de Dados</h2>
            <p>
              Retemos suas informações pessoais pelo tempo necessário para cumprir as finalidades 
              descritas nesta Política de Privacidade, a menos que um período de retenção mais 
              longo seja exigido ou permitido por lei. Os critérios usados para determinar nossos 
              períodos de retenção incluem:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>O período de tempo que temos um relacionamento contínuo com você</li>
              <li>Se existe uma obrigação legal à qual estamos sujeitos</li>
              <li>Se a retenção é aconselhável à luz de nossa posição legal</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Seus Direitos</h2>
            <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Acesso:</strong> Solicitar acesso às suas informações pessoais</li>
              <li><strong>Correção:</strong> Solicitar a correção de dados imprecisos ou incompletos</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão de suas informações pessoais</li>
              <li><strong>Portabilidade:</strong> Solicitar a transferência de seus dados para outro serviço</li>
              <li><strong>Oposição:</strong> Opor-se ao processamento de suas informações pessoais</li>
              <li><strong>Revogação do Consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, entre em contato conosco através do e-mail: 
              <a href="mailto:privacidade@killaspy.online" className="text-primary hover:underline ml-1">
                privacidade@killaspy.online
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Cookies</h2>
            <p>
              Utilizamos cookies e tecnologias de rastreamento semelhantes para rastrear a atividade 
              em nosso Serviço e manter certas informações. Você pode instruir seu navegador a 
              recusar todos os cookies ou a indicar quando um cookie está sendo enviado.
            </p>
            <p>Tipos de cookies que usamos:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cookies Essenciais:</strong> Necessários para o funcionamento do site</li>
              <li><strong>Cookies de Desempenho:</strong> Para analisar como você usa nosso site</li>
              <li><strong>Cookies Funcionais:</strong> Para lembrar suas preferências</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Links para Outros Sites</h2>
            <p>
              Nosso Serviço pode conter links para outros sites que não são operados por nós. 
              Se você clicar em um link de terceiros, será direcionado para o site desse terceiro. 
              Recomendamos fortemente que você revise a Política de Privacidade de cada site que visitar.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Privacidade de Menores</h2>
            <p>
              Nosso Serviço não se destina a pessoas com menos de 18 anos. Não coletamos 
              intencionalmente informações pessoais identificáveis de menores de 18 anos. 
              Se você é pai/mãe ou responsável e está ciente de que seu filho nos forneceu 
              informações pessoais, entre em contato conosco.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">11. Alterações a Esta Política</h2>
            <p>
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você 
              sobre quaisquer alterações publicando a nova Política de Privacidade nesta página 
              e atualizando a data de "Última atualização".
            </p>
            <p>
              Recomendamos que você revise esta Política de Privacidade periodicamente para 
              quaisquer alterações. As alterações entram em vigor quando publicadas nesta página.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">12. Contato</h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>E-mail:</strong> privacidade@killaspy.online</li>
              <li><strong>Site:</strong> https://killaspy.online</li>
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
