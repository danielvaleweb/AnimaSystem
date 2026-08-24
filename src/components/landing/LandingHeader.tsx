import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles, User, LogOut, ChevronDown, Car, Wrench, Building2, Globe, Smartphone, BarChart3, LayoutTemplate, Layers, Zap } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { LightningLogo } from '../LightningLogo';
import { motion, AnimatePresence } from 'motion/react';

interface LandingHeaderProps {
  brandName: string;
  currentUser: any;
  currentUserName: string;
  currentUserPortalLink: string;
  onOpenLoginModal: () => void;
  onOpenDemoModal: () => void;
}

export function LandingHeader({
  brandName,
  currentUser,
  currentUserName,
  currentUserPortalLink,
  onOpenLoginModal,
  onOpenDemoModal
}: LandingHeaderProps) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [plansDropdownOpen, setPlansDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobilePlansOpen, setMobilePlansOpen] = useState(false);

  const servicesRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);

  // Scroll detection for navbar background change
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setIsScrolled(scrollPos > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setServicesDropdownOpen(false);
      }
      if (plansRef.current && !plansRef.current.contains(event.target as Node)) {
        setPlansDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const servicesList = [
    {
      label: 'ERP Lava-Jato',
      description: 'Fila de lavagem, comissões, lavadores e WhatsApp integrado',
      icon: Car,
      href: '#portfolio',
      tag: 'Vertical ERP',
    },
    {
      label: 'ERP Mecânica',
      description: 'Ordem de serviço digital, fotos de vistoria e controle de autopeças',
      icon: Wrench,
      href: '#portfolio',
      tag: 'Vertical ERP',
    },
    {
      label: 'ERP Imobiliária',
      description: 'Gestão de imóveis, portais, esteira de locação e LYA SDR 24/7',
      icon: Building2,
      href: '#portfolio',
      tag: 'Vertical ERP',
    },
    {
      label: 'Desenvolvimento de sites',
      description: 'Sites institucionais ultrarrápidos com SEO e PageSpeed 100',
      icon: Globe,
      href: '#portfolio',
      tag: 'Web',
    },
    {
      label: 'Desenvolvimento de App',
      description: 'Aplicativos móveis nativos e híbridos para iOS e Android',
      icon: Smartphone,
      href: '#portfolio',
      tag: 'Mobile',
    },
    {
      label: 'Desenvolvimento CRM',
      description: 'Pipeline multicanal de vendas com transcrição e automação IA',
      icon: BarChart3,
      href: '#portfolio',
      tag: 'Vendas & IA',
    },
    {
      label: 'Desenvolvimento Land Pages',
      description: 'Páginas de vendas imersivas focadas em máxima taxa de conversão',
      icon: LayoutTemplate,
      href: '#portfolio',
      tag: 'Conversão',
    },
  ];

  const plansList = [
    {
      name: 'Starter',
      subtitle: 'Controle comercial ágil e gestão essencial',
      badge: 'R$ 48/mês',
      href: '#planos',
    },
    {
      name: 'Pro',
      subtitle: 'Site de alta conversão + CRM + Inteligência Artificial LYA',
      badge: 'Mais Escolhido',
      highlight: true,
      href: '#planos',
    },
    {
      name: 'Enterprise',
      subtitle: 'Infraestrutura Google Cloud dedicada, Apps e customizações',
      badge: 'Corporativo',
      href: '#planos',
    },
  ];

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 pointer-events-auto ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-xs" 
          : "bg-[#F8F9FA] border-b border-transparent"
      }`}
    >
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between transition-all">
        
        {/* Brand Logo "AnimaSystem" with solid black lightning icon (no effects, no shadow) */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all shrink-0 select-none"
        >
          <Zap className="w-8 h-8 text-black fill-black" />
          <span className="text-2xl font-sans tracking-tight select-none">
            <span className="font-light text-zinc-400">Anima</span>
            <span className="font-bold text-black tracking-tight">System</span>
          </span>
        </div>

        {/* Desktop Navigation - Dashboard Style Pill Menu */}
        <nav className="hidden lg:flex items-center gap-1.5 font-medium text-zinc-600">
          
          {/* 1. Planos Dropdown */}
          <div
            ref={plansRef}
            className="relative"
            onMouseEnter={() => setPlansDropdownOpen(true)}
            onMouseLeave={() => setPlansDropdownOpen(false)}
          >
            <button
              onClick={() => setPlansDropdownOpen(!plansDropdownOpen)}
              className={`px-4 py-2 rounded-full text-xs transition-all font-semibold whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                plansDropdownOpen 
                  ? 'bg-black text-white shadow-xs font-bold' 
                  : 'text-zinc-600 hover:text-black font-medium hover:bg-zinc-50'
              }`}
            >
              <span>Planos</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 opacity-70 ${plansDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {plansDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
                >
                  <div className="w-80 bg-white rounded-3xl shadow-xl border border-zinc-200/80 p-3 space-y-1.5 text-left">
                    <div className="px-3 py-1 mb-1 border-b border-zinc-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Escolha o seu plano</span>
                    </div>

                    {plansList.map((plan) => (
                      <a
                        key={plan.name}
                        href={plan.href}
                        onClick={() => setPlansDropdownOpen(false)}
                        className={`flex items-start justify-between p-2.5 rounded-2xl transition-all ${
                          plan.highlight
                            ? 'bg-zinc-50 border border-zinc-200/90'
                            : 'hover:bg-zinc-50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900">{plan.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              plan.highlight
                                ? 'bg-[#D7FE03] text-black'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}>
                              {plan.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-tight">
                            {plan.subtitle}
                          </p>
                        </div>
                      </a>
                    ))}

                    <div className="pt-2 border-t border-zinc-100 text-center">
                      <a
                        href="#planos"
                        onClick={() => setPlansDropdownOpen(false)}
                        className="text-xs font-bold text-zinc-800 hover:text-black block py-1"
                      >
                        Ver tabela comparativa completa →
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Sobre nós */}
          <a
            href="#sobre"
            className="px-4 py-2 rounded-full text-xs text-zinc-600 hover:text-black font-medium hover:bg-zinc-50 transition-all whitespace-nowrap"
          >
            Sobre nós
          </a>

        </nav>

        {/* Right Action CTAs */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-zinc-900">Olá, {currentUserName}</div>
                <button
                  onClick={() => navigate(currentUserPortalLink || '/admin')}
                  className="text-[11px] text-black hover:text-zinc-600 font-bold"
                >
                  Painel do Usuário →
                </button>
              </div>
              <button
                onClick={async () => {
                  await auth.signOut();
                  navigate('/');
                }}
                title="Sair"
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={onOpenLoginModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-zinc-700 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer border border-zinc-200/80"
              >
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>Entrar</span>
              </button>
              <button
                onClick={onOpenDemoModal}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-black bg-[#D7FE03] hover:bg-[#c4e602] shadow-xs hover:shadow transition-all cursor-pointer group"
              >
                <span>Agendar demo</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-zinc-600 hover:text-black hover:bg-zinc-100"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden w-full bg-white/98 backdrop-blur-md border-b border-zinc-200/90 p-5 space-y-4 shadow-xl pointer-events-auto max-h-[80vh] overflow-y-auto"
          >
            <div className="flex flex-col space-y-2">
              
              {/* Mobile Serviços Accordion */}
              <div>
                <button
                  onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                  className="w-full flex items-center justify-between text-sm font-bold text-zinc-900 hover:text-black py-2.5 border-b border-zinc-100"
                >
                  <span>Serviços</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileServicesOpen ? 'rotate-180 text-black' : 'text-zinc-400'}`} />
                </button>
                {mobileServicesOpen && (
                  <div className="pl-3 py-2 space-y-2 bg-zinc-50 rounded-2xl my-1 border border-zinc-100">
                    {servicesList.map((srv) => (
                      <a
                        key={srv.label}
                        href={srv.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-xs font-semibold text-zinc-700 hover:text-black py-1.5"
                      >
                        {srv.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Planos Accordion */}
              <div>
                <button
                  onClick={() => setMobilePlansOpen(!mobilePlansOpen)}
                  className="w-full flex items-center justify-between text-sm font-bold text-zinc-900 hover:text-black py-2.5 border-b border-zinc-100"
                >
                  <span>Planos</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobilePlansOpen ? 'rotate-180 text-black' : 'text-zinc-400'}`} />
                </button>
                {mobilePlansOpen && (
                  <div className="pl-3 py-2 space-y-2 bg-zinc-50 rounded-2xl my-1 border border-zinc-100">
                    <a
                      href="#planos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-xs font-semibold text-zinc-700 hover:text-black py-1"
                    >
                      Starter (R$ 48/mês)
                    </a>
                    <a
                      href="#planos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-xs font-bold text-black py-1 flex items-center gap-2"
                    >
                      <span>Pro</span>
                      <span className="text-[10px] bg-[#D7FE03] px-1.5 py-0.5 rounded-full">AI First</span>
                    </a>
                    <a
                      href="#planos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-xs font-semibold text-zinc-700 hover:text-black py-1"
                    >
                      Enterprise (Corporativo)
                    </a>
                  </div>
                )}
              </div>

              {/* Mobile Links */}
              <a
                href="#sobre"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-zinc-900 hover:text-black py-2.5 border-b border-zinc-100"
              >
                Sobre nós
              </a>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2.5">
              {!currentUser ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenLoginModal();
                    }}
                    className="w-full py-2.5 text-center text-xs font-bold rounded-2xl border border-zinc-200 text-zinc-800 hover:bg-zinc-50"
                  >
                    Entrar na Conta
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenDemoModal();
                    }}
                    className="w-full py-2.5 text-center text-xs font-bold rounded-2xl bg-[#D7FE03] text-black hover:bg-[#c4e602]"
                  >
                    Agendar Demonstração Gratuita
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(currentUserPortalLink || '/admin');
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold rounded-2xl bg-black text-[#D7FE03]"
                >
                  Acessar Painel ({currentUserName})
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
