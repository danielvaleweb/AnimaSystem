import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Check, ArrowLeft, Sparkles, Shield, Zap, ArrowUpRight, 
  CheckCircle2, ChevronRight, HelpCircle, Layers, Server, 
  Headphones, Globe, Lock, Smartphone, BarChart3, Database, MessageSquare
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type PlanData = {
  id: string;
  name: string;
  price: string;
  desc: string;
  tagline: string;
  features: string[];
  detailedBenefits: {
    category: string;
    items: { title: string; desc: string }[];
  }[];
};

export default function PlanDetailView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { planName: rawPlanName } = useParams<{ planName: string }>(); 
  
  // Normalize plan name from params or pathname
  let selectedPlanId = (rawPlanName || '').toLowerCase();
  if (!selectedPlanId || selectedPlanId === 'undefined') {
    const path = location.pathname.toLowerCase();
    if (path.includes('starter')) selectedPlanId = 'starter';
    else if (path.includes('pro')) selectedPlanId = 'profissional';
    else if (path.includes('enterprise')) selectedPlanId = 'enterprise';
    else selectedPlanId = 'profissional';
  } else {
    if (selectedPlanId.includes('starter')) selectedPlanId = 'starter';
    else if (selectedPlanId.includes('pro')) selectedPlanId = 'profissional';
    else if (selectedPlanId.includes('enterprise')) selectedPlanId = 'enterprise';
  }

  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null);
  const [otherPlans, setOtherPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, selectedPlanId]);

  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        const docRef = doc(db, 'settings', 'landingPage');
        const docSnap = await getDoc(docRef);
        
        const p1: PlanData = { 
          id: 'starter', 
          name: 'Starter', 
          tagline: 'Ideal para quem busca agilidade, controle simplificado e operação enxuta.',
          desc: 'Para empresas que precisam de uma ferramenta pronta, ágil e focada em resultados imediatos sem complicação.', 
          price: 'R$ 60', 
          features: [
            'Sistema pronto para uso imediato sem tempo de espera',
            'Cadastro e gestão simplificada de clientes e leads',
            'Painel de controle básico com métricas essenciais de desempenho',
            'Acesso web 100% responsivo para smartphone, tablet e desktop',
            'Hospedagem em nuvem de alta confiabilidade inclusa',
            'Suporte padrão em horário comercial via chamado'
          ],
          detailedBenefits: [
            {
              category: 'Gestão & Produtividade',
              items: [
                { title: 'Ativação Instantânea', desc: 'Sem burocracia ou longos prazos de setup. Comece a usar em minutos após a confirmação.' },
                { title: 'Cadastro de Clientes', desc: 'Centralize dados, contatos e histórico dos seus clientes de forma prática.' },
                { title: 'Painel com Métricas', desc: 'Acompanhe números essenciais de vendas e atendimento de forma visual e clara.' },
              ]
            },
            {
              category: 'Tecnologia & Acesso',
              items: [
                { title: '100% Responsivo', desc: 'Acesse em qualquer dispositivo com interface otimizada para celular e computador.' },
                { title: 'Nuvem Segura', desc: 'Armazenamento protegido com criptografia e redundância de servidores.' },
                { title: 'Suporte Comercial', desc: 'Atendimento e suporte técnico em dias úteis para tirar todas as dúvidas.' },
              ]
            }
          ]
        };

        const p2: PlanData = { 
          id: 'profissional', 
          name: 'Profissional', 
          tagline: 'O plano mais completo para acelerar suas vendas, conversão e presença digital.',
          desc: 'Para empresas que buscam autoridade, presença digital de alto impacto e máxima taxa de conversão.', 
          price: 'R$ 149', 
          features: [
            'Site sob medida com design visual exclusivo e refinado',
            'Projeto visual totalmente personalizado com a identidade da sua marca',
            'Integração direta com WhatsApp comercial e CRM de vendas',
            'Otimização SEO de alta performance para rankear no Google',
            'Relatórios mensais de métricas, acessos e performance',
            'Suporte prioritário via WhatsApp dedicado com atendimento rápido',
            'Infraestrutura cloud ultrarrápida com CDN global integrada',
            'Formulários inteligentes de captura de leads em tempo real'
          ],
          detailedBenefits: [
            {
              category: 'Presença Digital & Conversão',
              items: [
                { title: 'Design Visual Exclusivo', desc: 'Criado sob medida respeitando a paleta e identidade visual exclusiva da sua empresa.' },
                { title: 'SEO de Alto Desempenho', desc: 'Indexação otimizada no Google para atrair clientes orgânicos qualificados.' },
                { title: 'Integração WhatsApp & CRM', desc: 'Botões inteligentes de contato direto e conexão com sistemas de atendimento.' },
                { title: 'Captura Inteligente de Leads', desc: 'Formulários rápidos e integrados que notificam novos contatos instantaneamente.' },
              ]
            },
            {
              category: 'Performance & Infraestrutura',
              items: [
                { title: 'Velocidade Ultrarrápida', desc: 'Carregamento instantâneo para reduzir taxa de rejeição e maximizar conversões.' },
                { title: 'Certificado SSL e Proteção Cloud', desc: 'Criptografia HTTPS de ponta a ponta e proteção contra invasões.' },
                { title: 'Relatórios de Acesso e Métricas', desc: 'Painel analítico para acompanhar o crescimento contínuo do seu negócio.' },
                { title: 'Suporte Prioritário VIP', desc: 'Fila prioritária de suporte direto com especialistas dedicados.' },
              ]
            }
          ]
        };

        const p3: PlanData = { 
          id: 'enterprise', 
          name: 'Enterprise', 
          tagline: 'Engenharia de software personalizada, aplicativos sob medida e SLA VIP.',
          desc: 'Para empresas de grande porte que necessitam de arquitetura de software dedicada e personalizada.', 
          price: 'Sob consulta', 
          features: [
            'Sistemas e softwares 100% personalizados para a sua regra de negócio',
            'Aplicativos nativos Android e iOS desenvolvidos sob medida',
            'Infraestrutura em nuvem dedicada de alta disponibilidade e escala',
            'SLA de atendimento crítico garantido contratualmente',
            'Suporte 24/7 VIP incluso sem custos adicionais',
            'Gerente de contas e engenheiro de software exclusivo',
            'Banco de dados isolado e ambiente exclusivo de alta segurança',
            'Treinamento e onboarding para toda a sua equipe'
          ],
          detailedBenefits: [
            {
              category: 'Desenvolvimento Personalizado',
              items: [
                { title: 'Softwares Sob Medida', desc: 'Arquitetura construída exatamente para atender seus fluxos internos e operacionais.' },
                { title: 'Apps Nativos Android e iOS', desc: 'Aplicativos completos publicados nas lojas oficiais para seus clientes e equipe.' },
                { title: 'Banco de Dados Isolado', desc: 'Ambiente exclusivo com isolamento de dados e compliance de segurança avançado.' },
              ]
            },
            {
              category: 'Suporte VIP & Escala',
              items: [
                { title: 'Suporte 24/7 Dedicado', desc: 'Plantão ininterrupto com engenheiros seniores disponíveis a qualquer momento.' },
                { title: 'SLA Contratual Garantido', desc: 'Garantia de resposta imediata para incidentes operacionais críticos.' },
                { title: 'Gerente de Contas Exclusivo', desc: 'Acompanhamento estratégico contínuo para evolução tecnológica do seu projeto.' },
              ]
            }
          ]
        };

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.plan1Name) p1.name = data.plan1Name;
          if (data.plan1Desc) p1.desc = data.plan1Desc;
          if (data.plan1Price) p1.price = data.plan1Price;
          if (data.plan1Features) p1.features = data.plan1Features.split('\n').filter(Boolean);

          if (data.plan2Name) p2.name = data.plan2Name;
          if (data.plan2Desc) p2.desc = data.plan2Desc;
          if (data.plan2Price) p2.price = data.plan2Price;
          if (data.plan2Features) p2.features = data.plan2Features.split('\n').filter(Boolean);

          if (data.plan3Name) p3.name = data.plan3Name;
          if (data.plan3Desc) p3.desc = data.plan3Desc;
          if (data.plan3Price) p3.price = data.plan3Price;
          if (data.plan3Features) p3.features = data.plan3Features.split('\n').filter(Boolean);
        }
        
        const allPlans = [p1, p2, p3];
        const current = allPlans.find(p => p.id === selectedPlanId) || p2;
        const others = allPlans.filter(p => p.id !== current.id);
        
        setCurrentPlan(current);
        setOtherPlans(others);
      } catch (err) {
        console.error("Error fetching plan data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlanData();
  }, [selectedPlanId]);

  const handleSubscribe = (id: string) => {
    if (id === 'enterprise') {
      navigate(`/checkout?plan=${id}&support=true`);
    } else {
      navigate(`/adicionar-servicos?plan=${id}`);
    }
  };

  if (loading || !currentPlan) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-zinc-900 font-sans pb-28 selection:bg-[#D7FE03] selection:text-black">
      
      {/* Top Bar: Back Button, Brand, and Immediate Action (NO NAVBAR as requested) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 flex items-center justify-between">
        <button 
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border border-zinc-200 shadow-sm text-zinc-800 hover:text-black hover:bg-zinc-50 transition-all font-semibold text-xs cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar</span>
        </button>

        {/* Brand Logo AnimaSystem */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-all select-none"
        >
          <span className="text-xl font-sans tracking-tight">
            <span className="font-light text-zinc-400">Anima</span>
            <span className="font-bold text-black tracking-tight">System</span>
          </span>
        </div>

        {/* Top Subscribe CTA Button */}
        <button 
          type="button"
          onClick={() => handleSubscribe(currentPlan.id)}
          className="px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <span>Assinar</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Container: Focused Purely on Benefits */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-10">
        
        {/* Hero Card: Black Luxury aesthetic with Neon #D7FE03 details */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0c0d0e] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden"
        >
          {/* Neon Glow Blur in Background */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D7FE03]/15 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10">
            
            {/* Header badges */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest bg-[#D7FE03] text-black px-3.5 py-1 rounded-full shadow-xs">
                  Plano Selecionado
                </span>
                <span className="text-xs text-zinc-400 font-semibold">
                  AnimaSystem Cloud
                </span>
              </div>

              <div className="flex items-baseline gap-2 bg-[#161719] border border-zinc-800 rounded-2xl px-5 py-2">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentPlan.price}
                </span>
                {!currentPlan.price.includes('/') && currentPlan.price !== 'Sob consulta' && (
                  <span className="text-zinc-400 text-xs font-semibold">/mês</span>
                )}
              </div>
            </div>

            {/* Plan Title & Tagline */}
            <div className="max-w-3xl mb-8 space-y-2">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Plano {currentPlan.name}
              </h1>
              <p className="text-base sm:text-lg text-zinc-300 font-normal leading-relaxed">
                {currentPlan.desc}
              </p>
            </div>

            {/* Quick Summary Feature Pill Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
              {currentPlan.features.map((feature, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 bg-[#161719]/90 border border-zinc-800/80 rounded-2xl p-4 transition-all hover:border-zinc-700"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#D7FE03] text-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-200 font-medium leading-snug">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Big Action CTA to Subscribe */}
            <div className="pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-400">
                Ativação imediata via PIX • Cancele quando quiser pelo painel
              </div>

              <button 
                type="button"
                onClick={() => handleSubscribe(currentPlan.id)}
                className="w-full sm:w-auto px-10 py-4 rounded-full bg-[#D7FE03] hover:bg-[#c2e502] text-black font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Assinar {currentPlan.name} Agora</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

          </div>
        </motion.div>

        {/* Detailed Benefits Breakdown Section */}
        <div className="space-y-6">
          <div className="text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Todos os Benefícios Detalhados
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Confira tudo o que sua empresa ganha ao contratar o Plano {currentPlan.name}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPlan.detailedBenefits.map((section, sIdx) => (
              <div 
                key={sIdx}
                className="bg-white rounded-3xl p-7 sm:p-8 border border-zinc-200/80 shadow-sm space-y-5"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-black font-bold">
                    <Sparkles className="w-5 h-5 text-zinc-800" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                      {section.category}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-medium">Recursos Inclusos</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {section.items.map((item, iIdx) => (
                    <div key={iIdx} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-900">
                        <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-xs text-zinc-500 pl-6 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust & Guarantee Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-black mb-3">
              <Shield className="w-5 h-5 text-zinc-800" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900">Deploy Seguro</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Infraestrutura de nuvem moderna com monitoramento contínuo e backups programados.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-black mb-3">
              <Zap className="w-5 h-5 text-zinc-800" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900">Liberação Imediata</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Pagamento facilitado via PIX com aprovação instantânea e início imediato do atendimento.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-black mb-3">
              <Headphones className="w-5 h-5 text-zinc-800" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900">Atendimento Dedicado</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Equipe técnica sempre pronta para auxiliar no crescimento e suporte da sua solução.
            </p>
          </div>
        </div>

        {/* Main Subscribe Button in Center of Page */}
        <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Pronto para começar?</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
              Assine o Plano {currentPlan.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Clique para avançar para as opções de personalização e checkout.
            </p>
          </div>

          <button 
            type="button"
            onClick={() => handleSubscribe(currentPlan.id)}
            className="w-full sm:w-auto px-10 py-4 rounded-full bg-black hover:bg-zinc-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Assinar {currentPlan.name}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* OTHER PLANS PLACED AT THE VERY BOTTOM */}
        <div className="pt-12 border-t border-zinc-200/80 space-y-6">
          <div className="text-center">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Comparar Opções</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Outros Planos Disponíveis
            </h3>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1">
              Caso queira conhecer ou assinar outra opção da AnimaSystem.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {otherPlans.map((plan) => (
              <div 
                key={plan.id}
                className="bg-white border border-zinc-200/90 rounded-3xl p-7 flex flex-col justify-between hover:border-black transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="text-xl font-extrabold text-zinc-900 tracking-tight">{plan.name}</h4>
                      <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{plan.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xl font-black text-zinc-900">{plan.price}</span>
                      {!plan.price.includes('/') && plan.price !== 'Sob consulta' && (
                        <span className="text-zinc-400 text-xs block font-semibold">/mês</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2 my-5 pt-3 border-t border-zinc-100">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-zinc-700 text-xs font-medium">
                        <Check className="w-3.5 h-3.5 text-black shrink-0" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
                  <button 
                    type="button"
                    onClick={() => navigate(`/planos/${plan.id}`)}
                    className="w-full py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Ver Benefícios
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSubscribe(plan.id)}
                    className="w-full py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs text-center"
                  >
                    Assinar {plan.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
