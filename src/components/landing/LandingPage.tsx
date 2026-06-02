import { 
  ArrowRight, Server, CloudLightning, ShieldCheck, Database, LayoutDashboard,
  Activity, Users, DollarSign, MessageSquare, ListTree, AlertTriangle, CheckCircle2,
  Lock, BarChart, ChevronDown, Check, Menu, X, ArrowUpRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils';
import { LightningLogo } from '../LightningLogo';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "Preciso dar acesso total ao meu Firebase?",
      answer: "Não. A AnimaSystem utiliza o princípio do Menor Privilégio (Least Privilege). Solicitamos apenas a permissão 'monitoring.viewer' para ler contadores de uso, sem qualquer acesso aos dados dos seus usuários ou do Firestore."
    },
    {
      question: "Como funciona a integração financeira?",
      answer: "Temos integração nativa com o Asaas. Configurando sua chave de API, a AnimaSystem gera cobranças automáticas via PIX, Boleto e Cartão de Crédito, além de gerenciar inadimplência e emitir alertas de vencimento automaticamente."
    },
    {
      question: "A AnimaSystem suporta dezenas de projetos?",
      answer: "Sim. Nossa arquitetura Multi-Tenant com ingestão via Polling foi desenhada para escalar e monitorar dezenas ou até centenas de projetos Firebase simultâneos com baixíssimo custo operacional."
    },
    {
      question: "Posso criar contas para minha equipe?",
      answer: "Com certeza. Nos planos Pro e Enterprise, você pode criar contas para o seu time de suporte com níveis de acesso granulares (Admin, Financeiro, NOC, Suporte L1/L2)."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-accent/30 overflow-x-hidden">
      
      {/* Background Gradients */}
      <div className="fixed top-0 left-1/2 w-full -translate-x-1/2 h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/20 via-zinc-950 to-zinc-950 opacity-50 pointer-events-none z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <LightningLogo className="w-8 h-8" />
            </div>
            <span className="text-xl tracking-tight hidden sm:block" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              <span className="font-light">Anima</span><span className="font-bold">System</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#solucao" className="hover:text-zinc-100 transition-colors">Solução</a>
            <a href="#funcionalidades" className="hover:text-zinc-100 transition-colors">Plataforma</a>
            <a href="#precos" className="hover:text-zinc-100 transition-colors">Planos</a>
            <a href="#faq" className="hover:text-zinc-100 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white transition-colors" onClick={onEnter}>
              Login
            </button>
            <button 
              onClick={onEnter}
              className="bg-accent hover:bg-accent-hover text-zinc-950 px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
            >
              Acessar Painel
            </button>
            <button className="md:hidden text-zinc-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
               {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-zinc-950 z-40 p-6 md:hidden">
          <div className="flex flex-col gap-6 text-lg font-medium">
            <a href="#solucao" onClick={() => setMobileMenuOpen(false)}>Solução</a>
            <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)}>Plataforma</a>
            <a href="#precos" onClick={() => setMobileMenuOpen(false)}>Planos</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium">
            <LightningLogo className="w-4 h-4" />
            <span className="hidden sm:inline">Apresentando a</span> Nova Geração de Gestão SaaS
          </div>

          <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-7xl tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500">
            A Central de Comando <br className="hidden md:block"/> para suas Startups
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Abandone dezenas de abas abertas. Gerencie clientes, consumo de Firebase, faturamento automatizado, suporte e logs em um único painel administrativo.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onEnter}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-8 py-4 rounded-full text-base transition-all hover:scale-105 active:scale-95"
            >
              Comece a usar agora
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium px-8 py-4 rounded-full text-base transition-all">
              Agendar Demo
            </button>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="max-w-6xl mx-auto mt-24 relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
             {/* Mockup Header */}
             <div className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                </div>
                <div className="flex-1 flex justify-center">
                   <div className="w-64 h-6 bg-zinc-900 rounded-md border border-zinc-800"></div>
                </div>
             </div>
             {/* Mockup Body */}
             <div className="aspect-[16/9] bg-zinc-950 p-6 flex gap-6 opacity-80 backdrop-blur-sm">
                <div className="w-48 hidden sm:flex flex-col gap-3">
                   <div className="h-8 bg-zinc-900 rounded-md"></div>
                   <div className="h-8 bg-zinc-900 rounded-md"></div>
                   <div className="h-8 bg-zinc-900 rounded-md w-3/4"></div>
                </div>
                <div className="flex-1 flex flex-col gap-6">
                   <div className="flex gap-4">
                     <div className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl flex-1 flex flex-col justify-center px-4">
                       <span className="w-16 h-3 bg-zinc-800 rounded mb-2"></span>
                       <span className="w-24 h-6 bg-emerald-400/20 rounded"></span>
                     </div>
                     <div className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl flex-1 flex flex-col justify-center px-4">
                       <span className="w-16 h-3 bg-zinc-800 rounded mb-2"></span>
                       <span className="w-20 h-6 bg-accent/20 rounded"></span>
                     </div>
                     <div className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl flex-1 hidden md:flex flex-col justify-center px-4">
                       <span className="w-16 h-3 bg-zinc-800 rounded mb-2"></span>
                       <span className="w-32 h-6 bg-blue-400/20 rounded"></span>
                     </div>
                   </div>
                   <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl"></div>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Problems & Solution */}
      <section id="solucao" className="py-24 border-t border-zinc-900 bg-zinc-950 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">O caos de gerenciar múltiplos sistemas.</h2>
            <p className="text-zinc-400 text-lg">Para quem escala SaaS, o crescimento traz a fragmentação. Seus dados moram no Firestore, as cobranças no Asaas, os tickets no Zendesk, e você vive pulando entre abas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10">
              <AlertTriangle className="w-8 h-8 text-red-400 mb-6" />
              <h3 className="text-lg font-bold text-zinc-200 mb-3">Monitoramento Cego</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Alertas ignorados, consumo estrangulando o cartão de crédito no GCP e você só descobre quando o Firebase bloqueia suas rotas.</p>
            </div>
            <div className="p-8 rounded-3xl bg-orange-500/5 border border-orange-500/10">
              <DollarSign className="w-8 h-8 text-orange-400 mb-6" />
              <h3 className="text-lg font-bold text-zinc-200 mb-3">Cobranças Manuais</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Planilhas se perdendo, clientes inadimplentes acessando o sistema e controle de faturamento desconectado do uso real do produto.</p>
            </div>
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800">
              <MessageSquare className="w-8 h-8 text-zinc-400 mb-6" />
              <h3 className="text-lg font-bold text-zinc-200 mb-3">Suporte Fragmentado</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Requisições perdidas em e-mails e WhatsApp sem que sua equipe técnica tenha o histórico de uso e os logs de erro daquele cliente ao lado da mensagem.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="funcionalidades" className="py-24 border-t border-zinc-900 bg-zinc-950">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-20">
               <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">Tudo integrado. Controle Absoluto.</h2>
               <p className="text-zinc-400 text-lg">A AnimaSystem foi desenhada como o centro de inteligência definitivo para empresas e desenvolvedores que operam ecossistemas complexos de software.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 auto-rows-[300px]">
               {/* Bento Box 1 - NOC Firebase */}
               <div className="md:col-span-2 rounded-3xl bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] rounded-full group-hover:bg-accent/20 transition-colors"></div>
                  <div className="relative z-10 w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-6">
                    <Database className="w-6 h-6 text-accent" />
                  </div>
                  <div className="relative z-10">
                     <h3 className="font-display font-bold text-2xl mb-2 text-zinc-100">Master NOC Firebase</h3>
                     <p className="text-zinc-400">Extração serverless de métricas, consumo de Firestore e tráfego de múltiplas accounts Google Cloud sem expor dados confidenciais de usuários via "Least Privilege".</p>
                  </div>
               </div>

               {/* Bento Box 2 - Financeiro */}
               <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between group">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-6">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                     <h3 className="font-display font-bold text-xl mb-2 text-zinc-100">Motor de Billing</h3>
                     <p className="text-zinc-400 text-sm">Integração nativa Asaas com PIX, Cartão e Boletos. Gestão de MRR e inadimplência automatizada.</p>
                  </div>
               </div>

               {/* Bento Box 3 - Tickets */}
               <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between group">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-6">
                    <MessageSquare className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                     <h3 className="font-display font-bold text-xl mb-2 text-zinc-100">Help Desk Nativo</h3>
                     <p className="text-zinc-400 text-sm">Abra chamados associados diretamente aos clientes. Análises, anexos e comunicação fluida sem silos limitantes.</p>
                  </div>
               </div>

               {/* Bento Box 4 - Logs & Auditoria */}
               <div className="md:col-span-2 rounded-3xl bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between group relative overflow-hidden">
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none hidden md:block">
                     <ListTree className="w-48 h-48 text-zinc-500" />
                  </div>
                  <div className="relative z-10 w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-6">
                    <Activity className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="relative z-10 max-w-md">
                     <h3 className="font-display font-bold text-2xl mb-2 text-zinc-100">Auditoria Corp. (BigQuery)</h3>
                     <p className="text-zinc-400">Stream de erros críticos e rastreabilidade de eventos arquitetada para sustentar bilhões de logs arquivando dados analíticos em background via BigQuery de baixo custo.</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Security Engine Deep Dive */}
      <section className="py-24 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
             <div className="flex-1">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-6">
                 Segurança
               </div>
               <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">Arquitetura Secura<br/>by Design.</h2>
               <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                 Cuidar da infraestrutura de diversos clientes exige responsabilidade máxima. A AnimaSystem se conecta aos seus projetos Cloud respeitando os padrões Enterprise de isolamento.
               </p>
               
               <div className="space-y-6">
                 <div className="flex gap-4">
                   <div className="mt-1"><ShieldCheck className="w-6 h-6 text-zinc-300" /></div>
                   <div>
                     <h4 className="font-bold text-zinc-200">Least Privilege (IAM)</h4>
                     <p className="text-sm text-zinc-500 mt-1">Nossas Service Accounts operam estritamente como "Monitoring Viewer". Zero acesso a bancos de dados privados ou senhas.</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="mt-1"><Lock className="w-6 h-6 text-zinc-300" /></div>
                   <div>
                     <h4 className="font-bold text-zinc-200">Secret Manager Integrado</h4>
                     <p className="text-sm text-zinc-500 mt-1">Chaves API roteadas e injetadas de forma criptografada apenas no core de extração node. Nada de credenciais em banco de dados aberto.</p>
                   </div>
                 </div>
               </div>
             </div>

             <div className="flex-1 max-w-md w-full relative">
               <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 to-purple-500/20 blur-3xl opacity-50"></div>
               <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative">
                 <pre className="text-xs font-mono text-zinc-400 overflow-x-auto">
                   <code className="text-emerald-400">{'// IAM Binding for Internal Polling'}</code><br/><br/>
                   <span className="text-zinc-300">resource</span> <span className="text-blue-400">"google_project_iam_member"</span> <span className="text-purple-400">"monitor"</span> {'{'}<br/>
                   {'  '}project <span className="text-zinc-500">=</span> <span className="text-amber-300">"client-prod-firebase"</span><br/>
                   {'  '}role    <span className="text-zinc-500">=</span> <span className="text-amber-300">"roles/monitoring.viewer"</span><br/>
                   {'  '}member  <span className="text-zinc-500">=</span> <span className="text-amber-300">"serviceAccount:animasystem@..."</span><br/>
                   {'}'}<br/><br/>
                   <span className="text-zinc-500">/* No access to Datastore or PII */</span>
                 </pre>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-24 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">Planos Transparentes</h2>
            <p className="text-zinc-400 text-lg">Projetado para escalar junto com a sua agência de software ou produto.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
             
             {/* Starter */}
             <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col">
               <h3 className="font-bold text-xl text-zinc-300 mb-2">Starter</h3>
               <p className="text-sm text-zinc-500 mb-6">Para freelancers e microsaas lidando com até 3 apps ativos.</p>
               <div className="mb-8">
                 <span className="text-4xl font-display font-bold text-zinc-100">Grátis</span>
               </div>
               <ul className="space-y-4 mb-8 flex-1">
                 <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500" /> Até 3 Clientes</li>
                 <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500" /> Monito. Firebase (Limitado)</li>
                 <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500" /> Integração Asaas Básica</li>
               </ul>
               <button onClick={onEnter} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 py-3 rounded-full font-medium transition-colors">
                 Iniciar Gratuitamente
               </button>
             </div>

             {/* Pro */}
             <div className="bg-zinc-900 border border-accent rounded-3xl p-8 flex flex-col relative scale-[1.02] shadow-2xl shadow-accent/10">
               <div className="absolute top-0 right-8 -translate-y-1/2 bg-accent text-zinc-950 text-xs font-bold px-3 py-1 rounded-full">
                 Mais Popular
               </div>
               <h3 className="font-bold text-xl text-zinc-300 mb-2">Professional</h3>
               <p className="text-sm text-zinc-500 mb-6">A ferramenta completa para agências lidarem com escala.</p>
               <div className="mb-8">
                 <span className="text-4xl font-display font-bold text-zinc-100">R$ 149</span><span className="text-zinc-500">/mês</span>
               </div>
               <ul className="space-y-4 mb-8 flex-1">
                 <li className="flex items-center gap-3 text-sm text-zinc-100"><Check className="w-4 h-4 text-accent" /> Clientes Ilimitados</li>
                 <li className="flex items-center gap-3 text-sm text-zinc-100"><Check className="w-4 h-4 text-accent" /> NOC Firestore Em Tempo Real</li>
                 <li className="flex items-center gap-3 text-sm text-zinc-100"><Check className="w-4 h-4 text-accent" /> Sistema de Tickets L1/L2</li>
                 <li className="flex items-center gap-3 text-sm text-zinc-100"><Check className="w-4 h-4 text-accent" /> Faturamento Automático PIX</li>
                 <li className="flex items-center gap-3 text-sm text-zinc-100"><Check className="w-4 h-4 text-accent" /> Múltiplas Contas Admin</li>
               </ul>
               <button onClick={onEnter} className="w-full bg-accent hover:bg-accent-hover text-zinc-950 py-3 rounded-full font-bold transition-colors">
                 Assinar Pro
               </button>
             </div>

             {/* Enterprise */}
             <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col">
               <h3 className="font-bold text-xl text-zinc-300 mb-2">Enterprise</h3>
               <p className="text-sm text-zinc-500 mb-6">Monitoramento on-premises em instâncias separadas.</p>
               <div className="mb-8">
                 <span className="text-4xl font-display font-bold text-zinc-100">Custom</span>
               </div>
               <ul className="space-y-4 mb-8 flex-1">
                 <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500" /> Implantação Self-hosted</li>
                 <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500" /> Exportação BigQuery Dedicada</li>
                 <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500" /> SLA & Suporte 24/7</li>
               </ul>
               <button className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 py-3 rounded-full font-medium transition-colors">
                 Falar com Vendas
               </button>
             </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold mb-12 text-center">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-zinc-800 rounded-2xl bg-zinc-900/50 overflow-hidden">
                <button 
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-medium text-zinc-200">{faq.question}</span>
                  <ChevronDown className={cn("w-5 h-5 text-zinc-500 transition-transform", openFaq === index ? "rotate-180" : "rotate-0")} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-zinc-800/50 relative overflow-hidden bg-zinc-900">
         <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
         <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-8">Pronto para tomar o controle?</h2>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">Centralize hoje mesmo a operação dos seus softwares. Sem planilhas, sem dezenas de abas soltas.</p>
            <button 
              onClick={onEnter}
              className="bg-accent hover:bg-accent-hover text-zinc-950 font-bold px-10 py-5 rounded-full text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent/20"
            >
              Criar Conta Gratuita
            </button>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 pt-20 pb-10 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-12 mb-16">
          
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center">
                <LightningLogo className="w-8 h-8" />
              </div>
              <span className="text-xl tracking-tight text-zinc-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                <span className="font-light">Anima</span><span className="font-bold">System</span>
              </span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              O sistema ERP e Monitoramento focado na redução de atrito para agências digitais e criadores de Software.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-zinc-100 mb-4">Produto</h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-accent transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Integração Asaas</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Segurança</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Preços</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-zinc-100 mb-4">Recursos</h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-accent transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Status da API</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Central de Ajuda</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-zinc-100 mb-4">Empresa</h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-accent transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Termos de Serviço</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto px-6 border-t border-zinc-800/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs text-center md:text-left">
            © 2026 AnimaSystem Inc. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
            Todos os Serviços Online (Status: Verde)
          </div>
        </div>
      </footer>

    </div>
  );
}

