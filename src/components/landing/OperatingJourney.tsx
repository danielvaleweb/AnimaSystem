import { useState } from 'react';
import { 
  Globe, MessageCircle, Bot, MessageSquareText, UserCheck, 
  PenTool, Image as ImageIcon, CheckCircle, TrendingUp, Sparkles,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

export function OperatingJourney() {
  const [activeStep, setActiveStep] = useState<number>(2); // Default to LYA SDR

  const steps = [
    {
      num: '01',
      title: 'Presença digital que capta',
      shortDesc: 'Site profissional integrado',
      fullDesc: 'Seu portal online de alta conversão captura visitantes com formulários inteligentes e conecta o contato instantaneamente ao CRM.',
      icon: Globe,
      color: 'text-emerald-600',
      tag: 'CAPTAÇÃO',
    },
    {
      num: '02',
      title: 'Leads entram por todos os canais',
      shortDesc: 'Centralização de tráfego',
      fullDesc: 'Portais parceiros, campanhas de tráfego, Instagram e WhatsApp caem diretamente no mesmo funil sem perda de dados.',
      icon: MessageCircle,
      color: 'text-teal-600',
      tag: 'MULTICANAL',
    },
    {
      num: '03',
      title: 'LYA SDR atende primeiro',
      shortDesc: 'Resposta imediata 24/7',
      fullDesc: 'A inteligência artificial responde em segundos no WhatsApp, esclarece dúvidas iniciais, coleta dados e agenda horários.',
      icon: Bot,
      color: 'text-emerald-600',
      tag: 'IA SDR 24/7',
    },
    {
      num: '04',
      title: 'LYA Omnichannel centraliza',
      shortDesc: 'Histórico unificado',
      fullDesc: 'Todas as mensagens e áudios ficam registrados no CRM, com transcrição automática de voz para texto.',
      icon: MessageSquareText,
      color: 'text-purple-600',
      tag: 'OMNICHANNEL',
    },
    {
      num: '05',
      title: 'Atendente assume com contexto',
      shortDesc: 'Atendimento humanizado',
      fullDesc: 'O corretor ou consultor assume a conversa já sabendo exatamente o que o lead busca, sem fazer perguntas repetitivas.',
      icon: UserCheck,
      color: 'text-amber-600',
      tag: 'HUMAN + AI',
    },
    {
      num: '06',
      title: 'LYA Editor melhora os anúncios',
      shortDesc: 'Copywriting automático',
      fullDesc: 'Descrições persuasivas geradas em segundos aumentam o engajamento e as visualizações dos seus produtos.',
      icon: PenTool,
      color: 'text-rose-600',
      tag: 'COPYWRITING',
    },
    {
      num: '07',
      title: 'LYA Studio valoriza imagens',
      shortDesc: 'Virtual staging realista',
      fullDesc: 'Fotos de espaços vazios ou com iluminação fraca ganham decoração moderna e luz de estúdio profissional.',
      icon: ImageIcon,
      color: 'text-pink-600',
      tag: 'STAGING IA',
    },
    {
      num: '08',
      title: 'CRM e ERP fecham o ciclo',
      shortDesc: 'Contrato e cobrança',
      fullDesc: 'Geração de propostas, assinatura digital e régua automática de faturamento PIX/Boleto sem burocracia.',
      icon: CheckCircle,
      color: 'text-emerald-600',
      tag: 'FECHAMENTO',
    },
    {
      num: '09',
      title: 'Gestão decide com inteligência',
      shortDesc: 'BI e métricas vivas',
      fullDesc: 'Relatórios em tempo real mostram ROI por canal, conversão por atendente e faturamento consolidado.',
      icon: TrendingUp,
      color: 'text-emerald-600',
      tag: 'INTELIGÊNCIA',
    },
  ];

  return (
    <section id="jornada" className="py-20 sm:py-28 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>FLUXO OPERACIONAL CONTÍNUO</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Como uma operação inteligente opera com IA
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Do primeiro clique do lead ao fechamento do contrato: veja como cada etapa do fluxo se conecta sem ruído e sem retrabalho.
          </p>
        </div>

        {/* 9 Step Interactive Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Steps Navigator List (Left) */}
          <div className="lg:col-span-6 space-y-2.5">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = activeStep === idx;
              return (
                <div
                  key={step.num}
                  onClick={() => setActiveStep(idx)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]'
                      : 'bg-slate-50 hover:bg-slate-100/80 text-slate-800 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${
                      isSelected ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {step.num}
                    </span>
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        <span>{step.title}</span>
                      </div>
                      <div className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {step.shortDesc}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {step.tag}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Step Showcase Card (Right) */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full">
                    <span>ETAPA {steps[activeStep].num} DE 09</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Status: Ativo na Plataforma</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    {(() => {
                      const ActiveIcon = steps[activeStep].icon;
                      return <ActiveIcon className="w-7 h-7" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      {steps[activeStep].tag}
                    </span>
                    <h3 className="text-2xl font-black text-white">
                      {steps[activeStep].title}
                    </h3>
                  </div>
                </div>

                <p className="text-base text-slate-300 leading-relaxed">
                  {steps[activeStep].fullDesc}
                </p>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Vantagem Competitiva:
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Elimina gargalos humanos, acelera o tempo de resposta para menos de 5 segundos e garante que 100% dos dados fiquem centralizados no CRM.
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400">
                  <span>Conexão nativa com WhatsApp e ERP</span>
                  <span className="text-emerald-400 font-semibold">100% Automatizado</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
