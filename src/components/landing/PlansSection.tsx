import { useState } from 'react';
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface PlansSectionProps {
  onOpenRegisterModal: () => void;
  onOpenDemoModal: () => void;
}

export function PlansSection({ onOpenRegisterModal, onOpenDemoModal }: PlansSectionProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      name: 'Starter',
      description: 'Ideal para empresas que precisam de uma ferramenta pronta e ágil para organizar sua operação comercial.',
      priceMonthly: 'R$ 60',
      priceAnnual: 'R$ 48',
      highlighted: false,
      tag: 'OPERACIONAL',
      features: [
        'Sistema pronto para uso imediato',
        'Cadastro e gestão de clientes ilimitados',
        'Pipeline visual de vendas (Kanban)',
        'Controle de propostas e pedidos',
        'Painel administrativo web e mobile',
        'Hospedagem e banco de dados inclusos',
        'Suporte técnico por e-mail e WhatsApp',
      ],
      ctaText: 'Começar com Starter',
      action: onOpenRegisterModal,
    },
    {
      name: 'Pro',
      description: 'A solução completa: site de alta conversão, CRM integrado e módulos de inteligência artificial LYA.',
      priceMonthly: 'R$ 149',
      priceAnnual: 'R$ 119',
      highlighted: true,
      tag: 'MAIS ESCOLHIDO • AI FIRST',
      features: [
        'Tudo do plano Starter',
        'Site profissional de alta performance sob medida',
        'Integração com LYA SDR (WhatsApp 24/7)',
        'LYA Omnichannel com transcrição de áudios',
        'LYA Editor (Copywriting e SEO automático)',
        'LYA Studio (Virtual Staging básico)',
        'Domínio personalizado com Certificado SSL',
        'Otimização avançada para o Google (SEO)',
        'Clientes e propostas 100% ilimitados',
        'Suporte prioritário dedicado',
      ],
      ctaText: 'Escolher Pro',
      action: onOpenDemoModal,
    },
    {
      name: 'Enterprise',
      description: 'Para grandes operações que necessitam de sistemas sob medida, aplicativos mobile e infraestrutura dedicada.',
      priceMonthly: 'Sob consulta',
      priceAnnual: 'Sob consulta',
      highlighted: false,
      tag: 'ESCALA CORPORATIVA',
      features: [
        'Tudo do plano Profissional',
        'Aplicativos nativos Android e iOS',
        'Cluster Google Cloud dedicado com multi-região',
        'APIs REST customizadas e Webhooks ilimitados',
        'Geolocalização e rastreamento em tempo real',
        'Volume massivo de Koins para IA corporativa',
        'SLA garantido de 99.9% de disponibilidade',
        'Gerente de sucesso de conta dedicado',
      ],
      ctaText: 'Falar com Especialista',
      action: onOpenDemoModal,
    },
  ];

  return (
    <section id="planos" className="relative bg-[#111111] text-white py-20 sm:py-28 overflow-hidden border-b border-zinc-800">
      
      {/* Background Subtle Gradients & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D7FE03]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#83AF3B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#D7FE03] uppercase tracking-widest mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NOSSOS PLANOS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Planos flexíveis para cada estágio do seu negócio
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed font-light">
            Comece simples ou dê o salto para uma operação 100% AI First com atendimento automatizado e gestão integrada.
          </p>

          {/* Billing Cycle Switch */}
          <div className="mt-8 inline-flex items-center bg-zinc-900/90 p-1.5 rounded-full border border-zinc-700/80 text-xs font-bold shadow-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-black text-white border border-zinc-700 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-[#D7FE03] text-black shadow-xs font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Anual</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                billingCycle === 'annual' ? 'bg-black text-[#D7FE03]' : 'bg-[#D7FE03] text-black'
              }`}>
                -20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={plan.name}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
                  plan.highlighted
                    ? 'bg-zinc-900/95 text-white border-2 border-[#D7FE03] shadow-[0_0_35px_rgba(215,254,3,0.18)] scale-[1.02] lg:-translate-y-2'
                    : 'bg-zinc-900/60 backdrop-blur-sm text-white border border-zinc-800/90 shadow-sm hover:border-zinc-700'
                }`}
              >
                {/* Floating Tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full ${
                    plan.highlighted
                      ? 'bg-[#D7FE03] text-black shadow-xs'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                  }`}>
                    {plan.tag}
                  </span>
                  {plan.highlighted && (
                    <span className="text-xs text-[#D7FE03] font-bold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-current" /> Recomendado
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                  <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${
                    plan.highlighted ? 'text-zinc-300' : 'text-zinc-400'
                  }`}>
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mt-6 mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white">{price}</span>
                      {price !== 'Sob consulta' && (
                        <span className={`text-xs ${plan.highlighted ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          /mês
                        </span>
                      )}
                    </div>
                    {billingCycle === 'annual' && price !== 'Sob consulta' && (
                      <div className="text-[11px] text-[#D7FE03] font-bold mt-1">
                        Faturado anualmente com 20% de desconto
                      </div>
                    )}
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3 text-xs sm:text-sm border-t border-zinc-800 pt-6">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${
                          plan.highlighted ? 'text-[#D7FE03]' : 'text-[#83AF3B]'
                        }`} />
                        <span className={plan.highlighted ? 'text-zinc-200' : 'text-zinc-300'}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA Button */}
                <div className="mt-8 pt-4">
                  <button
                    onClick={plan.action}
                    className={`w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      plan.highlighted
                        ? 'bg-[#D7FE03] hover:bg-[#c4e602] text-black shadow-md'
                        : 'bg-white hover:bg-zinc-200 text-black shadow-xs'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Trust Note */}
        <div className="mt-12 text-center text-xs text-zinc-400 flex flex-wrap items-center justify-center gap-6">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#83AF3B]" /> Sem fidelidade obrigatória</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-[#D7FE03]" /> Ativação e onboarding guiado</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#83AF3B]" /> Migração de dados facilitada</span>
        </div>

      </div>
    </section>
  );
}
