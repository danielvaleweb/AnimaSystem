import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, ArrowRight, ArrowLeft, Check, CheckCircle2, 
  Sparkles, ShieldCheck, Clock, MessageSquare, 
  Car, Wrench, Building2, BarChart3, Globe, Smartphone, 
  Layers, Users, Building, Phone, Mail, User, HelpCircle,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface ServiceOption {
  id: string;
  name: string;
  category: string;
  tag: string;
  description: string;
  icon: any;
  popular?: boolean;
  features: string[];
}

const AVAILABLE_SERVICES: ServiceOption[] = [
  {
    id: 'gestao-lavarapido',
    name: 'Gestão para Lava - Rápido',
    category: 'Vertical ERP',
    tag: 'Automotivo',
    description: 'Fila de veículos em tempo real, controle de lavadores, comissões e avisos automáticos via WhatsApp.',
    icon: Car,
    features: ['Fila digital em tempo real', 'Comissões & lavadores', 'Avisos automáticos no WhatsApp', 'Controle financeiro e DRE']
  },
  {
    id: 'gestao-mecanica',
    name: 'Gestão mecânica',
    category: 'Vertical ERP',
    tag: 'Oficinas',
    description: 'Ordem de serviço digital com checklist e fotos, controle de estoque de peças, serviços e orçamentos rápidos.',
    icon: Wrench,
    features: ['Ordem de Serviço (OS) com fotos', 'Estoque de autopeças e serviços', 'Histórico por placa e cliente', 'Emissão rápida de orçamento']
  },
  {
    id: 'gestao-imobiliaria',
    name: 'Gestão Imobiliária',
    category: 'Vertical ERP',
    tag: 'Imobiliária',
    description: 'Gestão de carteira de imóveis, integração com portais, esteira de locação/venda e repasse a proprietários.',
    icon: Building2,
    features: ['Carteira de imóveis e portais', 'Esteira de locação e vendas', 'Contratos e repasses financeiros', 'Área do cliente e proprietário']
  },
  {
    id: 'gestao-imobiliaria-crm',
    name: 'Gestão Imobiliária + CRM',
    category: 'Solução Integrada',
    tag: 'Mais Completo',
    popular: true,
    description: 'ERP Imobiliário unificado com CRM de vendas com IA (LYA) para qualificação autônoma no WhatsApp e esteira de corretores.',
    icon: BarChart3,
    features: ['ERP Imobiliário Completo', 'Agente LYA SDR no WhatsApp 24h', 'Qualificação autônoma de leads', 'Pipeline Kanban inteligente']
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    category: 'Presença Digital',
    tag: 'Alta Conversão',
    description: 'Páginas de vendas e sites institucionais ultrarrápidos, com copywriting persuasivo, PageSpeed 100 e foco em conversão.',
    icon: Globe,
    features: ['Design exclusivo e responsivo', 'Carregamento instantâneo (PageSpeed 100)', 'Copywriting orientado a vendas', 'Integração direta com WhatsApp e CRM']
  }
];

