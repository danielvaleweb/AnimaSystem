import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, Trash2, ArrowLeft, Check, QrCode, Copy, 
  ShieldCheck, CheckCircle2, Building, User, FileText, Globe, 
  Tag, ChevronLeft, ChevronRight, Info, Plus, Sparkles, Headphones, Server, Zap, X, ArrowRight, Lock, Phone, Mail, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

interface CartItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  isService?: boolean;
}

interface RecommendedService {
  id: string;
  name: string;
  desc: string;
  price: number;
  originalPrice: number;
  image: string;
  icon: any;
}

export default function CheckoutView() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const planParam = (searchParams.get('plan') || 'profissional').toLowerCase();
  const supportParam = searchParams.get('support') === 'true';
  const isRenewal = searchParams.get('isRenewal') === 'true' || 
    searchParams.get('renov') === 'true' || 
    searchParams.has('renov') || 
    searchParams.get('type') === 'renewal' || 
    searchParams.get('type') === 'renovacao' || 
    planParam === 'renovacao';
  const clientIdParam = searchParams.get('client') || searchParams.get('clientId') || '';
  const initialMonths = Math.max(1, parseInt(searchParams.get('months') || '1', 10));

  // Base plan details
  const planDetails: Record<string, { name: string; desc: string; price: number; originalPrice: number; image: string }> = {
    starter: {
      name: isRenewal ? 'Renovação - Plano Starter' : 'Plano Starter',
      desc: isRenewal ? 'Renovação de hospedagem, banco de dados e manutenção contínua' : 'Sistema pronto para uso ágil, cadastro de clientes e painel responsivo',
      price: 60,
      originalPrice: 75,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&auto=format&fit=crop&q=80',
    },
    profissional: {
      name: isRenewal ? 'Renovação - Plano Pro' : 'Plano Profissional',
      desc: isRenewal ? 'Renovação de hospedagem cloud, certificado SSL e suporte contínuo' : 'Site de alta conversão sob medida, SEO otimizado e integração WhatsApp/CRM',
      price: 149,
      originalPrice: 189,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&auto=format&fit=crop&q=80',
    },
    pro: {
      name: isRenewal ? 'Renovação - Plano Pro' : 'Plano Profissional',
      desc: isRenewal ? 'Renovação de hospedagem cloud, certificado SSL e suporte contínuo' : 'Site de alta conversão sob medida, SEO otimizado e integração WhatsApp/CRM',
      price: 149,
      originalPrice: 189,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&auto=format&fit=crop&q=80',
    },
    enterprise: {
      name: isRenewal ? 'Renovação - Plano Enterprise' : 'Plano Enterprise',
      desc: isRenewal ? 'Renovação de infraestrutura dedicada, banco de dados e suporte VIP' : 'Software e apps sob medida, infraestrutura dedicada e suporte VIP 24/7 incluso',
      price: 499,
      originalPrice: 599,
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=300&auto=format&fit=crop&q=80',
    },
  };

  const selectedPlan = planDetails[planParam] || planDetails.profissional;

  // Cart items state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const items: CartItem[] = [
      {
        id: planParam,
        name: selectedPlan.name,
        desc: selectedPlan.desc,
        price: selectedPlan.price,
        originalPrice: selectedPlan.originalPrice,
        image: selectedPlan.image,
        quantity: initialMonths,
        isService: false,
      }
    ];

    if (!isRenewal && supportParam && planParam !== 'enterprise') {
      items.push({
        id: 'suporte-24h',
        name: 'Suporte Técnico 24 Horas VIP',
        desc: 'Atendimento prioritário ininterrupto por WhatsApp e Telefone com SLA de 15min',
        price: 50,
        originalPrice: 80,
        image: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=300&auto=format&fit=crop&q=80',
        quantity: 1,
        isService: true,
      });
    }

    return items;
  });

  // Recommended Add-ons
  const recommendedServices: RecommendedService[] = [
    {
      id: 'suporte-24h',
      name: 'Suporte Técnico 24 Horas VIP',
      desc: 'Plantão ininterrupto com engenheiro dedicado para sua operação',
      price: 50.00,
      originalPrice: 80.00,
      image: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=300&auto=format&fit=crop&q=80',
      icon: Headphones,
    },
    {
      id: 'cloud-backup',
      name: 'Hospedagem Cloud Dedicada & Backup Diário',
      desc: 'Armazenamento redundante de alta performance e snapshots automáticos',
      price: 39.90,
      originalPrice: 65.00,
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=80',
      icon: Server,
    },
    {
      id: 'seo-ads',
      name: 'Otimização SEO Avançada & Google Ads Setup',
      desc: 'Configuração completa de tags de conversão e indexação acelerada',
      price: 89.00,
      originalPrice: 140.00,
      image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=300&auto=format&fit=crop&q=80',
      icon: Zap,
    }
  ];

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);

  // Modal & Lead registration state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'lead_form' | 'asaas_redirect' | 'pix_payment'>('lead_form');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCpf, setLeadCpf] = useState('');
  const [leadError, setLeadError] = useState('');
  const [generatedCheckoutUrl, setGeneratedCheckoutUrl] = useState('');
  const [activeOrderId, setActiveOrderId] = useState('');
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [copied, setCopied] = useState(false);

  const pixKey = '24981000306';

  // Format CPF helper
  const formatCpf = (val: string) => {
    const numbers = val.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  // Format Phone helper
  const formatPhone = (val: string) => {
    const numbers = val.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  // Add/Remove cart items
  const handleAddItem = (service: RecommendedService) => {
    if (cartItems.some(item => item.id === service.id)) {
      return;
    }
    setCartItems(prev => [
      ...prev,
      {
        id: service.id,
        name: service.name,
        desc: service.desc,
        price: service.price,
        originalPrice: service.originalPrice,
        image: service.image,
        quantity: 1,
        isService: true,
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(12, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Helper to validate and apply coupon from Firestore or hardcoded fallbacks
  const validateAndApplyCoupon = async (codeToVerify: string) => {
    const code = codeToVerify.toUpperCase().trim();
    if (!code) {
      setDiscountPercent(0);
      setCouponFeedback(null);
      return;
    }

    try {
      const q = query(
        collection(db, 'coupons'),
        where('code', '==', code)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const cDoc = snap.docs[0].data();
        if (cDoc.active === false) {
          setDiscountPercent(0);
          setCouponFeedback('Este cupom está inativo ou expirado.');
          return;
        }
        const pct = Number(cDoc.discountPercent) || 0;
        setDiscountPercent(pct);
        setCouponFeedback(`Cupom ${cDoc.code} (${pct}% OFF) aplicado com sucesso!`);
        return;
      }
    } catch (err) {
      console.warn('Erro ao consultar cupom no banco:', err);
    }

    // Built-in fallback promotional vouchers
    if (code === 'ANIMA10' || code === 'DESCONTO10') {
      setDiscountPercent(10);
      setCouponFeedback('Cupom de 10% aplicado com sucesso!');
    } else if (code === 'VIP' || code === 'RENOVAVIP') {
      setDiscountPercent(15);
      setCouponFeedback('Cupom de 15% VIP aplicado!');
    } else if (code === 'ANIMA20' || code === 'PROMO20') {
      setDiscountPercent(20);
      setCouponFeedback('Cupom de 20% OFF aplicado!');
    } else {
      setDiscountPercent(0);
      setCouponFeedback('Cupom inválido ou não encontrado.');
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndApplyCoupon(couponInput);
  };

  // Check URL search parameters on mount (e.g. ?coupon=PROMO20)
  React.useEffect(() => {
    const urlCoupon = searchParams.get('coupon') || searchParams.get('cupom');
    if (urlCoupon) {
      setCouponInput(urlCoupon);
      validateAndApplyCoupon(urlCoupon);
    }
  }, []);

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal - discountVal);
  const installments6x = (total / 6).toFixed(2).replace('.', ',');

  // Automatic Asaas payment confirmation polling & redirect to Client Admin
  React.useEffect(() => {
    if (!activeOrderId || modalStep !== 'asaas_redirect' || isPaymentConfirmed) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/asaas/check-order?orderId=${encodeURIComponent(activeOrderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'paid' && isMounted) {
            setIsPaymentConfirmed(true);
            localStorage.setItem('confirmedAsaasPayment', JSON.stringify({
              orderId: activeOrderId,
              customerName: leadName || data.customerName,
              amount: total,
              plan: planParam || 'Profissional',
              paidAt: new Date().toISOString()
            }));
            setTimeout(() => {
              navigate('/admin-cliente');
            }, 1800);
          }
        }
      } catch {
        // Transient network polling attempt - will retry on next tick
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeOrderId, modalStep, isPaymentConfirmed, leadName, planParam, total, navigate]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Prefill client info if clientIdParam is present
  React.useEffect(() => {
    if (!clientIdParam) return;
    let isMounted = true;
    async function loadClientData() {
      try {
        const clientSnap = await getDoc(doc(db, 'clients', clientIdParam));
        if (clientSnap.exists() && isMounted) {
          const d = clientSnap.data();
          setClientInfo({ id: clientSnap.id, ...d });
          if (d.responsible || d.name) setLeadName(d.responsible || d.name);
          if (d.phone) setLeadPhone(d.phone);
          if (d.cpf) setLeadCpf(d.cpf);
          if (d.email || d.companyEmail) setLeadEmail(d.email || d.companyEmail);

          const clientVal = (d.monthlyValue && Number(d.monthlyValue) > 0) ? Number(d.monthlyValue) : null;
          
          setCartItems(prev => prev.map(item => {
            if (!item.isService) {
              return { 
                ...item, 
                name: isRenewal ? `Renovação de Hospedagem - ${d.name || 'Site'}` : item.name,
                image: d.logoUrl || item.image,
                price: clientVal !== null ? clientVal : item.price, 
                originalPrice: clientVal !== null ? Math.round(clientVal * 1.25) : item.originalPrice 
              };
            }
            return item;
          }));
        }
      } catch (err) {
        console.warn('Could not prefill client data:', err);
      }
    }
    loadClientData();
    return () => { isMounted = false; };
  }, [clientIdParam, isRenewal]);

  // Handler when user clicks "Finalizar a Compra" on the page
  const handleOpenCheckoutModal = () => {
    setLeadError('');
    setModalStep('lead_form');
    setIsPaymentModalOpen(true);
  };

  // Handler for Lead Form submission with Asaas Integration
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError('');

    if (!leadName.trim()) {
      setLeadError('Por favor, informe seu nome completo.');
      return;
    }

    if (leadEmail.trim() && !leadEmail.includes('@')) {
      setLeadError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    const cleanPhone = leadPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setLeadError('Por favor, informe um telefone/WhatsApp válido com DDD.');
      return;
    }

    const cleanCpf = leadCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setLeadError('Por favor, informe um CPF válido com 11 dígitos.');
      return;
    }

    setIsSubmittingLead(true);
    try {
      const cleanEmail = leadEmail.trim() || `cliente_${cleanCpf}@animasystem.com.br`;
      const mainItem = cartItems.find(item => !item.isService);
      const renewalMonths = mainItem ? mainItem.quantity : 1;

      const response = await fetch('/api/asaas/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planParam,
          isRenewal: isRenewal,
          clientId: clientIdParam || undefined,
          renewalMonths: renewalMonths,
          items: cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity
          })),
          coupon: couponInput.trim() || undefined,
          customer: {
            name: leadName.trim(),
            email: cleanEmail,
            phone: cleanPhone,
            cpf: cleanCpf
          },
          ownerId: auth.currentUser?.uid || '6rbybX9mBAMp8B6gS3zQ8rT0hW32',
          userId: auth.currentUser?.uid || null
        })
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        console.warn('Could not parse response as JSON:', parseErr);
      }

      if (response.ok && data.checkoutUrl) {
        const secureUrl = data.checkoutUrl.replace(/^http:\/\//i, 'https://');
        setGeneratedCheckoutUrl(secureUrl);
        if (data.orderId) {
          setActiveOrderId(data.orderId);
          localStorage.setItem('lastAsaasOrderId', data.orderId);
          localStorage.setItem('lastCustomerName', leadName.trim());
          localStorage.setItem('lastCustomerEmail', cleanEmail);
          localStorage.setItem('lastPlanName', planParam || 'profissional');
          localStorage.setItem('lastTotal', total.toFixed(2));
        }
        setModalStep('asaas_redirect');

        // Tenta abrir imediatamente em nova aba para contornar o bloqueio de iframes
        try {
          window.open(secureUrl, '_blank', 'noopener,noreferrer');
        } catch (e) {
          console.warn('Pop-up bloqueado pelo navegador:', e);
        }
      } else {
        setLeadError(data.error || (response.status === 405 ? 'Serviço de pagamento indisponível no momento. Tente novamente.' : 'Não foi possível iniciar o pagamento. Tente novamente.'));
      }
    } catch (err: any) {
      console.error('Error connecting to Asaas checkout:', err);
      setLeadError(err.message || 'Não foi possível iniciar o pagamento. Tente novamente.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-zinc-900 font-sans pb-24 selection:bg-[#D7FE03] selection:text-black">
      
      {/* Clean Top Bar (NO NAVBAR) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 xl:px-14 pt-8 sm:pt-10 flex items-center justify-between">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-8 xl:px-14 pt-8">
        
        {/* Title Area */}
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart className="w-8 h-8 text-black" strokeWidth={2} />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            {isRenewal ? 'Renovação de Hospedagem' : 'Meu carrinho'} <span className="text-[#0c0d0e] font-black">({cartItems.length})</span>
          </h1>
        </div>

        {/* Client Identification & Branding Card */}
        {clientInfo && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 sm:p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {clientInfo.logoUrl ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-200/80 shrink-0 p-1.5 flex items-center justify-center shadow-xs">
                  <img 
                    src={clientInfo.logoUrl} 
                    alt={clientInfo.name} 
                    className="w-full h-full object-contain" 
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#0c0d0e] text-[#D7FE03] font-black text-lg flex items-center justify-center shrink-0 shadow-xs uppercase tracking-tight">
                  {clientInfo.logoInitials || (clientInfo.name ? clientInfo.name.substring(0, 2) : 'AS')}
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                    Ambiente Seguro de Renovação
                  </span>
                  {clientInfo.domain && (
                    <span className="text-[11px] font-semibold text-zinc-500 inline-flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-zinc-400" />
                      {clientInfo.domain}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 leading-snug truncate">
                  {clientInfo.name}
                </h2>
                <p className="text-xs text-zinc-500">
                  {clientInfo.responsible ? `Responsável: ${clientInfo.responsible} • ` : ''}
                  Plano Contratado: <strong className="text-zinc-800 font-bold">{clientInfo.plan || 'Profissional'}</strong>
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2 bg-zinc-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-zinc-100 w-full sm:w-auto justify-between shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Identidade Verificada</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium text-right hidden sm:block">
                Liberação e renovação instantânea
              </span>
            </div>
          </motion.div>
        )}

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Cart Items & Recommended Services (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Cart Items List */}
            <div className="space-y-4">
              {cartItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200/80 shadow-sm">
                  <ShoppingCart className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-600 font-medium mb-4">Seu carrinho está vazio.</p>
                  <button 
                    onClick={() => navigate('/planos/profissional')}
                    className="px-6 py-2.5 rounded-full bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-colors"
                  >
                    Escolher um Plano
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    key={item.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-zinc-300"
                  >
                    {/* Thumbnail + Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 flex items-center justify-center relative p-1">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className={`w-full h-full ${clientInfo?.logoUrl && item.image === clientInfo.logoUrl ? 'object-contain' : 'object-cover rounded-xl'}`}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-md bg-[#D7FE03] text-black font-black text-[10px] flex items-center justify-center shadow-xs">
                          {clientInfo?.logoInitials || 'AS'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                          {item.name}
                        </h3>
                        <p className="text-xs text-zinc-500 line-clamp-2 max-w-sm">
                          {item.desc}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isRenewal 
                              ? 'bg-amber-50 text-amber-800 border-amber-200' 
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}>
                            {isRenewal ? 'Renovação de Hospedagem' : 'Ativação Imediata'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector + Price + Trash */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                      
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-zinc-200 rounded-full bg-zinc-50 px-2 py-1 gap-3">
                        <button 
                          type="button"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:text-black hover:bg-zinc-200 transition-colors font-bold text-sm"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-zinc-900 min-w-[20px] text-center">
                          {item.quantity} {item.quantity === 1 ? 'mês' : 'meses'}
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:text-black hover:bg-zinc-200 transition-colors font-bold text-sm"
                        >
                          +
                        </button>
                      </div>

                      {/* Price Tag */}
                      <div className="text-right">
                        <div className="text-lg sm:text-xl font-extrabold text-zinc-900 tracking-tight">
                          R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                        </div>
                        {item.originalPrice && (
                          <div className="text-xs text-zinc-400 line-through">
                            R$ {(item.originalPrice * item.quantity).toFixed(2).replace('.', ',')}
                          </div>
                        )}
                      </div>

                      {/* Trash / Delete button */}
                      <button 
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-zinc-400 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remover do carrinho"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Clear / Manage Cart link */}
            {cartItems.length > 0 && (
              <div className="flex justify-between items-center px-2">
                <button 
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-xs text-zinc-500 hover:text-red-600 underline font-medium cursor-pointer"
                >
                  Limpar o carrinho
                </button>
                <button 
                  type="button"
                  onClick={() => navigate('/planos/starter')}
                  className="text-xs text-zinc-600 hover:text-black font-semibold cursor-pointer"
                >
                  + Adicionar outro plano
                </button>
              </div>
            )}

            {/* Recommended Add-ons Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                    Serviços recomendados
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Adicione recursos extras ao seu projeto
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid of Recommended Add-ons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendedServices.map((service) => {
                  const isInCart = cartItems.some(item => item.id === service.id);
                  const IconComp = service.icon;

                  return (
                    <div 
                      key={service.id}
                      className="border border-zinc-200/80 hover:border-zinc-300 rounded-2xl p-4 flex flex-col justify-between transition-all bg-zinc-50/50 hover:bg-white group"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                          <IconComp className="w-6 h-6 text-zinc-800" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-zinc-900 leading-tight">
                            {service.name}
                          </h4>
                          <p className="text-[11px] text-zinc-500 line-clamp-2">
                            {service.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                        <div>
                          <div className="text-sm font-extrabold text-zinc-900">
                            R$ {service.price.toFixed(2).replace('.', ',')}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            mensal <span className="line-through">R$ {service.originalPrice.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={() => isInCart ? handleRemoveItem(service.id) : handleAddItem(service)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                            isInCart 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-black hover:bg-zinc-800 text-white'
                          }`}
                          title={isInCart ? 'Remover do carrinho' : 'Adicionar ao carrinho'}
                        >
                          {isInCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sidebar Summary + Coupon + Action Button (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Summary Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/80 shadow-sm space-y-6">
              
              {/* Cupom input */}
              <div>
                <form onSubmit={handleApplyCoupon} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-zinc-700 text-xs font-bold shrink-0 min-w-[70px]">
                    <Tag className="w-4 h-4 text-zinc-500" />
                    <span>Cupom</span>
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Escreva ou cole aqui (ex: ANIMA10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-black uppercase"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer uppercase"
                    >
                      OK
                    </button>
                  </div>
                </form>
                {couponFeedback && (
                  <p className={`text-[11px] font-semibold mt-1 pl-[78px] ${discountPercent > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {couponFeedback}
                  </p>
                )}
              </div>

              {/* Condições de uso */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Info className="w-3.5 h-3.5" />
                <span>Ativação rápida com suporte dedicado e aprovação imediata</span>
              </div>

              <div className="border-t border-zinc-100 pt-4 space-y-2.5">
                <div className="flex justify-between text-xs text-zinc-600 font-medium">
                  <span>Produtos ({cartItems.length})</span>
                  <span className="font-bold text-zinc-900">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between text-xs text-green-600 font-bold">
                    <span>Desconto ({discountPercent}%)</span>
                    <span>- R$ {discountVal.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
              </div>

              {/* Total Card Box */}
              <div className="bg-[#0c0d0e] text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D7FE03]/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-bold text-zinc-300">Total</span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-[11px] text-zinc-400 font-medium">
                    Ou em até <span className="text-white font-bold">6x de R$ {installments6x}</span> s/ juros
                  </p>
                  <p className="text-xs text-[#D7FE03] font-black tracking-wide">
                    Total: R$ {total.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {/* BOTÃO FINALIZAR COMPRA (Abaixo do Valor Total) */}
              <div className="space-y-3 pt-2">
                <button 
                  type="button"
                  disabled={cartItems.length === 0}
                  onClick={handleOpenCheckoutModal}
                  className="w-full py-4 rounded-2xl bg-[#D7FE03] hover:bg-[#c2e502] disabled:opacity-50 text-black font-extrabold text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5 text-black stroke-[3]" /> {isRenewal ? 'Finalizar Renovação' : 'Finalizar a Compra'}
                </button>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-xs text-zinc-500 hover:text-black font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Voltar à loja
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* JANELA MODAL DE BAIXO PARA CIMA (BOTTOM SHEET DRAWER) */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            
            {/* Backdrop escuro */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
            />

            {/* Janela Drawer subindo de baixo */}
            <motion.div 
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative z-50 w-full max-w-2xl bg-white rounded-t-[2.5rem] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border-t border-zinc-200"
            >
              {/* Header do Drawer */}
              <div className="p-6 pb-4 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0c0d0e] text-[#D7FE03] flex items-center justify-center font-black text-xs shadow-xs">
                    AS
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                      {modalStep === 'lead_form' ? 'Identificação do Pedido' : 'Pagamento via PIX'}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {modalStep === 'lead_form' 
                        ? 'Preencha seus dados para vincular a assinatura e liberar o pagamento' 
                        : 'Escaneie o QR Code ou copie a chave para ativação imediata'}
                    </p>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conteúdo Dinâmico do Drawer */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {modalStep === 'lead_form' ? (
                  /* ETAPA 1: PEDIR APENAS NOME, TELEFONE E CPF */
                  <form onSubmit={handleLeadSubmit} className="space-y-5">
                    
                    {/* Resumo rápido do total */}
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Itens selecionados ({cartItems.length})</span>
                        <span className="text-xs font-bold text-zinc-900">
                          {cartItems.map(i => i.name).join(' + ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-zinc-900">R$ {total.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>

                    {leadError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl font-medium">
                        {leadError}
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Campo Nome */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                          Nome Completo *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text"
                            required
                            placeholder="Ex: João da Silva"
                            value={leadName}
                            onChange={(e) => setLeadName(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {/* Campo E-mail */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                          E-mail *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input 
                            type="email"
                            required
                            placeholder="Ex: joao@email.com"
                            value={leadEmail}
                            onChange={(e) => setLeadEmail(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {/* Campo Telefone / WhatsApp */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                          Telefone / WhatsApp *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input 
                            type="tel"
                            required
                            placeholder="(11) 99999-9999"
                            value={leadPhone}
                            onChange={(e) => setLeadPhone(formatPhone(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {/* Campo CPF */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                          CPF *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text"
                            required
                            placeholder="000.000.000-00"
                            value={leadCpf}
                            onChange={(e) => setLeadCpf(formatCpf(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botão Finalizar Compra / Próximo */}
                    <div className="pt-3">
                      <button 
                        type="submit"
                        disabled={isSubmittingLead}
                        className="w-full py-4 rounded-2xl bg-[#D7FE03] hover:bg-[#c2e502] disabled:opacity-50 text-black font-extrabold text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSubmittingLead ? (
                          <span>Iniciando pagamento seguro...</span>
                        ) : (
                          <>
                            <span>Ir para Pagamento</span>
                            <ArrowRight className="w-4 h-4 stroke-[3]" />
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                ) : modalStep === 'asaas_redirect' ? (
                  /* ETAPA: REDIRECIONAMENTO SEGURO ASAAS */
                  isPaymentConfirmed ? (
                    <div className="text-center py-8 space-y-5">
                      <div className="w-18 h-18 rounded-full bg-[#D7FE03] flex items-center justify-center mx-auto text-black shadow-xl animate-bounce">
                        <CheckCircle2 className="w-10 h-10 text-black stroke-[2.5]" />
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                          Pagamento Confirmado no Asaas!
                        </h3>
                        <p className="text-xs text-zinc-600 max-w-xs mx-auto font-medium">
                          Seu pagamento foi reconhecido com sucesso. Estamos abrindo seu Painel do Cliente agora...
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-800 pt-2">
                        <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                        <span>Carregando ambiente exclusivo...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-5">
                      <div className="w-16 h-16 rounded-full bg-[#D7FE03]/20 border border-[#D7FE03] flex items-center justify-center mx-auto text-black shadow-xs">
                        <CheckCircle2 className="w-8 h-8 text-zinc-900" />
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight">
                          Pedido Gerado no Asaas!
                        </h3>
                        <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                          Conclua o pagamento na aba aberta do Asaas. Nosso sistema identificará automaticamente.
                        </p>
                      </div>

                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-left space-y-2">
                        <div className="flex justify-between text-xs font-bold text-zinc-700">
                          <span>Cliente:</span>
                          <span className="text-zinc-900">{leadName}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-zinc-700">
                          <span>Itens:</span>
                          <span className="text-zinc-900 truncate max-w-[180px]">{cartItems.map(i => i.name).join(' + ')}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-zinc-700 pt-1 border-t border-zinc-200">
                          <span>Valor Total:</span>
                          <span className="text-zinc-900 font-extrabold">R$ {total.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>

                      {/* Live listening indicator */}
                      <div className="flex items-center justify-center gap-2 py-2 px-3 bg-zinc-100/80 rounded-xl text-[11px] font-semibold text-zinc-600">
                        <span className="w-2 h-2 rounded-full bg-[#D7FE03] animate-ping" />
                        <span>Sincronizando em tempo real com Asaas Sandbox...</span>
                      </div>

                      <div className="pt-1 space-y-2">
                        <a 
                          href={generatedCheckoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-4 rounded-2xl bg-[#D7FE03] hover:bg-[#c2e502] text-black font-extrabold text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer no-underline"
                        >
                          <span>Abrir Pagamento Seguro no Asaas</span>
                          <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                        </a>

                        <button
                          type="button"
                          onClick={async () => {
                            if (activeOrderId) {
                              try {
                                await fetch(`/api/asaas/check-order?orderId=${encodeURIComponent(activeOrderId)}`);
                              } catch (e) {
                                console.warn('Check order failed on click:', e);
                              }
                            }
                            setIsPaymentModalOpen(false);
                            navigate('/admin-cliente');
                          }}
                          className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                        >
                          Já Paguei (Acessar Meu Painel)
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  /* ETAPA 2: MOSTRAR AS INFORMAÇÕES DE PAGAMENTO E ITENS */
                  <div className="space-y-6">
                    
                    {/* 1. Lista de tudo o que ela está comprando */}
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80">
                        <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                          Resumo da Compra ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'})
                        </span>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          Cliente: {leadName}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                              <span className="font-bold text-zinc-800">{item.name}</span>
                              <span className="text-zinc-400 font-medium">({item.quantity} {item.quantity === 1 ? 'mês' : 'meses'})</span>
                            </div>
                            <span className="font-extrabold text-zinc-900">
                              R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {discountPercent > 0 && (
                        <div className="flex justify-between text-xs text-green-600 font-bold pt-2 border-t border-zinc-200/60">
                          <span>Desconto Aplicado ({discountPercent}%)</span>
                          <span>- R$ {discountVal.toFixed(2).replace('.', ',')}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-200/80">
                        <span className="text-sm font-black text-zinc-900">Valor Total a Pagar</span>
                        <span className="text-xl font-black text-zinc-900">
                          R$ {total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    {/* 2. QR Code do PIX com identificador */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col items-center text-center shadow-xs">
                      <div className="inline-block text-[11px] font-extrabold bg-[#D7FE03] text-black px-4 py-1 rounded-full mb-3 uppercase tracking-wide shadow-xs">
                        Comprando: {cartItems.map(i => i.name).join(' + ')}
                      </div>

                      <QrCode className="w-44 h-44 text-zinc-900 mb-2" />
                      
                      <span className="text-xs font-black text-zinc-700 tracking-widest uppercase">
                        Animasystem.com.br
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-0.5">
                        Abra o app do seu banco e aponte a câmera para o QR Code
                      </span>
                    </div>

                    {/* 3. Credenciais e Chave PIX com botão de copiar */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Dados da Chave PIX</span>
                        <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full">
                          Aprovação Instantânea
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between py-1.5 border-b border-zinc-200/80">
                          <span className="text-zinc-500 font-medium">Chave PIX:</span>
                          <span className="font-mono font-black text-zinc-900 text-sm select-all">{pixKey}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-zinc-200/80">
                          <span className="text-zinc-500 font-medium">Instituição:</span>
                          <span className="font-semibold text-zinc-800">Banco Inter</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-zinc-200/80">
                          <span className="text-zinc-500 font-medium">Nome:</span>
                          <span className="font-semibold text-zinc-800">Daniel Vale</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-zinc-500 font-medium">CPF:</span>
                          <span className="font-semibold text-zinc-800">142.xxx.xxx-45</span>
                        </div>
                      </div>

                      {/* Botão de Copiar Chave */}
                      <button 
                        type="button"
                        onClick={handleCopyPix}
                        className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" /> Chave Copiada com Sucesso!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-zinc-700" /> Copiar Chave PIX ({pixKey})
                          </>
                        )}
                      </button>
                    </div>

                    {/* Botão Já Paguei */}
                    <div className="pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsPaymentModalOpen(false);
                          navigate('/admin-cliente');
                        }}
                        className="w-full py-4 rounded-2xl bg-[#D7FE03] hover:bg-[#c2e502] text-black font-extrabold text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5 text-black stroke-[3]" /> Já Paguei (Acessar Meu Painel)
                      </button>
                    </div>

                  </div>
                )}

              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
