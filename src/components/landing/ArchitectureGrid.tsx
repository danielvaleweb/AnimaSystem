import { useState } from 'react';
import { 
  Bot, MessageSquareText, PenTool, Image as ImageIcon, Coins,
  Building2, LineChart, Globe, Zap, ArrowRight, ShieldCheck,
  CreditCard, Sparkles, Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface ArchitectureGridProps {
  onOpenDemoModal: () => void;
}

export function ArchitectureGrid({ onOpenDemoModal }: ArchitectureGridProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'ai' | 'core'>('all');

  return (
    <section id="ia-first" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ARQUITETURA AI FIRST</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Tudo o que sua operação precisa. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Agora com IA no centro.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Do primeiro atendimento no WhatsApp à gestão financeira, da captação ao fechamento: conectamos inteligência artificial, operação e dados em uma única plataforma.
          </p>
        </div>

        {/* 4 AI SUITE CARDS (Pastel Tints) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Módulos Nativos de Inteligência Artificial
            </div>
            <span className="text-xs text-emerald-600 font-semibold">4 agentes ativos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: LYA SDR (Pastel Emerald) */}
            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all group">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-100/90 text-emerald-800 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full mb-4">
                  <Bot className="w-3 h-3 text-emerald-700" />
                  <span>IA SDR • ATENDIMENTO</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  LYA SDR
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Atende e qualifica leads 24/7 no WhatsApp com inteligência contextual. Responde dúvidas, agenda visitas e encaminha para o corretor com perfil pronto.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-emerald-200/70 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                <span>Atendimento 24/7</span>
                <span className="text-emerald-500">→</span>
              </div>
            </div>

            {/* Card 2: LYA Omnichannel (Pastel Purple) */}
            <div className="bg-[#F5EEFD] border border-[#E5D2FA] rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all group">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-purple-100/90 text-purple-800 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full mb-4">
                  <MessageSquareText className="w-3 h-3 text-purple-700" />
                  <span>IA • CRM OMNICHANNEL</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  LYA Omnichannel
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Centraliza as conversas do time com histórico unificado, status dinâmico no CRM e transcrição inteligente de áudios do WhatsApp.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-purple-200/70 flex items-center justify-between text-xs text-purple-800 font-semibold">
                <span>Transcrição de Áudio</span>
                <span className="text-purple-500">→</span>
              </div>
            </div>

            {/* Card 3: LYA Editor (Pastel Amber) */}
            <div className="bg-[#FEF9EC] border border-[#FDE8B3] rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all group">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-100/90 text-amber-900 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full mb-4">
                  <PenTool className="w-3 h-3 text-amber-800" />
                  <span>IA • COPYWRITING</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                  LYA Editor
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Descrições profissionais de produtos e serviços em segundos. A IA converte características técnicas em textos atraentes e otimizados para busca e SEO.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-amber-200/70 flex items-center justify-between text-xs text-amber-900 font-semibold">
                <span>Copywriting & SEO</span>
                <span className="text-amber-600">→</span>
              </div>
            </div>

            {/* Card 4: LYA Studio (Pastel Rose) */}
            <div className="bg-[#FDF1F2] border border-[#FBD5DA] rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all group">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-rose-100/90 text-rose-900 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full mb-4">
                  <ImageIcon className="w-3 h-3 text-rose-800" />
                  <span>IA • IMAGEM & DESIGN</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-rose-800 transition-colors">
                  LYA Studio
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Fotos comuns viram imagens profissionais de estúdio. A IA melhora a iluminação, remove ruídos visuais e gera encenação virtual de alta qualidade.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-rose-200/70 flex items-center justify-between text-xs text-rose-900 font-semibold">
                <span>Virtual Staging HD</span>
                <span className="text-rose-500">→</span>
              </div>
            </div>

          </div>
        </div>

        {/* KOINS FEATURED BANNER CARD (Cyber Neon / Dark Navy) */}
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
                <Coins className="w-3.5 h-3.5" />
                <span>KOINS • A MOEDA DA INTELIGÊNCIA ARTIFICIAL</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                LYA conectada à sua operação real com consumo flexível.
              </h3>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Esqueça pacotes engessados. Com o sistema de Koins, sua empresa usa IA para WhatsApp, redação e tratamento de imagens a partir de um saldo único e 100% previsível.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col items-start lg:items-end">
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 w-full sm:w-auto shadow-inner text-left">
                <div className="text-[10px] uppercase font-bold text-slate-400">Saldo Exemplo da Operação</div>
                <div className="text-2xl font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <Coins className="w-5 h-5" /> 12.482 Koins
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Previsão: 340 atendimentos IA restantes</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 CORE SYSTEMS CARDS */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            Pilares de Gestão e Operação
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Core Card 1: Vendas */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full mb-4">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>ERP • VENDAS</span>
                </div>
                <h4 className="text-xl font-bold text-slate-900">
                  Plataforma Vendas (CRM)
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  CRM completo com funil visual de negócios, automação de tarefas, distribuição inteligente de leads e acompanhamento de propostas em tempo real.
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Pipeline Kanban visual</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Metas e comissões automáticas</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Integração com portais e redes</li>
              </ul>
            </div>

            {/* Core Card 2: Locação / Gestão */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full mb-4">
                  <LineChart className="w-3.5 h-3.5" />
                  <span>ERP • GESTÃO FINANCEIRA</span>
                </div>
                <h4 className="text-xl font-bold text-slate-900">
                  Plataforma Gestão & Cobrança
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Administração completa de contratos, emissão de cobranças automáticas PIX/Boleto, controle de inadimplência e conciliação bancária sem atrito.
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Faturamento e régua de cobrança</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Repasses e extratos detalhados</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Diminuição de inadimplência</li>
              </ul>
            </div>

            {/* Core Card 3: Sites */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full mb-4">
                  <Globe className="w-3.5 h-3.5" />
                  <span>SITE • SEO & PERFORMANCE</span>
                </div>
                <h4 className="text-xl font-bold text-slate-900">
                  Sites de Alta Conversão
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Portais modernos, responsivos e otimizados para mecanismos de busca (SEO). Carregamento ultra rápido e conexão instantânea ao CRM.
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Carregamento em menos de 1 segundo</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Layouts focados em conversão</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Captura automática de contatos</li>
              </ul>
            </div>

          </div>
        </div>

        {/* 4 EXTENDED MODULES MINI-GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 text-center">
            <div className="text-xs font-bold text-slate-900">Hub de Leads</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Gestão centralizada de canais</div>
          </div>
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 text-center">
            <div className="text-xs font-bold text-slate-900">Inteligência & BI</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Indicadores vivos e dashboards</div>
          </div>
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 text-center">
            <div className="text-xs font-bold text-slate-900">Gateway Pay</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Cobranças seguras integradas</div>
          </div>
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 text-center">
            <div className="text-xs font-bold text-slate-900">Google Cloud Núcleo</div>
            <div className="text-[11px] text-slate-500 mt-0.5">SLA 99.9% e backup blindado</div>
          </div>
        </div>

      </div>
    </section>
  );
}
