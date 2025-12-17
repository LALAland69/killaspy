import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          Termos de Uso
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">
            Última atualização: 17 de Dezembro de 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar a plataforma KillaSpy ("Serviço"), você concorda em estar vinculado 
              a estes Termos de Uso ("Termos"). Se você não concordar com qualquer parte destes 
              Termos, você não tem permissão para acessar o Serviço.
            </p>
            <p>
              Estes Termos aplicam-se a todos os visitantes, usuários e outras pessoas que acessam 
              ou usam o Serviço. Ao acessar ou usar o Serviço, você concorda em estar vinculado a 
              estes Termos e à nossa Política de Privacidade.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p>
              O KillaSpy é uma plataforma de inteligência competitiva para anunciantes digitais que oferece:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Monitoramento e coleta de anúncios públicos do Facebook Ads Library</li>
              <li>Análise de padrões e detecção de estratégias de marketing</li>
              <li>Identificação de anúncios com alto desempenho (Winning Ads)</li>
              <li>Ferramentas de análise de copy com inteligência artificial</li>
              <li>Validação de tendências de mercado</li>
              <li>Auditorias de segurança e compliance</li>
            </ul>
            <p>
              O Serviço analisa exclusivamente dados públicos disponíveis na biblioteca de anúncios 
              do Facebook e não viola políticas de plataformas terceiras nem realiza atividades 
              ilegais de scraping ou bypass de proteções.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Contas de Usuário</h2>
            
            <h3 className="text-lg font-medium text-foreground">3.1 Registro</h3>
            <p>
              Para acessar certas funcionalidades do Serviço, você deve se registrar e criar uma conta. 
              Você concorda em fornecer informações precisas, atuais e completas durante o processo 
              de registro e em atualizar essas informações para mantê-las precisas e completas.
            </p>

            <h3 className="text-lg font-medium text-foreground">3.2 Segurança da Conta</h3>
            <p>
              Você é responsável por manter a confidencialidade de sua senha e por todas as 
              atividades que ocorram em sua conta. Você concorda em notificar-nos imediatamente 
              sobre qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança.
            </p>

            <h3 className="text-lg font-medium text-foreground">3.3 Requisitos de Idade</h3>
            <p>
              Você deve ter pelo menos 18 anos de idade para usar o Serviço. Ao usar o Serviço, 
              você declara e garante que tem pelo menos 18 anos de idade.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Planos e Pagamentos</h2>
            
            <h3 className="text-lg font-medium text-foreground">4.1 Assinatura</h3>
            <p>
              O Serviço é oferecido mediante assinatura paga. Os detalhes dos planos disponíveis, 
              incluindo preços e funcionalidades, estão descritos em nossa página de preços e 
              podem ser alterados mediante aviso prévio.
            </p>

            <h3 className="text-lg font-medium text-foreground">4.2 Pagamento</h3>
            <p>
              Ao se inscrever em um plano pago, você concorda em pagar todas as taxas aplicáveis 
              conforme indicado no momento da compra. Os pagamentos são processados por provedores 
              terceirizados e estão sujeitos aos termos desses provedores.
            </p>

            <h3 className="text-lg font-medium text-foreground">4.3 Renovação Automática</h3>
            <p>
              As assinaturas são renovadas automaticamente ao final de cada período de faturamento, 
              a menos que você cancele antes da data de renovação. Você pode cancelar sua assinatura 
              a qualquer momento através das configurações da sua conta.
            </p>

            <h3 className="text-lg font-medium text-foreground">4.4 Reembolsos</h3>
            <p>
              Oferecemos garantia de satisfação de 7 dias para novos assinantes. Após esse período, 
              os pagamentos não são reembolsáveis, exceto quando exigido por lei aplicável.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Uso Aceitável</h2>
            <p>Você concorda em usar o Serviço apenas para fins legais e de acordo com estes Termos. Você concorda em NÃO:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usar o Serviço de qualquer forma que viole qualquer lei ou regulamento aplicável</li>
              <li>Usar o Serviço para fins fraudulentos ou enganosos</li>
              <li>Compartilhar suas credenciais de acesso com terceiros</li>
              <li>Tentar acessar áreas restritas do Serviço sem autorização</li>
              <li>Usar o Serviço para enviar spam ou comunicações não solicitadas</li>
              <li>Interferir ou interromper o Serviço ou servidores ou redes conectadas ao Serviço</li>
              <li>Copiar, modificar, distribuir, vender ou alugar qualquer parte do Serviço</li>
              <li>Fazer engenharia reversa ou tentar extrair o código-fonte do Serviço</li>
              <li>Usar o Serviço para coletar informações pessoais de outros usuários</li>
              <li>Usar os dados do Serviço para criar produtos ou serviços concorrentes</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Propriedade Intelectual</h2>
            
            <h3 className="text-lg font-medium text-foreground">6.1 Nossos Direitos</h3>
            <p>
              O Serviço e seu conteúdo original (excluindo conteúdo fornecido por usuários), 
              funcionalidades e características são e permanecerão propriedade exclusiva da 
              KillaSpy e seus licenciadores. O Serviço é protegido por direitos autorais, 
              marcas registradas e outras leis.
            </p>

            <h3 className="text-lg font-medium text-foreground">6.2 Licença de Uso</h3>
            <p>
              Concedemos a você uma licença limitada, não exclusiva, intransferível e revogável 
              para usar o Serviço de acordo com estes Termos. Esta licença não inclui o direito 
              de sublicenciar, vender ou redistribuir o Serviço.
            </p>

            <h3 className="text-lg font-medium text-foreground">6.3 Dados de Terceiros</h3>
            <p>
              O Serviço analisa dados públicos disponíveis em plataformas de terceiros. 
              Reconhecemos que esses dados pertencem a seus respectivos proprietários. 
              Não reivindicamos propriedade sobre anúncios ou conteúdo de terceiros exibidos no Serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Limitação de Responsabilidade</h2>
            <p>
              Em nenhuma circunstância a KillaSpy, seus diretores, funcionários, parceiros, 
              agentes, fornecedores ou afiliados serão responsáveis por quaisquer danos indiretos, 
              incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, 
              perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis, resultantes de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Seu acesso ou uso ou incapacidade de acessar ou usar o Serviço</li>
              <li>Qualquer conduta ou conteúdo de terceiros no Serviço</li>
              <li>Qualquer conteúdo obtido do Serviço</li>
              <li>Acesso não autorizado, uso ou alteração de suas transmissões ou conteúdo</li>
            </ul>
            <p>
              Nossa responsabilidade total em qualquer caso está limitada ao valor que você 
              pagou pelo Serviço nos últimos 12 meses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Isenção de Garantias</h2>
            <p>
              O Serviço é fornecido "como está" e "conforme disponível", sem garantias de 
              qualquer tipo, expressas ou implícitas, incluindo, mas não se limitando a, 
              garantias implícitas de comercialização, adequação a uma finalidade específica, 
              não violação ou desempenho.
            </p>
            <p>
              Não garantimos que:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>O Serviço funcionará de forma ininterrupta, segura ou disponível</li>
              <li>Os resultados do uso do Serviço serão precisos ou confiáveis</li>
              <li>A qualidade de quaisquer produtos, serviços, informações ou outros materiais obtidos através do Serviço atenderá às suas expectativas</li>
              <li>Quaisquer erros no Serviço serão corrigidos</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Indenização</h2>
            <p>
              Você concorda em defender, indenizar e isentar a KillaSpy e seus licenciadores, 
              prestadores de serviços, funcionários, agentes, diretores e afiliados de e contra 
              quaisquer reclamações, danos, obrigações, perdas, responsabilidades, custos ou 
              dívidas e despesas (incluindo honorários advocatícios) decorrentes de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Seu uso e acesso ao Serviço</li>
              <li>Sua violação de qualquer termo destes Termos</li>
              <li>Sua violação de quaisquer direitos de terceiros</li>
              <li>Qualquer reclamação de que seu uso do Serviço causou danos a terceiros</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Rescisão</h2>
            <p>
              Podemos rescindir ou suspender sua conta e acesso ao Serviço imediatamente, 
              sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, 
              se você violar estes Termos.
            </p>
            <p>
              Após a rescisão, seu direito de usar o Serviço cessará imediatamente. 
              Se você deseja encerrar sua conta, pode simplesmente descontinuar o uso do Serviço 
              ou cancelar sua assinatura através das configurações da conta.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">11. Modificações do Serviço</h2>
            <p>
              Reservamo-nos o direito de retirar ou alterar nosso Serviço, e qualquer serviço 
              ou material que fornecemos através do Serviço, a nosso exclusivo critério e sem aviso. 
              Não seremos responsáveis se, por qualquer motivo, todo ou qualquer parte do Serviço 
              estiver indisponível a qualquer momento ou por qualquer período.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">12. Lei Aplicável e Jurisdição</h2>
            <p>
              Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, 
              sem considerar suas disposições sobre conflitos de leis. Nossa falha em fazer 
              cumprir qualquer direito ou disposição destes Termos não será considerada uma 
              renúncia a esses direitos.
            </p>
            <p>
              Qualquer disputa decorrente ou relacionada a estes Termos será submetida à 
              jurisdição exclusiva dos tribunais do Brasil.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">13. Alterações aos Termos</h2>
            <p>
              Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir 
              estes Termos a qualquer momento. Se uma revisão for material, forneceremos pelo 
              menos 30 dias de aviso antes que quaisquer novos termos entrem em vigor.
            </p>
            <p>
              Ao continuar a acessar ou usar nosso Serviço após essas revisões entrarem em vigor, 
              você concorda em estar vinculado aos termos revisados. Se você não concordar com 
              os novos termos, por favor, pare de usar o Serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">14. Disposições Gerais</h2>
            <p>
              Se qualquer disposição destes Termos for considerada inválida ou inexequível, 
              essa disposição será aplicada na máxima extensão permitida, e as demais disposições 
              destes Termos continuarão em pleno vigor e efeito.
            </p>
            <p>
              Estes Termos constituem o acordo integral entre nós em relação ao nosso Serviço 
              e substituem quaisquer acordos anteriores que possamos ter entre nós em relação ao Serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">15. Contato</h2>
            <p>
              Se você tiver dúvidas sobre estes Termos, entre em contato conosco:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>E-mail:</strong> suporte@killaspy.online</li>
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
            <Link to="/privacidade" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
