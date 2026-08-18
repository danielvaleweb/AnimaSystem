import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, ShieldCheck, Headphones, Zap, ArrowUpRight, CheckCircle2, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AddServicesView() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const planName = (searchParams.get('plan') || 'starter').toLowerCase();

  const [selectedSupport, setSelectedSupport] = useState<boolean>(true);

  const planTitles: Record<string, string> = {
    starter: 'Plano Starter',
    profissional: 'Plano Profissional',
    pro: 'Plano Profissional',
    enterprise: 'Plano Enterprise',
  };

  const currentPlanTitle = planTitles[planName] || 'Plano Selecionado';

  const handleContinueWithSupport = () => {
    navigate(`/checkout?plan=${planName}&support=true`);
  };

  const handleSkipSupport = () => {
    navigate(`/checkout?plan=${planName}&support=false`);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-zinc-900 font-sans pb-24 selection:bg-[#D7FE03] selection:text-black">
      
      {/* Clean Top Bar (NO NAVBAR) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 flex items-center justify-between">
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

        <div className="w-16"></div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 pt-8">
        
        {/* Title Area */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Adicionar Serviços
            </h1>
            <span className="text-xs bg-zinc-200 text-zinc-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Etapa 1 de 2
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            Personalize o seu {currentPlanTitle} antes de finalizar o pedido.
          </p>
        </div>

        {/* Support Service Card (Styled with Dashboard visual tokens) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 mb-6 shadow-sm relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0c0d0e] flex items-center justify-center text-[#D7FE03] shrink-0 shadow-sm">
                <Headphones className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-[#D7FE03] text-black font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Recomendado
                  </span>
                  <span className="text-xs text-zinc-400 font-semibold">Exclusivo Starter & Pro</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                  Suporte Técnico 24 Horas VIP
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                  Atendimento ininterrupto por WhatsApp direto com engenheiro especializado (L2/L3).
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-zinc-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-zinc-100">
              <div className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                + R$ 50,00
              </div>
              <span className="text-xs text-zinc-500 font-semibold block">/mês adicionais</span>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-3 gap-3 mb-8 pt-4 border-t border-zinc-100">
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Plantão 24/7 Real</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                Cobertura completa nos fins de semana, madrugadas e feriados nacionais.
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>SLA de 15 Minutos</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                Fila prioritária com tempo de resposta garantido para qualquer chamado.
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Monitoramento Proativo</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                Verificação constante da saúde da sua aplicação e infraestrutura.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleContinueWithSupport}
              className="w-full py-4 px-6 rounded-full bg-[#D7FE03] hover:bg-[#c2e502] text-black font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-black stroke-[3]" /> Adicionar Suporte 24h ao Carrinho
            </button>
            <button
              type="button"
              onClick={handleSkipSupport}
              className="w-full py-4 px-6 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer text-center"
            >
              Agora Não (Seguir sem adicional)
            </button>
          </div>
        </motion.div>

        {/* Bottom note */}
        <div className="text-center text-xs text-zinc-400">
          Você poderá gerenciar, incluir ou remover serviços adicionais quando desejar através do painel.
        </div>

      </main>
    </div>
  );
}
