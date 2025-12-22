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
            Última atualização: 22 de Dezembro de 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar a plataforma KillaSpy ("Serviço"), operada por KillaSpy Tecnologia Ltda. 
              ("Empresa", "nós", "nosso"), você concorda em estar vinculado a estes Termos de Uso ("Termos"). 
              Se você não concordar com qualquer parte destes Termos, você não tem permissão para acessar o Serviço.
            </p>
            <p>
              Estes Termos aplicam-se a todos os visitantes, usuários e outras pessoas que acessam 
              ou usam o Serviço. Ao acessar ou usar o Serviço, você concorda em estar vinculado a 
              estes Termos e à nossa <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p>
              O KillaSpy é uma plataforma de inteligência competitiva para anunciantes digitais que oferece:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acesso e análise de dados públicos da Facebook Ad Library API</li>
              <li>Monitoramento de anúncios públicos disponíveis na biblioteca de anúncios do Facebook</li>
              <li>Análise de padrões e detecção de estratégias de marketing</li>
              <li>Identificação de anúncios com alto desempenho (Winning Ads)</li>
              <li>Ferramentas de análise de copy com inteligência artificial</li>
              <li>Validação de tendências de mercado</li>
              <li>Auditorias de segurança e compliance</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Uso da Facebook Ad Library API</h2>
            
            <h3 className="text-lg font-medium text-foreground">3.1 Dados Públicos</h3>
            <p>
              O Serviço utiliza exclusivamente a <strong>Facebook Ad Library API</strong> para acessar dados 
              de anúncios que são <strong>publicamente disponíveis</strong> de acordo com as políticas de 
              transparência do Facebook/Meta. Estes dados incluem:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Identificadores de anúncios públicos</li>
              <li>Nome da página anunciante</li>
              <li>Conteúdo criativo dos anúncios (texto, imagens)</li>
              <li>Datas de início e término das campanhas</li>
              <li>Países onde os anúncios foram exibidos</li>
              <li>Snapshots dos anúncios disponíveis publicamente</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">3.2 Conformidade com Políticas do Facebook/Meta</h3>
            <p>
              Nosso Serviço opera em total conformidade com:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Facebook Platform Terms:</strong> Cumprimos integralmente os termos da plataforma Facebook</li>
              <li><strong>Facebook Ad Library API Terms:</strong> Utilizamos a API de acordo com suas políticas de uso</li>
              <li><strong>Meta Developer Policies:</strong> Seguimos todas as diretrizes para desenvolvedores</li>
              <li><strong>Data Use Restrictions:</strong> Respeitamos as restrições de uso de dados do Facebook</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">3.3 Limitações de Uso</h3>
            <p>O Serviço NÃO realiza:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Scraping não autorizado de plataformas</li>
              <li>Coleta de dados pessoais de usuários do Facebook</li>
              <li>Acesso a informações privadas de contas ou anúncios</li>
              <li>Violação de rate limits ou políticas da API</li>
              <li>Armazenamento de dados além do permitido pelas políticas da API</li>
              <li>Revenda ou redistribuição de dados brutos da API</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Contas de Usuário</h2>
            
            <h3 className="text-lg font-medium text-foreground">4.1 Registro</h3>
            <p>
              Para acessar certas funcionalidades do Serviço, você deve se registrar e criar uma conta. 
              Você concorda em fornecer informações precisas, atuais e completas durante o processo 
              de registro e em atualizar essas informações para mantê-las precisas e completas.
            </p>

            <h3 className="text-lg font-medium text-foreground">4.2 Segurança da Conta</h3>
            <p>
              Você é responsável por manter a confidencialidade de sua senha e por todas as 
              atividades que ocorram em sua conta. Você concorda em notificar-nos imediatamente 
              sobre qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança.
            </p>

            <h3 className="text-lg font-medium text-foreground">4.3 Requisitos de Idade</h3>
            <p>
              Você deve ter pelo menos 18 anos de idade para usar o Serviço. Ao usar o Serviço, 
              você declara e garante que tem pelo menos 18 anos de idade.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Uso Aceitável</h2>
            <p>Você concorda em usar o Serviço apenas para fins legais e de acordo com estes Termos. Você concorda em NÃO:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usar o Serviço de qualquer forma que viole qualquer lei ou regulamento aplicável</li>
              <li>Usar o Serviço para fins fraudulentos, enganosos ou ilegais</li>
              <li>Compartilhar suas credenciais de acesso com terceiros</li>
              <li>Tentar acessar áreas restritas do Serviço sem autorização</li>
              <li>Usar o Serviço para enviar spam ou comunicações não solicitadas</li>
              <li>Interferir ou interromper o Serviço ou servidores ou redes conectadas ao Serviço</li>
              <li>Copiar, modificar, distribuir, vender ou alugar qualquer parte do Serviço</li>
              <li>Fazer engenharia reversa ou tentar extrair o código-fonte do Serviço</li>
              <li>Usar o Serviço para coletar informações pessoais de outros usuários</li>
              <li>Usar os dados do Serviço para criar produtos ou serviços concorrentes</li>
              <li>Violar as políticas de plataformas terceiras, incluindo Facebook/Meta</li>
              <li>Usar dados obtidos do Serviço para assédio, difamação ou atividades ilegais</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Integrações com APIs de Terceiros</h2>
            
            <h3 className="text-lg font-medium text-foreground">6.1 Facebook/Meta APIs</h3>
            <p>
              Ao usar funcionalidades que envolvem dados do Facebook, você reconhece e concorda que:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Os dados são fornecidos pelo Facebook/Meta através de suas APIs oficiais</li>
              <li>A disponibilidade dos dados depende das políticas do Facebook/Meta</li>
              <li>Mudanças nas políticas do Facebook podem afetar a funcionalidade do Serviço</li>
              <li>Você não tentará usar os dados de formas que violem as políticas do Facebook</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">6.2 Outras Integrações</h3>
            <p>
              O Serviço pode integrar-se com outras APIs e serviços de terceiros para fornecer 
              funcionalidades adicionais. O uso dessas integrações está sujeito aos termos e 
              políticas dos respectivos provedores.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Planos e Pagamentos</h2>
            
            <h3 className="text-lg font-medium text-foreground">7.1 Assinatura</h3>
            <p>
              O Serviço é oferecido mediante assinatura paga. Os detalhes dos planos disponíveis, 
              incluindo preços e funcionalidades, estão descritos em nossa página de preços e 
              podem ser alterados mediante aviso prévio.
            </p>

            <h3 className="text-lg font-medium text-foreground">7.2 Pagamento</h3>
            <p>
              Ao se inscrever em um plano pago, você concorda em pagar todas as taxas aplicáveis 
              conforme indicado no momento da compra. Os pagamentos são processados por provedores 
              terceirizados e estão sujeitos aos termos desses provedores.
            </p>

            <h3 className="text-lg font-medium text-foreground">7.3 Renovação Automática</h3>
            <p>
              As assinaturas são renovadas automaticamente ao final de cada período de faturamento, 
              a menos que você cancele antes da data de renovação. Você pode cancelar sua assinatura 
              a qualquer momento através das configurações da sua conta.
            </p>

            <h3 className="text-lg font-medium text-foreground">7.4 Reembolsos</h3>
            <p>
              Oferecemos garantia de satisfação de 7 dias para novos assinantes. Após esse período, 
              os pagamentos não são reembolsáveis, exceto quando exigido por lei aplicável.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Propriedade Intelectual</h2>
            
            <h3 className="text-lg font-medium text-foreground">8.1 Nossos Direitos</h3>
            <p>
              O Serviço e seu conteúdo original (excluindo conteúdo fornecido por usuários e dados 
              de terceiros), funcionalidades e características são e permanecerão propriedade 
              exclusiva da KillaSpy e seus licenciadores. O Serviço é protegido por direitos 
              autorais, marcas registradas e outras leis.
            </p>

            <h3 className="text-lg font-medium text-foreground">8.2 Licença de Uso</h3>
            <p>
              Concedemos a você uma licença limitada, não exclusiva, intransferível e revogável 
              para usar o Serviço de acordo com estes Termos. Esta licença não inclui o direito 
              de sublicenciar, vender ou redistribuir o Serviço.
            </p>

            <h3 className="text-lg font-medium text-foreground">8.3 Dados de Terceiros</h3>
            <p>
              O Serviço exibe e analisa dados públicos disponíveis através de APIs oficiais. 
              Reconhecemos que esses dados pertencem a seus respectivos proprietários (incluindo 
              Facebook/Meta e anunciantes). Não reivindicamos propriedade sobre anúncios ou 
              conteúdo de terceiros exibidos no Serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Isenção de Garantias</h2>
            <p>
              O Serviço é fornecido "como está" e "conforme disponível", sem garantias de 
              qualquer tipo, expressas ou implícitas. Não garantimos que:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>O Serviço funcionará de forma ininterrupta, segura ou disponível</li>
              <li>Os resultados do uso do Serviço serão precisos ou confiáveis</li>
              <li>Os dados de terceiros estarão sempre disponíveis ou atualizados</li>
              <li>As APIs de terceiros (incluindo Facebook) permanecerão disponíveis</li>
              <li>Quaisquer erros no Serviço serão corrigidos imediatamente</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Limitação de Responsabilidade</h2>
            <p>
              Em nenhuma circunstância a KillaSpy, seus diretores, funcionários, parceiros, 
              agentes, fornecedores ou afiliados serão responsáveis por quaisquer danos indiretos, 
              incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, 
              perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis.
            </p>
            <p>
              Nossa responsabilidade total em qualquer caso está limitada ao valor que você 
              pagou pelo Serviço nos últimos 12 meses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">11. Indenização</h2>
            <p>
              Você concorda em defender, indenizar e isentar a KillaSpy e seus licenciadores, 
              prestadores de serviços, funcionários, agentes, diretores e afiliados de e contra 
              quaisquer reclamações, danos, obrigações, perdas, responsabilidades, custos ou 
              dívidas e despesas decorrentes de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Seu uso e acesso ao Serviço</li>
              <li>Sua violação de qualquer termo destes Termos</li>
              <li>Sua violação de quaisquer direitos de terceiros</li>
              <li>Seu uso indevido de dados obtidos através do Serviço</li>
              <li>Qualquer violação de políticas de plataformas terceiras causada por você</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">12. Rescisão</h2>
            <p>
              Podemos rescindir ou suspender sua conta e acesso ao Serviço imediatamente, 
              sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violação destes Termos</li>
              <li>Violação de políticas de plataformas terceiras</li>
              <li>Uso do Serviço para atividades ilegais</li>
              <li>Solicitação de autoridades competentes</li>
            </ul>
            <p>
              Após a rescisão, seu direito de usar o Serviço cessará imediatamente.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">13. Modificações</h2>
            <p>
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. Se uma 
              revisão for material, forneceremos pelo menos 30 dias de aviso antes que 
              quaisquer novos termos entrem em vigor.
            </p>
            <p>
              Ao continuar a acessar ou usar nosso Serviço após essas revisões entrarem em vigor, 
              você concorda em estar vinculado aos termos revisados.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">14. Lei Aplicável</h2>
            <p>
              Estes Termos serão regidos e interpretados de acordo com as leis do Brasil. 
              Qualquer disputa decorrente ou relacionada a estes Termos será submetida à 
              jurisdição exclusiva dos tribunais brasileiros.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">15. Contato</h2>
            <p>
              Se você tiver dúvidas sobre estes Termos, entre em contato conosco:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>E-mail:</strong> suporte@killaspy.online</li>
              <li><strong>E-mail para assuntos legais:</strong> legal@killaspy.online</li>
              <li><strong>Site:</strong> https://killaspy.online</li>
            </ul>
          </section>

          <section className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
            <h2 className="text-xl font-semibold text-foreground">Declaração de Conformidade</h2>
            <p>
              A KillaSpy declara que opera em conformidade com todas as leis e regulamentos 
              aplicáveis, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018</li>
              <li>Marco Civil da Internet - Lei nº 12.965/2014</li>
              <li>Código de Defesa do Consumidor - Lei nº 8.078/1990</li>
              <li>Políticas de Plataforma do Facebook/Meta</li>
              <li>Termos da Facebook Ad Library API</li>
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