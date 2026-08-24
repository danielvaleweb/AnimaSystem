import { Sparkles, Layers, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface DarkPhilosophySectionProps {
  onOpenDemoModal: () => void;
}

export function DarkPhilosophySection({ onOpenDemoModal }: DarkPhilosophySectionProps) {
  return (
    <section className="relative bg-[#111111] text-white py-20 sm:py-28 overflow-hidden border-b border-zinc-800">
      
      {/* Background Subtle Gradients & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D7FE03]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#83AF3B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#D7FE03] uppercase tracking-widest mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NOVA FORMA DE OPERAR</span>
        </div>

        {/* Big Statement Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl leading-[1.15]">
          Não é uma ferramenta de IA. <br />
          É uma <span className="text-[#D7FE03] underline decoration-[#D7FE03]/40 underline-offset-8">nova forma de operar</span> negócios.
        </h2>

        {/* 2-Column Comparative Copy */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 border-t border-zinc-800 pt-10">
          
          {/* Left Column: The Problem / The Modern Market Friction */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              O Cenário Atual do Mercado
            </div>
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-light">
              O mercado ficou mais rápido, mais conectado e mais disputado. <strong className="text-white font-medium">Lead esfria em minutos</strong>. Anúncio genérico perde clique. Atendimento demorado custa vendas valiosas e dados dispersos em planilhas criam gargalos invisíveis.
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Equipes sobrecarregadas perdem horas respondendo mensagens repetitivas, criando descrições manuais e tentando sincronizar o WhatsApp pessoal com o sistema de gestão.
            </p>
          </div>

          {/* Right Column: The AI First Solution */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D7FE03] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D7FE03]" />
              A Camada Viva de Inteligência
            </div>
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-light">
              A IA deixou de ser uma funcionalidade isolada e passa a ser <strong className="text-white font-semibold">uma camada viva sobre a operação</strong>: atendendo leads no WhatsApp 24/7, qualificando contatos, transcrevendo áudios, criando descrições e conectando tudo ao CRM e ERP.
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Tudo integrado em tempo real. O atendente assume a conversa já sabendo o perfil do lead, o orçamento e a necessidade exata.
            </p>
          </div>

        </div>

        {/* Highlight Callout Box */}
        <div className="mt-14 p-8 sm:p-10 rounded-3xl bg-zinc-900 border border-zinc-800 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#D7FE03]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="text-xs font-bold uppercase tracking-widest text-[#D7FE03] mb-2">
                O DIFERENCIAL DEFINITIVO
              </div>
              <p className="text-xl sm:text-2xl font-black text-white leading-snug">
                "Quem usa a nossa plataforma não adiciona IA à rotina. <span className="text-[#D7FE03]">Coloca inteligência no centro da operação</span>."
              </p>
            </div>

            <button
              onClick={onOpenDemoModal}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#D7FE03] hover:bg-[#c4e602] transition-colors shadow-lg shrink-0 cursor-pointer"
            >
              <span>Ver na prática</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
