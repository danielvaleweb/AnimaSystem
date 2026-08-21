import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Construction, ArrowLeft, Shield, Clock, CheckCircle2, 
  Sparkles, ArrowUpRight, Search, Sliders, RefreshCw, User, Bell, ExternalLink, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ClientAdminView() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('Cliente');
  const [planName, setPlanName] = useState('Profissional');
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    try {
      const confirmedJson = localStorage.getItem('confirmedAsaasPayment');
      if (confirmedJson) {
        const parsed = JSON.parse(confirmedJson);
        if (parsed.customerName) setCustomerName(parsed.customerName);
        if (parsed.plan) setPlanName(parsed.plan);
        if (parsed.orderId) setOrderId(parsed.orderId);
        if (parsed.amount) setAmount(Number(parsed.amount).toFixed(2));
      } else {
        const cachedName = localStorage.getItem('lastCustomerName');
        const cachedPlan = localStorage.getItem('lastPlanName');
        const cachedOrder = localStorage.getItem('lastAsaasOrderId');
        const cachedTotal = localStorage.getItem('lastTotal');
        if (cachedName) setCustomerName(cachedName);
        if (cachedPlan) setPlanName(cachedPlan);
        if (cachedOrder) setOrderId(cachedOrder);
        if (cachedTotal) setAmount(cachedTotal);
      }
    } catch (e) {
      console.warn('Error reading cached order in ClientAdminView:', e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-zinc-900 font-sans pb-24 selection:bg-[#D7FE03] selection:text-black">
      
      {/* Clean Top Bar (NO NAVBAR) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 xl:px-14 pt-8 sm:pt-10 flex items-center justify-between">
        <button 
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border border-zinc-200 shadow-sm text-zinc-800 hover:text-black hover:bg-zinc-50 transition-all font-semibold text-xs cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar ao Início</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-8 xl:px-14 pt-8">
        
        {/* Title Area matching Dashboard style */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Painel do Cliente
              </h1>
              <span className="text-xs bg-[#D7FE03]/20 text-black border border-[#D7FE03] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Ambiente Ativo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Olá, <span className="font-bold text-zinc-900">{customerName}</span>. Bem-vindo ao seu ambiente exclusivo AnimaSystem.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-white border border-zinc-200 rounded-full text-xs font-semibold text-zinc-700 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Pagamento Asaas Reconhecido</span>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout matching Dashboard Image 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Status & Welcome Card (8 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 space-y-6"
          >
            {/* Dark Card Hero */}
            <div className="bg-[#0c0d0e] text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D7FE03]/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#18191a] border border-zinc-800 flex items-center justify-center text-[#D7FE03]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">Assinatura Ativa</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Plano {planName.toUpperCase()}
                  </h2>
                </div>
              </div>

              <p className="text-zinc-300 text-sm leading-relaxed mb-8 max-w-xl">
                O seu pagamento via Asaas foi registrado e confirmado no sistema. A infraestrutura contratada já está associada ao seu cadastro.
              </p>

              <div className="bg-[#18191a] border border-zinc-800 rounded-2xl p-5 mb-8 space-y-3">
                <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Etapas de Liberação</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-[#D7FE03]" />
                    <span>Pagamento confirmado via Asaas Sandbox</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-[#D7FE03]" />
                    <span>Registro no painel financeiro e base de clientes</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-[#D7FE03]" />
                    <span>Provisionamento de workspace exclusivo e suporte VIP</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button 
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#D7FE03] hover:bg-[#c2e502] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  Voltar para o Site Principal
                </button>
                <button 
                  type="button"
                  onClick={() => navigate('/portfolio')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#18191a] hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Ver Portfólio de Projetos
                </button>
              </div>
            </div>

            {/* Feature preview cards in white */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-2">
                <h3 className="text-sm font-bold text-zinc-900">Suporte Dedicado 24/7</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Canal de comunicação direta com a equipe técnica para dúvidas e solicitações emergenciais.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-2">
                <h3 className="text-sm font-bold text-zinc-900">Monitoramento & Métricas</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Acompanhamento em tempo real de acessos, estabilidade e disponibilidade da sua aplicação.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Account Overview (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Status da Assinatura</span>
                <span className="text-xs bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">Ativa</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-400 block font-medium">Cliente:</span>
                  <span className="font-bold text-zinc-900 text-sm">{customerName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Plano Contratado:</span>
                  <span className="font-bold text-zinc-900">Plano {planName}</span>
                </div>
                {amount && (
                  <div>
                    <span className="text-zinc-400 block font-medium">Valor Mensal:</span>
                    <span className="font-bold text-zinc-900 text-sm">R$ {amount.replace('.', ',')}</span>
                  </div>
                )}
                {orderId && (
                  <div>
                    <span className="text-zinc-400 block font-medium">Identificador do Pedido:</span>
                    <span className="font-mono text-zinc-700 text-[11px]">{orderId}</span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-400 block font-medium">Gateway Integrado:</span>
                  <span className="font-bold text-zinc-900">Asaas Pagamentos</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Ambiente:</span>
                  <span className="font-bold text-zinc-900">Animasystem Cloud</span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100">
                <div className="text-[11px] text-zinc-500">
                  Dúvidas sobre sua conta? Fale com a equipe pelo WhatsApp ou e-mail de suporte.
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
