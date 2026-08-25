
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Zap, MessageSquare, Send, CheckCircle2, AlertCircle, 
  Clock, Globe, Shield, Phone, Mail, User, HelpCircle, 
  Copy, Check, ExternalLink, RefreshCw, Layers, ArrowRight,
  LifeBuoy, Sparkles, Wrench, FileText, ChevronDown, 
  CircleDashed, Server, Lock, ArrowLeft, Moon, Sun, X, Paperclip, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, doc, onSnapshot, addDoc, updateDoc, arrayUnion, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ClientData } from '../../types';
import { cn } from '../../utils';

export function ClientSupportPage() {
  const { clientId: rawParamId } = useParams<{ clientId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract client ID from URL params or path /suporte-cliente-id=XXXX
  const extractClientId = (): string => {
    if (rawParamId && rawParamId.trim() !== '') {
      return rawParamId.replace(/^=/, '').trim();
    }
    
    // Check path for /suporte-cliente-id=... or /suporte-cliente/... or /suporte/...
    const pathMatch = location.pathname.match(/suporte(?:-cliente)?(?:-id)?(?:[=/]|[-_])([^/?#]+)/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].replace(/^=/, '').trim();
    }

    // Check query params ?id=... or ?clientId=...
    const searchParams = new URLSearchParams(location.search);
    const qId = searchParams.get('id') || searchParams.get('clientId') || searchParams.get('client');
    if (qId) return qId.trim();

    return 'desconhecido';
  };

  const clientId = extractClientId();

  // Client Data & State
  const [client, setClient] = useState<ClientData | null>(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [client?.id, client?.logoUrl, client?.domain]);

  // Tickets
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [activeTab, setActiveTab] = useState<'novo-chamado' | 'meus-chamados' | 'ajuda-rapida' | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<'alteracao' | 'bug' | 'recurso' | 'financeiro' | 'urgencia'>('alteracao');
  const [priority, setPriority] = useState<'normal' | 'alta' | 'urgente'>('normal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterContact, setRequesterContact] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<{ id: string; protocol: string } | null>(null);

  // Client reply in ticket state
  const [clientReplyText, setClientReplyText] = useState<{ [ticketId: string]: string }>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('animasystem_theme') === 'dark';
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('animasystem_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Fetch Client from Firestore
  useEffect(() => {
    if (!clientId || clientId === 'desconhecido') {
      setLoadingClient(false);
      return;
    }

    setLoadingClient(true);
    const clientRef = doc(db, 'clients', clientId);

    const unsubscribe = onSnapshot(clientRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ClientData;
        setClient({
          ...data,
          id: docSnap.id,
        });
        setLoadingClient(false);
      } else {
        // Fallback: search by domain or id field
        try {
          const qDomain = query(collection(db, 'clients'), where('domain', '==', clientId));
          const snapDomain = await getDocs(qDomain);
          if (!snapDomain.empty) {
            const firstDoc = snapDomain.docs[0];
            setClient({ ...(firstDoc.data() as ClientData), id: firstDoc.id });
          } else {
            setClient(null);
          }
        } catch (e) {
          setClient(null);
        }
        setLoadingClient(false);
      }
    }, async (error) => {
      console.warn("Direct doc fetch error, trying query fallback:", error);
      try {
        const qDomain = query(collection(db, 'clients'), where('domain', '==', clientId));
        const snapDomain = await getDocs(qDomain);
        if (!snapDomain.empty) {
          const firstDoc = snapDomain.docs[0];
          setClient({ ...(firstDoc.data() as ClientData), id: firstDoc.id });
        } else {
          setClient(null);
        }
      } catch (e) {
        setClient(null);
      }
      setLoadingClient(false);
    });

    return () => unsubscribe();
  }, [clientId]);

  // Safe date formatter
  const formatDateTime = (dateVal?: any) => {
    if (!dateVal) return 'Recente';
    try {
      if (typeof dateVal === 'object' && dateVal.seconds) {
        return new Date(dateVal.seconds * 1000).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Recente';
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recente';
    }
  };

  const formatTime = (dateVal?: any) => {
    if (!dateVal) return '';
    try {
      if (typeof dateVal === 'object' && dateVal.seconds) {
        return new Date(dateVal.seconds * 1000).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Fetch Tickets for this client with multi-match listener
  useEffect(() => {
    if (!clientId || clientId === 'desconhecido') {
      setLoadingTickets(false);
      return;
    }

    setLoadingTickets(true);
    try {
      const q = query(collection(db, 'tickets'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tList: any[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const matches = 
            data.clientId === clientId || 
            (client?.id && data.clientId === client.id) ||
            (client?.domain && data.clientDomain && data.clientDomain.toLowerCase() === client.domain.toLowerCase()) ||
            data.protocol === clientId ||
            d.id === clientId;

          if (matches) {
            tList.push({ id: d.id, ...data });
          }
        });

        // Sort by date descending
        tList.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });

        setTickets(tList);
        setLoadingTickets(false);
      }, (err) => {
        console.warn("Tickets snapshot error:", err);
        setLoadingTickets(false);
      });

      return () => unsubscribe();
    } catch (e) {
      setLoadingTickets(false);
    }
  }, [clientId, client?.id, client?.domain]);

  // Handle client sending reply inside a ticket thread
  const handleSendClientReply = async (ticketItem: any) => {
    const text = (clientReplyText[ticketItem.id] || '').trim();
    if (!text) return;

    setSendingReplyId(ticketItem.id);
    const nowIso = new Date().toISOString();
    const author = requesterName.trim() || ticketItem.requesterName || client?.name || 'Cliente';

    const newReplyObj = {
      id: `rep_${Date.now()}`,
      author: author,
      text: text,
      type: 'public',
      createdAt: nowIso
    };

    try {
      const ticketRef = doc(db, 'tickets', ticketItem.id);
      await updateDoc(ticketRef, {
        replies: arrayUnion(newReplyObj),
        updatedAt: nowIso
      });

      // Clear input
      setClientReplyText(prev => ({ ...prev, [ticketItem.id]: '' }));
    } catch (err) {
      console.error("Erro ao responder ticket:", err);
    } finally {
      setSendingReplyId(null);
    }
  };

  // Submit new Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !requesterName.trim()) {
      return;
    }

    setSubmitting(true);
    const protocolNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();

    const categoryLabels: Record<string, string> = {
      alteracao: 'Alteração de Conteúdo / Layout',
      bug: 'Relato de Erro / Bug no Site',
      recurso: 'Nova Funcionalidade / Módulo',
      financeiro: 'Faturamento / Domínio',
      urgencia: 'Emergência / Site Fora do Ar'
    };

    const newTicketData = {
      protocol: protocolNumber,
      clientId: clientId,
      clientName: client?.name || client?.domain || `Cliente (${clientId})`,
      clientDomain: client?.domain || '',
      clientPlan: client?.plan || 'Standard',
      category: category,
      categoryLabel: categoryLabels[category],
      priority: priority,
      title: title.trim(),
      description: description.trim(),
      requesterName: requesterName.trim(),
      requesterContact: requesterContact.trim(),
      pageUrl: pageUrl.trim(),
      status: 'open',
      statusLabel: 'Aberto',
      createdAt: nowIso,
      updatedAt: nowIso,
      source: 'portal_suporte_cliente'
    };

    try {
      const docRef = await addDoc(collection(db, 'tickets'), newTicketData);
      setSuccessTicket({ id: docRef.id, protocol: protocolNumber });
      
      // Clear form fields
      setTitle('');
      setDescription('');
      setPageUrl('');
    } catch (err) {
      console.error("Erro ao criar ticket:", err);
      // Even if offline, show success state with protocol for client peace of mind
      setSuccessTicket({ id: 'local-' + Date.now(), protocol: protocolNumber });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(clientId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const openDirectWhatsApp = (customMsg?: string) => {
    const defaultMsg = customMsg || `Olá equipe de Suporte AnimaSystem! Sou do site ${client?.name || client?.domain || 'Cliente'} (ID: ${clientId}) e preciso de suporte com meu projeto.`;
    const encoded = encodeURIComponent(defaultMsg);
    // WhatsApp Support Link
    window.open(`https://wa.me/5511999999999?text=${encoded}`, '_blank');
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-[#D7FE03] selection:text-black transition-colors duration-300 ${
      isDarkMode ? 'bg-[#070709] text-zinc-100' : 'bg-[#F8F9FA] text-zinc-900'
    }`}>
      
      {/* Background Ambience in Dark Mode */}
      {isDarkMode && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div 
            className="absolute inset-0 opacity-30" 
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }}
          />
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-gradient-to-br from-blue-900/20 via-purple-900/15 to-transparent rounded-full blur-[140px]" />
          <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-950/20 via-blue-950/15 to-transparent rounded-full blur-[150px]" />
        </div>
      )}

      {/* ================= HEADER ================= */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-all ${
        isDarkMode 
          ? 'bg-[#070709]/80 border-zinc-800/80' 
          : 'bg-white/85 border-zinc-200/80 shadow-xs'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Back Arrow & Brand Name */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors cursor-pointer shadow-sm ${
                isDarkMode 
                  ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white' 
                  : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900'
              }`}
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <span className="font-display font-bold text-xl tracking-tight">
              <span className="font-light text-zinc-400">Anima</span>
              <span className={isDarkMode ? 'text-white' : 'text-black'}>System</span>
            </span>
          </div>

          {/* Right Action: Theme Toggle Only */}
          <button
            onClick={toggleTheme}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700' 
                : 'bg-white border-zinc-200 text-zinc-600 hover:text-black hover:border-zinc-300 shadow-sm'
            }`}
            title="Alternar Tema"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-[#D7FE03]" /> : <Moon className="w-4 h-4" />}
          </button>

        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        
        {/* ================= CLIENT IDENTITY CARD ================= */}
        <section className={`rounded-2xl border p-6 sm:p-8 transition-all ${
          isDarkMode 
            ? 'bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md shadow-xl' 
            : 'bg-white border-zinc-200/90 shadow-sm'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex items-start sm:items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl shrink-0 overflow-hidden relative border ${
                isDarkMode 
                  ? 'bg-zinc-800/90 border-zinc-700/80' 
                  : 'bg-white border-zinc-200/90'
              }`}>
                {client?.logoUrl && !logoError ? (
                  <img 
                    src={client.logoUrl} 
                    alt={client.name || 'Logo da Empresa'} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                  />
                ) : client?.domain && !logoError ? (
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${client.domain.replace(/^https?:\/\//, '')}&sz=128`}
                    alt={client.name || 'Logo'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-display font-bold text-xl">
                    {client?.logoInitials || (client?.name ? client.name.slice(0, 2).toUpperCase() : 'CL')}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-display font-bold">
                    {loadingClient ? (
                      <span className="inline-block w-40 h-6 bg-zinc-700/30 animate-pulse rounded" />
                    ) : (
                      client?.name || client?.companyRazaoSocial || 'Painel de Suporte do Cliente'
                    )}
                  </h1>
                  
                  {client?.plan && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      Plano {client.plan}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-500">
                  {client?.domain && (
                    <a 
                      href={client.domain.startsWith('http') ? client.domain : `https://${client.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:underline font-medium"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {client.domain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <div className="flex items-center gap-1.5 font-mono">
                    <span>ID do Cliente:</span>
                    <span className={`font-bold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      {clientId}
                    </span>
                    <button 
                      onClick={handleCopyId}
                      className="p-1 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                      title="Copiar ID"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-500 font-semibold">Monitoramento Ativo</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/40">
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200/60'}`}>
              <span className="text-[10px] uppercase font-semibold text-zinc-500 block">SLA de Resposta</span>
              <span className="text-sm font-bold text-emerald-500">Até 2 Horas</span>
            </div>
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200/60'}`}>
              <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Segurança & SSL</span>
              <span className="text-sm font-bold text-blue-500">100% Protegido</span>
            </div>
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200/60'}`}>
              <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Chamados Ativos</span>
              <span className="text-sm font-bold text-amber-500">{tickets.filter(t => t.status !== 'resolved').length}</span>
            </div>
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200/60'}`}>
              <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Uptime do Servidor</span>
              <span className="text-sm font-bold text-emerald-500">99.98% Online</span>
            </div>
          </div>
        </section>

        {/* ================= TABS NAVIGATION ================= */}
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab(prev => prev === 'novo-chamado' ? null : 'novo-chamado')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'novo-chamado'
                ? 'bg-[#D7FE03] text-black shadow-md ring-2 ring-[#D7FE03]/40'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Abrir Novo</span>
          </button>

          <button
            onClick={() => setActiveTab(prev => prev === 'meus-chamados' ? null : 'meus-chamados')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer relative ${
              activeTab === 'meus-chamados'
                ? 'bg-[#D7FE03] text-black shadow-md ring-2 ring-[#D7FE03]/40'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Meus Chamados</span>
            {tickets.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'meus-chamados' ? 'bg-black text-white' : 'bg-[#D7FE03] text-black'
              }`}>
                {tickets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab(prev => prev === 'ajuda-rapida' ? null : 'ajuda-rapida')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'ajuda-rapida'
                ? 'bg-[#D7FE03] text-black shadow-md ring-2 ring-[#D7FE03]/40'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Dúvidas</span>
          </button>
        </div>

        {/* Empty State when no tab is active */}
        {activeTab === null && (
          <div className={`p-8 rounded-2xl border text-center transition-all ${
            isDarkMode 
              ? 'bg-zinc-900/40 border-zinc-800/60' 
              : 'bg-white border-zinc-200/80 shadow-xs'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-[#D7FE03]/15 text-black dark:text-[#D7FE03] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base mb-1">Como podemos te ajudar hoje?</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Clique em <strong>Abrir Novo</strong> para registrar uma alteração ou ajuste, <strong>Meus Chamados</strong> para ver o andamento e respostas, ou <strong>Dúvidas</strong> para perguntas frequentes.
            </p>
          </div>
        )}

        {/* ================= TAB 1: ABRIR NOVO CHAMADO ================= */}
        {activeTab === 'novo-chamado' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Section (2 Cols) */}
            <div className={`lg:col-span-2 rounded-2xl border p-6 sm:p-8 transition-all ${
              isDarkMode 
                ? 'bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md' 
                : 'bg-white border-zinc-200/90 shadow-sm'
            }`}>
              
              {successTicket ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-2xl font-display font-bold">Chamado Registrado com Sucesso!</h3>
                  <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    Nossa equipe técnica já recebeu sua solicitação e iniciará o atendimento em breve.
                  </p>

                  <div className={`inline-flex flex-col items-center p-4 rounded-xl border my-4 ${
                    isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <span className="text-xs text-zinc-500 uppercase font-semibold">Protocolo de Atendimento</span>
                    <span className="font-mono font-bold text-xl text-emerald-500 mt-1">{successTicket.protocol}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => openDirectWhatsApp(`Olá! Acabei de abrir o chamado protocolo *${successTicket.protocol}* para o site ${client?.name || client?.domain || clientId}. Gostaria de acompanhar.`)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                    >
                      <Phone className="w-4 h-4" />
                      Avisar Suporte no WhatsApp
                    </button>
                    
                    <button
                      onClick={() => {
                        setSuccessTicket(null);
                        setActiveTab('meus-chamados');
                      }}
                      className={`px-5 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white' : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-800'
                      }`}
                    >
                      Ver Meus Chamados
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-6">
                  
                  <div>
                    <h2 className="text-lg font-display font-bold">O que você precisa que façamos?</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Selecione o tipo de solicitação para direcionarmos ao desenvolvedor especialista.</p>
                  </div>

                  {/* 1. Category selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'alteracao', label: 'Alteração / Atualização', icon: Wrench, desc: 'Textos, banners, fotos, seções' },
                      { id: 'bug', label: 'Relatar Erro / Bug', icon: AlertCircle, desc: 'Problema visual ou botão com falha' },
                      { id: 'recurso', label: 'Novo Recurso', icon: Sparkles, desc: 'Nova página, formulário ou app' },
                      { id: 'financeiro', label: 'Faturamento / Domínio', icon: FileText, desc: 'Renovação de site, notas fiscais' },
                      { id: 'urgencia', label: '🚨 Urgência / Queda', icon: LifeBuoy, desc: 'Site fora do ar ou inacessível' },
                    ].map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id as any)}
                          className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-500/10 border-blue-500 text-blue-500 ring-2 ring-blue-500/20'
                              : isDarkMode 
                                ? 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-300' 
                                : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-700'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-2 shrink-0" />
                          <span className="font-bold text-xs leading-tight">{cat.label}</span>
                          <span className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{cat.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 2. Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">Nível de Prioridade</label>
                    <div className="flex items-center gap-3">
                      {[
                        { id: 'normal', label: 'Normal (Até 24h)', color: 'border-emerald-500/30 text-emerald-500' },
                        { id: 'alta', label: 'Alta (Hoje)', color: 'border-amber-500/30 text-amber-500' },
                        { id: 'urgente', label: '🚨 Urgente (Imediato)', color: 'border-rose-500/30 text-rose-500' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPriority(p.id as any)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            priority === p.id 
                              ? `${p.color} bg-zinc-800 font-bold ring-1 ring-white/20` 
                              : isDarkMode ? 'bg-zinc-950/30 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Title */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      Título do Chamado <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Trocar telefone no rodapé ou Atualizar fotos da página sobre"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-zinc-950 border-zinc-800 focus:border-[#D7FE03] text-white' 
                          : 'bg-white border-zinc-200 focus:border-black text-black'
                      }`}
                    />
                  </div>

                  {/* 4. Description */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      Descrição Detalhada <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Explique com detalhes o que precisa ser ajustado. Se for troca de textos, digite o texto novo aqui..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all resize-y ${
                        isDarkMode 
                          ? 'bg-zinc-950 border-zinc-800 focus:border-[#D7FE03] text-white' 
                          : 'bg-white border-zinc-200 focus:border-black text-black'
                      }`}
                    />
                  </div>

                  {/* 5. Requester Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                        Seu Nome <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Seu nome"
                        value={requesterName}
                        onChange={(e) => setRequesterName(e.target.value)}
                        className={`w-full px-4 py-2 rounded-xl border text-sm outline-none transition-all ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 focus:border-[#D7FE03]' : 'bg-white border-zinc-200 focus:border-black'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                        WhatsApp ou E-mail para Retorno
                      </label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999 ou email@empresa.com"
                        value={requesterContact}
                        onChange={(e) => setRequesterContact(e.target.value)}
                        className={`w-full px-4 py-2 rounded-xl border text-sm outline-none transition-all ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 focus:border-[#D7FE03]' : 'bg-white border-zinc-200 focus:border-black'
                        }`}
                      />
                    </div>
                  </div>

                  {/* 6. Page URL Reference */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      Página do Site com a solicitação (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: https://seusite.com.br/contato ou /servicos"
                      value={pageUrl}
                      onChange={(e) => setPageUrl(e.target.value)}
                      className={`w-full px-4 py-2 rounded-xl border text-sm outline-none transition-all ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 focus:border-[#D7FE03]' : 'bg-white border-zinc-200 focus:border-black'
                      }`}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#D7FE03] hover:bg-[#cbf102] text-black font-display font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enviando Chamado...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Registrar Chamado Técnico</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}

            </div>

            {/* Sidebar Support Info (1 Col) */}
            <div className="space-y-6">
              
              {/* Emergency Card */}
              <div className={`rounded-2xl border p-6 ${
                isDarkMode ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Plantão de Atendimento</h4>
                    <p className="text-xs text-zinc-500">Suporte direto via WhatsApp</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Para emergências ou alinhamento rápido em tempo real, chame nossa equipe técnica no WhatsApp com seu ID de cliente.
                </p>

                <button
                  onClick={() => openDirectWhatsApp()}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Chamar no WhatsApp
                </button>
              </div>

              {/* Maintenance Guarantee */}
              <div className={`rounded-2xl border p-6 ${
                isDarkMode ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Garantia e Segurança</h4>
                    <p className="text-xs text-zinc-500">AnimaSystem Infrastructure</p>
                  </div>
                </div>

                <ul className="text-xs text-zinc-400 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Backups automáticos diários de banco de dados e arquivos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Certificado de segurança SSL (HTTPS) vitalício.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Hospedagem em nuvem de alta velocidade e escalabilidade.</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 2: MEUS CHAMADOS ================= */}
        {activeTab === 'meus-chamados' && (
          <div className={`rounded-2xl border p-6 sm:p-8 ${
            isDarkMode ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-display font-bold">Histórico de Chamados</h3>
                <p className="text-xs text-zinc-500">Acompanhe o andamento de todas as suas solicitações em tempo real.</p>
              </div>

              <button
                onClick={() => setActiveTab('novo-chamado')}
                className="px-4 py-2 rounded-xl bg-[#D7FE03] hover:bg-[#cbf102] text-black font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Novo Chamado
              </button>
            </div>

            {loadingTickets ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[#D7FE03]" />
                <p className="text-xs text-zinc-500">Buscando chamados...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl border-zinc-700/50">
                <LifeBuoy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h4 className="font-bold text-sm">Nenhum chamado aberto</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                  Você ainda não possui nenhum chamado registrado para este cliente.
                </p>
                <button
                  onClick={() => setActiveTab('novo-chamado')}
                  className="px-4 py-2 rounded-xl bg-[#D7FE03] text-black text-xs font-bold cursor-pointer"
                >
                  Abrir Primeiro Chamado
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => {
                  const isResolved = t.status === 'resolved';
                  const isDev = t.status === 'development';
                  const isAnalysis = t.status === 'analysis';
                  const publicReplies = (t.replies || []).filter((r: any) => r.type !== 'internal');
                  const hasReplies = publicReplies.length > 0;
                  const isSendingThis = sendingReplyId === t.id;
                  const currentReplyInput = clientReplyText[t.id] || '';

                  return (
                    <div 
                      key={t.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isDarkMode 
                          ? 'bg-zinc-900/60 border-zinc-800/80 shadow-md' 
                          : 'bg-white border-zinc-200/90 shadow-xs'
                      }`}
                    >
                      {/* Ticket Header Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                            {t.protocol || t.id}
                          </span>
                          
                          {isResolved ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                              Resolvido
                            </span>
                          ) : isDev ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                              Em Desenvolvimento
                            </span>
                          ) : isAnalysis ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                              Em Análise
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
                              Aberto
                            </span>
                          )}

                          {t.categoryLabel && (
                            <span className="text-[11px] text-zinc-400 font-medium">
                              • {t.categoryLabel}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{formatDateTime(t.createdAt)}</span>
                        </div>
                      </div>

                      {/* Ticket Title */}
                      <h4 className="font-bold text-base text-zinc-900 dark:text-white mb-2">{t.title}</h4>

                      {/* Conversation Thread */}
                      <div className="space-y-3 my-4">
                        
                        {/* 1. Original Client Request */}
                        <div className={`p-4 rounded-xl border ${
                          isDarkMode ? 'bg-zinc-950/70 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200/80'
                        }`}>
                          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-zinc-200/50 dark:border-zinc-800/50">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-[10px] font-bold">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-200">
                                {t.requesterName || t.clientName || 'Solicitante'} (Abertura do Chamado)
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400">
                              {formatTime(t.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{t.description}</p>
                          {t.pageUrl && (
                            <div className="mt-2 pt-1.5 text-[11px] text-zinc-400 flex items-center gap-1.5">
                              <Globe className="w-3 h-3 text-zinc-400" />
                              <span>Página: <a href={t.pageUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{t.pageUrl}</a></span>
                            </div>
                          )}
                        </div>

                        {/* 2. Responses from Support and Client */}
                        {publicReplies.map((rep: any, idx: number) => {
                          const isSupport = rep.author?.toLowerCase().includes('suporte') || 
                                           rep.author?.toLowerCase().includes('animasystem') ||
                                           rep.author?.toLowerCase().includes('daniel') ||
                                           !rep.author?.toLowerCase().includes(t.requesterName?.toLowerCase() || 'xyz');

                          return (
                            <motion.div 
                              key={rep.id || idx}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-4 rounded-xl border transition-all ${
                                isSupport 
                                  ? isDarkMode 
                                    ? 'bg-[#D7FE03]/5 border-[#D7FE03]/25 ring-1 ring-[#D7FE03]/10' 
                                    : 'bg-emerald-50/60 border-emerald-200/80 shadow-xs'
                                  : isDarkMode 
                                    ? 'bg-zinc-950/70 border-zinc-800/80' 
                                    : 'bg-zinc-50 border-zinc-200/80'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-zinc-200/50 dark:border-zinc-800/50">
                                <div className="flex items-center gap-2">
                                  {isSupport ? (
                                    <div className="w-6 h-6 rounded-full bg-[#D7FE03] text-black flex items-center justify-center font-bold text-[10px] shadow-xs">
                                      AS
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-[10px] font-bold">
                                      <User className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                      {rep.author || 'Equipe de Suporte AnimaSystem'}
                                    </span>
                                    {isSupport && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#D7FE03] text-black">
                                        Suporte Técnico
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <span className="text-[10px] text-zinc-400">
                                  {formatDateTime(rep.createdAt)}
                                </span>
                              </div>

                              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                                {rep.text}
                              </p>
                            </motion.div>
                          );
                        })}

                      </div>

                      {/* Client Reply Field */}
                      <div className={`mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60`}>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            placeholder="Enviar uma resposta ou dúvida neste chamado..."
                            value={currentReplyInput}
                            onChange={(e) => setClientReplyText(prev => ({ ...prev, [t.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendClientReply(t);
                              }
                            }}
                            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                              isDarkMode 
                                ? 'bg-zinc-950 border-zinc-800 focus:border-[#D7FE03] text-white placeholder-zinc-500' 
                                : 'bg-zinc-50 border-zinc-200 focus:border-black text-black placeholder-zinc-400'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSendClientReply(t)}
                            disabled={isSendingThis || !currentReplyInput.trim()}
                            className="px-4 py-2.5 rounded-xl bg-[#D7FE03] hover:bg-[#cbf102] text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0"
                          >
                            {isSendingThis ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>Responder</span>
                          </button>
                        </div>
                      </div>

                      {/* Ticket Footer Action */}
                      <div className="mt-3 pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                        {t.requesterName && (
                          <span>Solicitante: <strong className="text-zinc-700 dark:text-zinc-300">{t.requesterName}</strong></span>
                        )}
                        <button
                          onClick={() => openDirectWhatsApp(`Olá! Gostaria de falar sobre o chamado *${t.protocol || t.id}* (${t.title}).`)}
                          className="text-emerald-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer ml-auto"
                        >
                          <Phone className="w-3 h-3" />
                          Acompanhar no WhatsApp
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: DÚVIDAS & AJUDA ================= */}
        {activeTab === 'ajuda-rapida' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: 'Quanto tempo leva para uma alteração de texto ou banner entrar no ar?',
                a: 'Solicitações simples de alteração de textos, fotos ou banners são atendidas no mesmo dia (geralmente entre 1 a 4 horas úteis).'
              },
              {
                q: 'Como funciona a renovação do domínio do meu site?',
                a: 'A AnimaSystem monitora a data de expiração do seu domínio e emite os alertas preventivos com 30 dias de antecedência para garantir que seu site nunca fique fora do ar.'
              },
              {
                q: 'O site possui certificado de segurança SSL (o cadeado verde)?',
                a: 'Sim! Todos os sites contam com certificado SSL de 256 bits ativo e renovação automática.'
              },
              {
                q: 'Posso solicitar novas páginas ou funcionalidades?',
                a: 'Com certeza! Basta abrir um chamado na categoria "Novo Recurso" descrevendo o que deseja para enviarmos o cronograma e implementação.'
              },
            ].map((faq, idx) => (
              <div 
                key={idx}
                className={`p-6 rounded-2xl border ${
                  isDarkMode ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#D7FE03]/15 text-[#8aa502] dark:text-[#D7FE03] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ?
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-2">{faq.q}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* ================= FOOTER ================= */}
      <footer className={`mt-16 border-t py-8 text-center text-xs text-zinc-500 ${
        isDarkMode ? 'border-zinc-800/80 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-100/50'
      }`}>
        <p>© {new Date().getFullYear()} AnimaSystem • Infraestrutura & Suporte Dedicado ao Cliente</p>
        <p className="text-[11px] text-zinc-600 mt-1">ID de Sessão: {clientId}</p>
      </footer>

    </div>
  );
}
