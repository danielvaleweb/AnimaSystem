import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, Trash2, ArrowLeft, Check, QrCode, Copy, 
  ShieldCheck, CheckCircle2, Building, User, FileText, Globe, 
  Tag, ChevronLeft, ChevronRight, Info, Plus, Sparkles, Headphones, Server, Zap, X, ArrowRight, Lock, Phone, Mail, ExternalLink, CreditCard, Loader2
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
  const clientIdParam = searchParams.get('client') || 
    searchParams.get('clientId') || 
    searchParams.get('cId') || 
    searchParams.get('id') || 
    localStorage.getItem('admin_client_id') || 
    localStorage.getItem('active_client_id') || 
    '';
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
  const [activePaymentTab, setActivePaymentTab] = useState<'pix' | 'asaas_page'>('pix');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCpf, setLeadCpf] = useState('');
  const [leadError, setLeadError] = useState('');
  const [generatedCheckoutUrl, setGeneratedCheckoutUrl] = useState('');
  const [activeOrderId, setActiveOrderId] = useState('');
  const [asaasPixQrCode, setAsaasPixQrCode] = useState<string | null>(null);
  const [asaasPixCopyPaste, setAsaasPixCopyPaste] = useState<string | null>(null);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixCopySuccess, setPixCopySuccess] = useState(false);
  const [ccName, setCcName] = useState('');
  const [ccNumber, setCcNumber] = useState('');
  const [ccExpiry, setCcExpiry] = useState('');
  const [ccCvv, setCcCvv] = useState('');
  const [ccInstallments, setCcInstallments] = useState(1);
  const [isProcessingCC, setIsProcessingCC] = useState(false);
  const [ccError, setCcError] = useState('');

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
    if (!activeOrderId || isPaymentConfirmed) return;

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

            // Fecha a janela de cima para baixo automaticamente e navega para o painel
            setTimeout(() => {
              if (isMounted) {
                setIsPaymentModalOpen(false);
                setTimeout(() => {
                  navigate('/admin-cliente');
                }, 400);
              }
            }, 2400);
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
  }, [activeOrderId, isPaymentConfirmed, leadName, planParam, total, navigate]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Prefill client info if clientIdParam or session is present
  React.useEffect(() => {
    let isMounted = true;
    async function loadClientData() {
      try {
        let clientDocData: any = null;
        let resolvedClientId = clientIdParam;

        if (resolvedClientId) {
          try {
            const clientSnap = await getDoc(doc(db, 'clients', resolvedClientId));
            if (clientSnap.exists()) {
              clientDocData = { id: clientSnap.id, ...clientSnap.data() };
            }
          } catch (e) {}
        }

        // If not found by direct ID, check localStorage for client session
        if (!clientDocData) {
          const sessionUserStr = localStorage.getItem('client_session_user');
          if (sessionUserStr) {
            try {
              const sessionUser = JSON.parse(sessionUserStr);
              if (sessionUser.clientId) {
                const clientSnap = await getDoc(doc(db, 'clients', sessionUser.clientId));
                if (clientSnap.exists()) {
                  clientDocData = { id: clientSnap.id, ...clientSnap.data() };
                }
              }
            } catch (e) {}
          }
        }

        // If still not found and user is logged in, look up client by email
        if (!clientDocData && auth.currentUser?.email) {
          try {
            const q = query(collection(db, 'clients'), where('email', '==', auth.currentUser.email));
            const snap = await getDocs(q);
            if (!snap.empty) {
              clientDocData = { id: snap.docs[0].id, ...snap.docs[0].data() };
            }
          } catch (e) {}
        }

        if (clientDocData && isMounted) {
          const d = clientDocData;
          setClientInfo(d);
          const resolvedName = (d.responsible || d.name || d.companyRazaoSocial || '').trim();
          const resolvedPhone = (d.phone || d.companyPhone || '').trim();
          const resolvedCpf = (d.cpf || d.cnpj || d.companyCnpj || '').trim();
          const resolvedEmail = (d.email || d.companyEmail || '').trim();

          if (resolvedName) setLeadName(resolvedName);
          if (resolvedPhone) setLeadPhone(resolvedPhone);
          if (resolvedCpf) setLeadCpf(resolvedCpf);
          if (resolvedEmail) setLeadEmail(resolvedEmail);

          const clientVal = (d.monthlyValue && Number(d.monthlyValue) > 0) ? Number(d.monthlyValue) : null;
          
          setCartItems(prev => prev.map(item => {
            if (!item.isService) {
              return { 
                ...item, 
                name: isRenewal ? `Renovação de Hospedagem - ${d.name || d.responsible || 'Site'}` : item.name,
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

  // Core function to generate Asaas Checkout URL
  const handleCreditCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessingCC) return;
    setIsProcessingCC(true);
    setCcError('');

    try {
      const effName = (leadName || clientInfo?.responsible || clientInfo?.name || clientInfo?.companyRazaoSocial || '').trim();
      const rawCpf = (leadCpf || clientInfo?.cpf || clientInfo?.cnpj || clientInfo?.companyCnpj || '').replace(/\D/g, '');
      const rawPhone = (leadPhone || clientInfo?.phone || clientInfo?.companyPhone || '').replace(/\D/g, '');
      const rawEmail = (leadEmail || clientInfo?.email || clientInfo?.companyEmail || '').trim();
      const cleanEmail = rawEmail || `cliente_${rawCpf || Date.now()}@animasystem.com.br`;

      const response = await fetch('/api/asaas/pay-credit-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrderId,
          creditCard: {
            holderName: ccName,
            number: ccNumber,
            expiryMonth: ccExpiry.split('/')[0]?.trim() || '',
            expiryYear: ccExpiry.split('/')[1]?.trim() || '',
            ccv: ccCvv
          },
          creditCardHolderInfo: {
            name: effName || 'Cliente AnimaSystem',
            email: cleanEmail,
            cpfCnpj: rawCpf || '00000000000',
            phone: rawPhone || '11999999999',
            postalCode: '01310100',
            addressNumber: '100'
          },
          installmentCount: ccInstallments
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setCcError(data.error || 'Ocorreu um erro ao processar o cartão.');
        setIsProcessingCC(false);
        return;
      }

      setIsPaymentConfirmed(true);
      setActivePaymentTab('pix');
    } catch (err: any) {
      setCcError(err.message || 'Falha de comunicação. Tente novamente.');
    } finally {
      setIsProcessingCC(false);
    }
  };

  const generateAsaasCheckout = async (name: string, email: string, phone: string, cpf: string) => {
    setIsSubmittingLead(true);
    setLeadError('');
    setIframeLoaded(false);

    try {
      const effName = (name || leadName || clientInfo?.responsible || clientInfo?.name || clientInfo?.companyRazaoSocial || '').trim();
      const rawCpf = (cpf || leadCpf || clientInfo?.cpf || clientInfo?.cnpj || clientInfo?.companyCnpj || '').replace(/\D/g, '');
      const rawPhone = (phone || leadPhone || clientInfo?.phone || clientInfo?.companyPhone || '').replace(/\D/g, '');
      const rawEmail = (email || leadEmail || clientInfo?.email || clientInfo?.companyEmail || '').trim();
      
      const cleanEmail = rawEmail || (rawCpf ? `cliente_${rawCpf}@animasystem.com.br` : `cliente_${Date.now()}@animasystem.com.br`);
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
          clientId: clientIdParam || clientInfo?.id || undefined,
          renewalMonths: renewalMonths,
          items: cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity
          })),
          coupon: couponInput.trim() || undefined,
          customer: {
            name: effName || 'Cliente AnimaSystem',
            email: cleanEmail,
            phone: rawPhone || undefined,
            cpf: rawCpf || undefined
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
        if (data.pixQrCode) {
          setAsaasPixQrCode(data.pixQrCode);
        }
        if (data.pixCopyPaste) {
          setAsaasPixCopyPaste(data.pixCopyPaste);
        }
        if (data.orderId) {
          setActiveOrderId(data.orderId);
          localStorage.setItem('lastAsaasOrderId', data.orderId);
          localStorage.setItem('lastCustomerName', effName);
          localStorage.setItem('lastCustomerEmail', cleanEmail);
          localStorage.setItem('lastPlanName', planParam || 'profissional');
          localStorage.setItem('lastTotal', total.toFixed(2));
        }
        setModalStep('asaas_redirect');
      } else {
        const errMsg = data.error || (response.status === 405 ? 'Serviço de pagamento indisponível no momento. Tente novamente.' : 'Não foi possível gerar a fatura no Asaas.');
        setLeadError(errMsg);
        setModalStep('asaas_redirect');
      }
    } catch (err: any) {
      console.error('Error connecting to Asaas checkout:', err);
      setLeadError(err.message || 'Não foi possível conectar ao Asaas. Tente novamente.');
      setModalStep('asaas_redirect');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Handler when user clicks "Finalizar Renovação" or "Finalizar Compra" -> Direct to Asaas
  const handleOpenCheckoutModal = () => {
    setLeadError('');
    setIsPaymentConfirmed(false);

    const effName = (leadName || clientInfo?.responsible || clientInfo?.name || clientInfo?.companyRazaoSocial || '').trim();
    const effPhone = (leadPhone || clientInfo?.phone || clientInfo?.companyPhone || '').replace(/\D/g, '');
    const effCpf = (leadCpf || clientInfo?.cpf || clientInfo?.cnpj || clientInfo?.companyCnpj || '').replace(/\D/g, '');
    const effEmail = (leadEmail || clientInfo?.email || clientInfo?.companyEmail || '').trim();

    // Se faltar informação crítica de nome
    if (!effName && !clientInfo) {
      setLeadError('Aviso: Falta a informação do Nome no cadastro do cliente.');
    }

    // Abre DIRETO a página de pagamento do Asaas / PIX
    setIsPaymentModalOpen(true);
    setModalStep('asaas_redirect');

    if (!generatedCheckoutUrl) {
      generateAsaasCheckout(effName, effEmail, effPhone, effCpf);
    }
  };

  // Handler for Lead Form submission
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

    await generateAsaasCheckout(leadName, leadEmail, cleanPhone, cleanCpf);
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

      {/* JANELA MODAL EM TELA CHEIA (ABRE DE CIMA PRA BAIXO, FECHA PARA BAIXO) */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div 
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-[100] w-full h-[100dvh] bg-[#F4F5F8] flex flex-col overflow-hidden select-auto font-sans"
          >
            {/* Header Fixo Superior no Padrão do Sistema */}
            <header className="bg-white border-b border-zinc-200 shrink-0 z-30 shadow-xs">
              <div className="w-full px-4 sm:px-8 xl:px-12 py-3.5 sm:py-4 flex items-center justify-between">
                
                {/* Lado Esquerdo: Identificação & Logo */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#0c0d0e] text-[#D7FE03] flex items-center justify-center font-black text-xs shadow-xs">
                    {clientInfo?.logoInitials || 'AS'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-base sm:text-lg text-zinc-900 leading-tight">
                        {isRenewal ? 'Renovação Segura de Hospedagem' : 'Pagamento Seguro'}
                      </h2>
                      {clientInfo?.name && (
                        <span className="hidden md:inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200">
                          {clientInfo.name}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Total: <strong className="text-zinc-900 font-extrabold font-mono">R$ {total.toFixed(2).replace('.', ',')}</strong> • Liberação e reconhecimento automático via Asaas
                    </p>
                  </div>
                </div>

                {/* Lado Direito: Ações (Abrir em Nova Aba + Fechar) */}
                <div className="flex items-center gap-2">
                  {generatedCheckoutUrl && modalStep === 'asaas_redirect' && (
                    <a
                      href={generatedCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
                      title="Abrir em aba externa do Asaas"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir em Nova Aba</span>
                    </a>
                  )}

                  <button 
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                    title="Fechar Janela (Deslizar para baixo)"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

              </div>
            </header>

            {/* Conteúdo Central em Tela Toda */}
            <main className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-white">
              
              {isPaymentConfirmed ? (
                /* TELA DE SUCESSO E PAGAMENTO RECONHECIDO PELO ASAAS */
                <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center space-y-6 bg-white overflow-y-auto">
                  <div className="w-24 h-24 rounded-full bg-[#D7FE03] flex items-center justify-center mx-auto text-black shadow-2xl animate-bounce">
                    <CheckCircle2 className="w-14 h-14 text-black stroke-[2.5]" />
                  </div>

                  <div className="space-y-2 max-w-md">
                    <span className="inline-block text-xs font-black bg-emerald-100 text-emerald-800 px-3.5 py-1 rounded-full uppercase tracking-wider">
                      Pagamento Confirmado no Asaas
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                      {isRenewal ? 'Hospedagem Renovada com Sucesso!' : 'Assinatura Ativada!'}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed">
                      Seu pagamento foi identificado e compensado em tempo real. O seu site e todos os serviços continuam 100% ativos e o aviso de vencimento foi removido.
                    </p>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 max-w-sm w-full text-left space-y-2.5 shadow-xs">
                    <div className="flex justify-between text-xs text-zinc-600">
                      <span>Cliente:</span>
                      <strong className="text-zinc-900">{leadName || clientInfo?.name}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-600">
                      <span>Valor Total Pago:</span>
                      <strong className="text-zinc-900 font-mono font-bold">R$ {total.toFixed(2).replace('.', ',')}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-600 pt-2 border-t border-zinc-200">
                      <span>Status do Sistema:</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Ativo & Liberado
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2.5 text-xs font-bold text-zinc-700 pt-2">
                    <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                    <span>Fechando janela e atualizando painel...</span>
                  </div>
                </div>
              ) : modalStep === 'asaas_redirect' ? (
                /* PÁGINA DE PAGAMENTO ASAAS E PIX NATIVO */
                <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-zinc-900">
                  
                  {/* Faixa Superior com Informação de Sincronização em Tempo Real e Abas */}
                  <div className="bg-[#0c0d0e] border-b border-zinc-800 text-white px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D7FE03] animate-ping" />
                      <div>
                        <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                          <span>Ambiente Seguro Asaas</span>
                          <span className="text-[10px] bg-[#D7FE03] text-black px-2 py-0.5 rounded font-black uppercase tracking-wider">
                            Reconhecimento Imediato
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Pague via PIX com liberação instantânea ou abra o checkout completo do Asaas.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-zinc-800/90 p-1 rounded-xl flex items-center border border-zinc-700">
                        <button
                          type="button"
                          onClick={() => setActivePaymentTab('pix')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activePaymentTab === 'pix'
                              ? 'bg-[#D7FE03] text-black shadow-xs'
                              : 'text-zinc-300 hover:text-white'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>PIX Imediato</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePaymentTab('asaas_page')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activePaymentTab === 'asaas_page'
                              ? 'bg-[#D7FE03] text-black shadow-xs'
                              : 'text-zinc-300 hover:text-white'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Cartão / Boleto / Asaas</span>
                        </button>
                      </div>

                      {generatedCheckoutUrl && (
                        <a
                          href={generatedCheckoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[#D7FE03] border border-zinc-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <span>Abrir no Asaas</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo Principal: Aba PIX ou Aba Checkout Externo Asaas */}
                  <div className="flex-1 w-full h-full relative bg-[#F4F5F8] overflow-y-auto">
                    {activePaymentTab === 'pix' ? (
                      <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
                        <div className="w-full max-w-2xl bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                          
                          {leadError && (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
                              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <strong className="font-bold block text-amber-900 mb-0.5">Aviso sobre os Dados do Cadastro:</strong>
                                <span>{leadError}</span>
                              </div>
                            </div>
                          )}

                          <div className="text-center space-y-1">
                            <div className="inline-flex items-center gap-2 bg-[#D7FE03]/20 border border-[#D7FE03]/40 text-black px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                              <Zap className="w-3.5 h-3.5 fill-black" />
                              <span>Liberação em Menos de 30 Segundos</span>
                            </div>
                            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
                              Escaneie o QR Code ou Copie o Código PIX
                            </h3>
                            <p className="text-xs text-zinc-500 max-w-md mx-auto">
                              Abra o aplicativo do seu banco, escolha <strong>Pagar com PIX</strong> e aponte a câmera ou cole o código Copia e Cola.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-zinc-50 p-5 sm:p-6 rounded-2xl border border-zinc-200/70">
                            
                            {/* QR Code Container */}
                            <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
                              <div className="p-3 bg-white border border-zinc-200 rounded-2xl shadow-xs flex items-center justify-center">
                                {asaasPixQrCode ? (
                                  <img 
                                    src={`data:image/png;base64,${asaasPixQrCode}`} 
                                    alt="QR Code PIX Asaas" 
                                    className="w-44 h-44 object-contain rounded-lg"
                                  />
                                ) : (
                                  <div className="w-44 h-44 bg-zinc-100 flex flex-col items-center justify-center rounded-lg p-3 text-center space-y-2">
                                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                                    <span className="text-[11px] text-zinc-500 font-medium">Gerando QR Code PIX Asaas...</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                <span>Aguardando pagamento no banco</span>
                              </div>
                            </div>

                            {/* Resumo & Copia e Cola */}
                            <div className="md:col-span-7 space-y-4">
                              <div className="bg-white p-4 rounded-xl border border-zinc-200/80 space-y-2 text-xs">
                                <div className="flex justify-between text-zinc-600">
                                  <span>Beneficiário:</span>
                                  <strong className="text-zinc-900 font-bold">Anima System / Asaas I.P. S.A.</strong>
                                </div>
                                <div className="flex justify-between text-zinc-600">
                                  <span>Identificação:</span>
                                  <strong className="text-zinc-900 font-mono">{activeOrderId || 'AS-RENOVACAO'}</strong>
                                </div>
                                <div className="flex justify-between text-zinc-600 pt-2 border-t border-zinc-100">
                                  <span className="font-semibold">Valor Total com Desconto:</span>
                                  <span className="text-base font-black text-zinc-900 font-mono">
                                    R$ {total.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              </div>

                              {/* Código Copia e Cola */}
                              <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                                  Código PIX Copia e Cola
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    readOnly
                                    value={asaasPixCopyPaste || pixKey}
                                    className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-700 pr-24 focus:outline-none select-all"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const textToCopy = asaasPixCopyPaste || pixKey;
                                      navigator.clipboard.writeText(textToCopy);
                                      setPixCopySuccess(true);
                                      setTimeout(() => setPixCopySuccess(false), 2500);
                                    }}
                                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    {pixCopySuccess ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-[#D7FE03]" />
                                        <span className="text-[#D7FE03]">Copiado!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copiar</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Ações e Outros Métodos */}
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setActivePaymentTab('asaas_page')}
                                  className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold underline flex items-center gap-1"
                                >
                                  Prefiro pagar com Cartão de Crédito ou Boleto
                                </button>
                              </div>
                            </div>

                          </div>

                          {/* Dica de Segurança */}
                          <div className="flex items-center justify-between text-xs text-zinc-500 bg-zinc-100/80 p-3 rounded-xl">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>O sistema identifica o pagamento no Asaas automaticamente a cada 2 segundos.</span>
                            </div>
                            <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                              <Lock className="w-3 h-3" />
                              <span>SSL 256-Bit</span>
                            </div>
                          </div>

                        </div>
                      </div>
                    ) : (
                      /* Aba de Visualização do Asaas (Native Credit Card Checkout) */
                      <div className="w-full h-full bg-[#F3F4F6] overflow-y-auto">
                        
                        {/* Asaas Blue Header Mimic */}
                        <div className="bg-[#0230A5] text-white p-6 sm:p-8">
                          <div className="max-w-2xl mx-auto space-y-4">
                            <div>
                              <h2 className="text-xl sm:text-2xl font-bold">{leadName || clientInfo?.responsible || clientInfo?.name || 'Cliente'}</h2>
                              <p className="text-blue-100 font-mono text-sm">{formatCpf(leadCpf || clientInfo?.cpf || clientInfo?.cnpj || '')}</p>
                            </div>
                            
                            <div className="text-sm text-blue-100 space-y-1">
                              <p>{leadEmail || clientInfo?.email || 'Nenhum email fornecido'}</p>
                              <p>{formatPhone(leadPhone || clientInfo?.phone || '')}</p>
                            </div>

                            <div className="pt-2 border-t border-blue-800/50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                <span className="text-sm font-medium">Aguardando Pagamento</span>
                              </div>
                              <a href={generatedCheckoutUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-200 underline hover:text-white">
                                Visualizar Boleto original
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Asaas Body Content */}
                        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
                          
                          <h3 className="text-lg font-medium text-zinc-800">Dados da fatura - {activeOrderId || 'AS-RENOVACAO'}</h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm space-y-2">
                              <span className="text-xs text-zinc-600 font-semibold block">Valor total</span>
                              <span className="text-2xl font-bold text-[#0230A5]">R$ {total.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm space-y-2">
                              <span className="text-xs text-zinc-600 font-semibold block">Data de vencimento</span>
                              <span className="text-xl font-bold text-[#0230A5]">{new Date().toLocaleDateString('pt-BR')}</span>
                              <span className="text-[10px] text-zinc-400 block">(hoje)</span>
                            </div>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm space-y-2">
                            <span className="text-xs text-zinc-600 font-semibold block">Descrição</span>
                            <p className="text-sm text-zinc-800">Pedido {activeOrderId || 'AS-RENOVACAO'} - {planDetails[planParam]?.name}</p>
                          </div>

                          {/* Credit Card Form */}
                          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                              <CreditCard className="w-6 h-6 text-zinc-900" />
                              <h3 className="text-lg font-bold text-zinc-900">Pagamento com Cartão</h3>
                            </div>

                            <form onSubmit={handleCreditCardSubmit} className="space-y-4">
                              {ccError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                                  {ccError}
                                </div>
                              )}
                              
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700">Número do Cartão</label>
                                <input 
                                  type="text" 
                                  required
                                  placeholder="0000 0000 0000 0000"
                                  maxLength={19}
                                  value={ccNumber}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                                    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                                    setCcNumber(formatted);
                                  }}
                                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-zinc-400 focus:bg-white transition-all font-mono"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700">Nome Impresso no Cartão</label>
                                <input 
                                  type="text" 
                                  required
                                  placeholder="NOME COMPLETO"
                                  value={ccName}
                                  onChange={(e) => setCcName(e.target.value.toUpperCase())}
                                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-zinc-400 focus:bg-white transition-all uppercase"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-zinc-700">Validade</label>
                                  <input 
                                    type="text" 
                                    required
                                    placeholder="MM/AA"
                                    maxLength={5}
                                    value={ccExpiry}
                                    onChange={(e) => {
                                      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                      if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2);
                                      setCcExpiry(val);
                                    }}
                                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-zinc-400 focus:bg-white transition-all font-mono text-center"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-zinc-700">CVV</label>
                                  <input 
                                    type="text" 
                                    required
                                    placeholder="123"
                                    maxLength={4}
                                    value={ccCvv}
                                    onChange={(e) => setCcCvv(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-zinc-400 focus:bg-white transition-all font-mono text-center"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700">Parcelamento</label>
                                <select 
                                  value={ccInstallments}
                                  onChange={(e) => setCcInstallments(Number(e.target.value))}
                                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-zinc-400 focus:bg-white transition-all font-medium text-zinc-700"
                                >
                                  <option value={1}>1x de R$ {total.toFixed(2).replace('.', ',')}</option>
                                  {[2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>
                                      {num}x de R$ {(total / num).toFixed(2).replace('.', ',')} sem juros
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="pt-4 flex flex-col gap-3">
                                <button
                                  type="submit"
                                  disabled={isProcessingCC || !ccNumber || !ccName || !ccExpiry || !ccCvv}
                                  className="w-full py-4 bg-[#D7FE03] hover:bg-[#c4e602] text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isProcessingCC ? (
                                    <>
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      <span>Processando...</span>
                                    </>
                                  ) : (
                                    <span>Pagar R$ {total.toFixed(2).replace('.', ',')}</span>
                                  )}
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => setActivePaymentTab('pix')}
                                  className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-colors"
                                >
                                  Voltar para PIX Automático
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Faixa Inferior com Instruções e Botão de Acesso */}
                  <footer className="bg-white border-t border-zinc-200 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Assim que o pagamento for concluído no Asaas, esta janela fechará automaticamente.</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (activeOrderId) {
                            try {
                              await fetch(`/api/asaas/check-order?orderId=${encodeURIComponent(activeOrderId)}`);
                            } catch (e) {}
                          }
                          setIsPaymentModalOpen(false);
                          navigate('/admin-cliente');
                        }}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Já Paguei (Acessar Painel)
                      </button>
                    </div>
                  </footer>

                </div>
              ) : (
                /* FORMULÁRIO RÁPIDO DE DADOS CASO NÃO PREENCHIDO ANTERIORMENTE */
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex items-center justify-center bg-[#F4F5F8]">
                  <div className="w-full max-w-xl bg-white border border-zinc-200/80 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
                    
                    <div className="border-b border-zinc-100 pb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-zinc-900">
                        {isRenewal ? 'Identificação da Renovação' : 'Dados do Pedido'}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Confirme seus dados para emissão da fatura e liberação imediata no Asaas.
                      </p>
                    </div>

                    {leadError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl font-medium">
                        {leadError}
                      </div>
                    )}

                    <form onSubmit={handleLeadSubmit} className="space-y-4">
                      {/* Campo Nome */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                          Nome Completo / Razão Social *
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
                            placeholder="Ex: contato@empresa.com.br"
                            value={leadEmail}
                            onChange={(e) => setLeadEmail(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {/* Campo Telefone */}
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

                      {/* Campo CPF / CNPJ */}
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

                      {/* Botão Prosseguir */}
                      <div className="pt-3">
                        <button 
                          type="submit"
                          disabled={isSubmittingLead}
                          className="w-full py-4 rounded-2xl bg-[#D7FE03] hover:bg-[#c2e502] disabled:opacity-50 text-black font-extrabold text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isSubmittingLead ? (
                            <span>Carregando ambiente Asaas...</span>
                          ) : (
                            <>
                              <span>Ir para Pagamento Incorporado</span>
                              <ArrowRight className="w-4 h-4 stroke-[3]" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                  </div>
                </div>
              )}

            </main>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