export function TrialPage() {
  const navigate = useNavigate();

  // Selected Services
  const [selectedServices, setSelectedServices] = useState<string[]>(['gestao-imobiliaria-crm']);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [teamSize, setTeamSize] = useState('1-5 colaboradores');
  const [challenge, setChallenge] = useState('');

  // UI Flow States
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Format Phone (BR Mask)
  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length <= 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedServices.length === 0) {
      setErrorMsg('Por favor, selecione ao menos um serviço que deseja testar.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Informe um número de WhatsApp válido com DDD.');
      return;
    }

    setLoading(true);

    try {
      const selectedNames = AVAILABLE_SERVICES
        .filter(s => selectedServices.includes(s.id))
        .map(s => s.name);

      const uid = auth.currentUser?.uid || 'anonymous_trial';

      await addDoc(collection(db, 'leads'), {
        ownerId: uid,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        company: company.trim() || 'Não informada',
        teamSize,
        challenge: challenge.trim() || 'Deseja testar as soluções selecionadas',
        selectedServiceIds: selectedServices,
        selectedServiceNames: selectedNames,
        source: 'trial_page',
        status: 'new',
        type: 'trial_request',
        createdAt: new Date().toISOString()
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Erro ao agendar trial:', err);
      setErrorMsg('Ocorreu um erro ao processar seu pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppDirectLink = () => {
    const selectedNames = AVAILABLE_SERVICES
      .filter(s => selectedServices.includes(s.id))
      .map(s => s.name)
      .join(', ');

    const text = encodeURIComponent(
      `Olá! Acabei de solicitar uma demonstração no site da AnimaSystem.\n\n*Nome:* ${name || 'Interessado'}\n*Empresa:* ${company || 'Minha Empresa'}\n*Serviço(s) de interesse:* ${selectedNames || 'Plataforma AI First'}\n\nGostaria de iniciar minha demonstração e tirar algumas dúvidas!`
    );
    return `https://wa.me/5585999999999?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-[#D7FE03] selection:text-black antialiased relative overflow-x-hidden">
      
      {/* Dynamic Background Shapes & Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />
      <div className="absolute top-0 right-10 w-96 h-96 bg-[#D7FE03]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-96 h-96 bg-[#83AF3B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[#D7FE03]/10 rounded-full blur-3xl pointer-events-none" />

      {/* ---------------- HEADER BAR ---------------- */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all select-none"
          >
            <Zap className="w-7 h-7 text-black fill-black" />
            <span className="text-2xl font-sans tracking-tight">
              <span className="font-light text-zinc-400">Anima</span>
              <span className="font-bold text-black tracking-tight">System</span>
            </span>
          </div>

          {/* Action / Support on Right */}
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/5585999999999"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-black bg-[#D7FE03] hover:bg-[#c4e602] transition-colors shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Suporte WhatsApp</span>
            </a>
          </div>

        </div>
      </header>

      {/* ---------------- BACK TO HOME BUTTON (BELOW NAVBAR ON THE LEFT) ---------------- */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-zinc-700 hover:text-black hover:bg-white bg-white/90 backdrop-blur-md transition-all border border-zinc-200 shadow-xs hover:shadow-md cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-700 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar ao início</span>
        </button>
      </div>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        
        {/* ================= SUCCESS STATE ================= */}
        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-zinc-200 shadow-xl text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D7FE03]/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="w-20 h-20 bg-[#D7FE03] text-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <Check className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="inline-flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 px-3.5 py-1 rounded-full text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>SOLICITAÇÃO RECEBIDA COM SUCESSO</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
              Tudo pronto, {name.split(' ')[0]}!
            </h2>

            <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed max-w-lg mx-auto">
              Nossa equipe já recebeu seu pedido para testar:
            </p>

            {/* Selected items pill list */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {AVAILABLE_SERVICES.filter(s => selectedServices.includes(s.id)).map(s => (
                <span 
                  key={s.id}
                  className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-zinc-700"
                >
                  <span className="w-2 h-2 rounded-full bg-[#D7FE03]" />
                  {s.name}
                </span>
              ))}
            </div>

            <div className="mt-8 p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-left space-y-3">
              <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-black" />
                <span>Próximos Passos:</span>
              </div>
              <ul className="text-xs text-zinc-600 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#83AF3B] shrink-0 mt-0.5" />
                  <span>Enviaremos uma mensagem no seu WhatsApp <strong>{phone}</strong> com o link de acesso ao ambiente demonstrativo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#83AF3B] shrink-0 mt-0.5" />
                  <span>Se desejar, um especialista fará uma apresentação ao vivo focada na sua rotina de trabalho.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={getWhatsAppDirectLink()}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D7FE03] hover:bg-[#c4e602] text-black shadow-md transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Conversar agora no WhatsApp</span>
              </a>

              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full text-xs font-bold text-zinc-700 hover:text-black hover:bg-zinc-100 transition-colors border border-zinc-200"
              >
                <span>Voltar ao site</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* ================= TRIAL FORM / SERVICE SELECTION ================= */
          <div className="space-y-12">
            
            {/* Top Page Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 bg-white border border-zinc-200/90 text-zinc-800 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>AGENDAMENTO & TRIAL GRATUITO</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-black tracking-tight leading-[1.15]">
                Qual serviço você deseja testar?
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-light">
                Selecione as soluções que fazem sentido para a sua operação. Preparamos uma demonstração guiada e ambiente de testes personalizado para o seu negócio.
              </p>
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ---------------- STEP 1: SERVICE SELECTION CARDS ---------------- */}
            <div>
              <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-black text-[#D7FE03] text-xs font-black flex items-center justify-center">1</span>
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                    Selecione as soluções de seu interesse:
                  </h2>
                </div>
                <span className="text-xs text-zinc-500 font-medium">
                  {selectedServices.length} {selectedServices.length === 1 ? 'solução selecionada' : 'soluções selecionadas'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {AVAILABLE_SERVICES.map((service) => {
                  const Icon = service.icon;
                  const isSelected = selectedServices.includes(service.id);

                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`relative rounded-3xl p-6 transition-all cursor-pointer flex flex-col justify-between select-none ${
                        isSelected
                          ? 'bg-zinc-900 text-white border-2 border-[#D7FE03] shadow-lg scale-[1.01]'
                          : 'bg-white text-zinc-900 border border-zinc-200/90 shadow-xs hover:border-zinc-400 hover:shadow-md'
                      }`}
                    >
                      {/* Top Row: Icon + Checkbox Badge */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            isSelected 
                              ? 'bg-zinc-800 text-[#D7FE03]' 
                              : 'bg-zinc-100 text-zinc-800'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>

                          <div className="flex items-center gap-2">
                            {service.tag && (
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                isSelected
                                  ? 'bg-[#D7FE03] text-black font-black'
                                  : 'bg-zinc-100 text-zinc-600'
                              }`}>
                                {service.tag}
                              </span>
                            )}

                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-[#D7FE03] text-black'
                                : 'border border-zinc-300 bg-white text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className={`text-xl font-black ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                          {service.name}
                        </h3>

                        <p className={`mt-2 text-xs leading-relaxed ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          {service.description}
                        </p>

                        {/* Highlights */}
                        <div className="mt-4 pt-4 border-t border-zinc-200/20 space-y-1.5">
                          {service.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[11px]">
                              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#D7FE03]' : 'bg-[#83AF3B]'}`} />
                              <span className={isSelected ? 'text-zinc-300' : 'text-zinc-600'}>
                                {feat}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Selection Hint */}
                      <div className="mt-6 pt-3 flex items-center justify-between text-[11px] font-bold">
                        <span className={isSelected ? 'text-[#D7FE03]' : 'text-zinc-400'}>
                          {isSelected ? '✓ Selecionado para demonstração' : '+ Clique para adicionar'}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-[#D7FE03]' : 'text-zinc-300'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---------------- STEP 2: LEAD INFORMATION FORM ---------------- */}
            <div className="pt-6">
              <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-zinc-200/90 shadow-lg relative overflow-hidden">
                
                {/* Decorative shape */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#D7FE03]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-black text-[#D7FE03] text-xs font-black flex items-center justify-center">2</span>
                    <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                      Dados para liberação do ambiente e contato
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 mb-8">
                    Preencha as informações abaixo para que nosso time configure seu acesso de demonstração e envie as credenciais.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Selected Services Summary Chips */}
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                    <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Serviços que serão liberados no seu Trial:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_SERVICES.filter(s => selectedServices.includes(s.id)).map(s => (
                        <span 
                          key={s.id}
                          className="inline-flex items-center gap-1.5 bg-white border border-zinc-300 px-3 py-1 rounded-full text-xs font-semibold text-zinc-900 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#83AF3B]" />
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Input Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    {/* Nome */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                        Seu Nome Completo *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Carlos Oliveira"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white"
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                        WhatsApp (com DDD) *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(formatPhone(e.target.value))}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white font-mono"
                        />
                      </div>
                    </div>

                    {/* E-mail Corporativo */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                        E-mail Profissional *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@empresa.com.br"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white"
                        />
                      </div>
                    </div>

                    {/* Nome da Empresa */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                        Nome da Empresa / Negócio *
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Ex: Auto Center Express / Imobiliária Prime"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Team Size & Challenge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                        Tamanho da Equipe
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={teamSize}
                          onChange={(e) => setTeamSize(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white appearance-none cursor-pointer"
                        >
                          <option value="1-5 colaboradores">1 a 5 colaboradores</option>
                          <option value="6-15 colaboradores">6 a 15 colaboradores</option>
                          <option value="16-50 colaboradores">16 a 50 colaboradores</option>
                          <option value="Mais de 50 colaboradores">Mais de 50 colaboradores</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                        Principal Objetivo com a Demonstração
                      </label>
                      <div className="relative">
                        <HelpCircle className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={challenge}
                          onChange={(e) => setChallenge(e.target.value)}
                          placeholder="Ex: Automatizar atendimento, controlar comissões..."
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button & Guarantees */}
                  <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#83AF3B]" /> Sem necessidade de cartão</span>
                      <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-black" /> Demonstração assistida</span>
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#83AF3B]" /> Ativação rápida</span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-10 py-4.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#D7FE03] hover:bg-[#c4e602] text-black shadow-md hover:shadow-xl transition-all cursor-pointer group disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Configurando Trial...</span>
                        </div>
                      ) : (
                        <>
                          <span>Agendar Demonstração & Liberar Trial</span>
                          <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                </form>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* ---------------- FOOTER MINIMAL ---------------- */}
      <footer className="bg-[#09090b] text-zinc-400 text-xs border-t border-zinc-800/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#D7FE03]" />
            <span className="text-white font-bold">AnimaSystem</span>
            <span className="text-zinc-500">• Plataforma AI First para Gestão e Automação</span>
          </div>

          <div className="flex items-center gap-6 text-zinc-400">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">
              Página Inicial
            </button>
            <button onClick={() => navigate('/portfolio')} className="hover:text-white transition-colors">
              Portfólio
            </button>
            <a href="https://wa.me/5585999999999" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
