import {  useState, useEffect } from 'react';
import {  
  ArrowLeft, Users, Database,
  FileText, MoreVertical, Edit2, Ban, Trash2, CheckCircle,
  Rocket, Power, Code, Hand, Clock, Check, Sparkles, CreditCard, Phone,
  Copy, Globe, Calendar, ExternalLink, Link as LinkIcon
} from 'lucide-react';
import {  ClientData } from '../../types';
import {  cn, formatClientRenewalDate, getClientDaysUntilRenewal, isClientRenewalAlert, getClientDomainInfo } from '../../utils';
import {  db, auth, app } from '../../lib/firebase';
import {  doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import {  ClientModal } from './ClientModal';
import {  ConfirmationModal } from '../ConfirmationModal';
import {  motion, AnimatePresence } from 'motion/react';

interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
  isClientView?: boolean;
}

type TabType = 'resumo';

export function ClientDetailView({ clientId, onBack, isClientView = false }: ClientDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('resumo');
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
    const [showPlans, setShowPlans] = useState(false);
  const [hiringPlan, setHiringPlan] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState('');
  const [copiedGuardId, setCopiedGuardId] = useState(false);
  const [copiedRenewalLink, setCopiedRenewalLink] = useState(false);

  const getRenewalUrl = (targetClient: ClientData) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://animasystem.com.br';
    const planParam = (targetClient.plan || 'profissional').toLowerCase().includes('starter') 
      ? 'starter' 
      : (targetClient.plan || '').toLowerCase().includes('enterprise') 
      ? 'enterprise' 
      : 'pro';
    return `${origin}/checkout?plan=${planParam}&isRenewal=true&client=${targetClient.id}`;
  };

  const handleCopyRenewalLink = () => {
    if (!client) return;
    const url = getRenewalUrl(client);
    navigator.clipboard.writeText(url);
    setCopiedRenewalLink(true);
    setTimeout(() => setCopiedRenewalLink(false), 2500);
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'clients', clientId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const hasAccess = isClientView 
          ? data.authUid === auth.currentUser?.uid 
          : data.ownerId === auth.currentUser?.uid;
          
        if (hasAccess) {
          if (isClientView && data.plan === 'Starter' && (!data.domain || data.domain === '') && !data.companyRazaoSocial) {
            updateDoc(doc(db, 'clients', docSnap.id), { plan: 'Nenhum' });
          }
          setClient({ id: docSnap.id, ...data } as ClientData);
        } else {
          setClient(null);
        }
      } else {
        setClient(null);
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId, isClientView]);

  const handleToggleStatus = async (status: 'active' | 'suspended' | 'ended' | 'developing' | 'trial') => {
    if (!client) return;
    if (status === 'trial') {
      setIsTrialModalOpen(true);
      setShowMenu(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'clients', client.id), { status, trialEndDate: null });
      setShowMenu(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status do cliente.');
    }
  };

  const handleConfirmTrial = async () => {
    if (!client || !trialEndDate) return;
    try {
      await updateDoc(doc(db, 'clients', client.id), { status: 'trial', trialEndDate });
      setIsTrialModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status para trial.');
    }
  };

  const handleDelete = async () => {
    if (!client) return;
    try {
      if (client.logoUrl) {
        try {
          const { getStorage, ref, deleteObject } = await import('firebase/storage');
          const hubStorage = getStorage(app, 'gs://animahub.firebasestorage.app');
          const fileRef = ref(hubStorage, client.logoUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.warn("Storage logo deletion failed, proceeding with firestore deletion:", storageError);
        }
      }
      await deleteDoc(doc(db, 'clients', client.id));
      setShowDeleteConfirm(false);
      onBack();
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir cliente.');
    }
  };

  const handleSaveClient = async (data: ClientData) => {
    if (!client) return;
    try {
      const { id, ...updateData } = data;
      await updateDoc(doc(db, 'clients', client.id), updateData as any);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar cliente.');
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'resumo', label: 'Resumo', icon: FileText },
  ];

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Carregando dados do cliente...</div>;
  }

  if (!client) {
    return <div className="p-8 text-center text-zinc-500">Cliente não encontrado ou sem permissão.</div>;
  }

  if (isClientView && client.status === 'suspended') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-4 font-sans text-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
            <Ban className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-3">
            Acesso temporariamente indisponível
          </h1>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            Este site encontra-se temporariamente indisponível no momento. 
            Para mais informações, entre em contato com nossa equipe.
          </p>
          <a 
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 transition-colors text-black font-extrabold rounded-xl w-full justify-center shadow-lg shadow-emerald-500/20"
          >
            <Phone className="w-5 h-5 fill-current" />
            Suporte
          </a>
        </div>
      </div>
    );
  }

  const getClientGcpCost = (): { cost: number; isReal: boolean } => {
    if (client.gcpBillingCost !== undefined) {
      return { cost: client.gcpBillingCost, isReal: true };
    }
    if (!client.lastGcpMetrics) return { cost: 0, isReal: false };
    
    const metrics = client.lastGcpMetrics;
    const USD_TO_BRL = 5.45;
    const currentDay = Math.max(1, new Date().getDate());
    
    // Reads
    const readsVal = metrics.reads_billable?.value || metrics.reads_ops?.value || 0;
    const readsAfterFree = Math.max(0, readsVal - (50000 * currentDay));
    const readsCostUSD = (readsAfterFree / 100000) * 0.036;
    
    // Writes
    const writesVal = metrics.writes_billable?.value || metrics.writes_ops?.value || 0;
    const writesAfterFree = Math.max(0, writesVal - (20000 * currentDay));
    const writesCostUSD = (writesAfterFree / 100000) * 0.108;
    
    // Firestore Storage
    const fsStorageGB = (metrics.storageBytes?.value || 0) / 1024 / 1024 / 1024;
    const fsStorageAfterFree = Math.max(0, fsStorageGB - 1);
    const fsStorageCostUSD = fsStorageAfterFree * 0.108;
    
    // Cloud Storage
    const csVal1 = metrics.cloudStorageBytes?.value || 0;
    const csVal2 = metrics.cloudStorageBytesV2?.value || 0;
    const csFinalVal = Math.max(csVal1, csVal2);
    const csStorageGB = csFinalVal / 1024 / 1024 / 1024;
    const csStorageAfterFree = Math.max(0, csStorageGB - 5);
    const csStorageCostUSD = csStorageAfterFree * 0.026;
    
    const totalUSD = readsCostUSD + writesCostUSD + fsStorageCostUSD + csStorageCostUSD;
    return { cost: totalUSD * USD_TO_BRL, isReal: false };
  };

  const displayDomain = (client.domain && !client.domain.includes('.animasystem.com')) 
    ? client.domain 
    : (client.website || '');

  const hasCompanyInfo = !!(
    (client.companyRazaoSocial && client.companyRazaoSocial.trim() !== '') || 
    (client.cnpj && client.cnpj.trim() !== '') || 
    (client.companyCnpj && client.companyCnpj.trim() !== '') ||
    (client.companyPhone && client.companyPhone.trim() !== '') ||
    (client.companyEmail && client.companyEmail.trim() !== '') ||
    (displayDomain && displayDomain.trim() !== '')
  );

  const hasAddressInfo = !!(
    (client.cep && client.cep.trim() !== '') ||
    (client.street && client.street.trim() !== '') ||
    (client.number && client.number.trim() !== '') ||
    (client.neighborhood && client.neighborhood.trim() !== '') ||
    (client.complement && client.complement.trim() !== '')
  );

  const handleHirePlan = async (chosenPlan: 'Starter' | 'Profissional' | 'Enterprise', price: number) => {
    setHiringPlan(chosenPlan);
    try {
      await updateDoc(doc(db, 'clients', client.id), {
        plan: chosenPlan,
        status: 'active',
        monthlyValue: price,
        hireDate: new Date().toISOString()
      });
    } catch (e) {
      console.error("Erro ao assinar plano", e);
      alert("Erro ao processar assinatura. Tente novamente.");
    } finally {
      setHiringPlan(null);
    }
  };

  if (client.plan === 'Nenhum' && isClientView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-4 font-sans text-zinc-100">
        <AnimatePresence mode="wait">
          {!showPlans ? (
            <motion.div 
              key="sad-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="max-w-md w-full bg-white border border-zinc-200 p-8 sm:p-10 rounded-[2.5rem] text-center space-y-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center"
            >
              <div className="flex items-center justify-center">
                <svg 
                  viewBox="0 0 100 100" 
                  className="w-32 h-32 text-[#D7FE03]/60 animate-pulse"
                  style={{ filter: "drop-shadow(0 0 15px rgba(151, 251, 46, 0.4))" }}
                >
                  <rect x="34" y="22" width="8" height="32" rx="4" fill="currentColor" />
                  <rect x="58" y="22" width="8" height="32" rx="4" fill="currentColor" />
                  <path d="M 22 74 Q 50 50 78 74" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black leading-tight">
                  Sem Contratações Ativas
                </h2>
                <p className="text-zinc-500 text-sm font-light leading-relaxed">
                  Sua conta foi criada com sucesso, mas você ainda não possui nenhuma contratação ativa.
                </p>
              </div>

              <button 
                onClick={() => setShowPlans(true)}
                className="w-full py-4 px-6 rounded-full bg-[#D7FE03] hover:bg-[#c4e602] text-zinc-950 font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(215,254,3,0.35)] hover:shadow-[0_0_35px_rgba(215,254,3,0.5)] cursor-pointer transform hover:scale-[1.02]"
              >
                Ver Planos de Contratação
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="plans-state"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-5xl space-y-8"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-black font-sans">
                    Nossos Planos
                  </h2>
                  <p className="text-zinc-500 text-sm font-light mt-1">
                    Selecione o plano ideal para centralizar e monitorar a sua operação.
                  </p>
                </div>
                <button 
                  onClick={() => setShowPlans(false)}
                  className="px-5 py-2.5 rounded-full bg-white border border-zinc-200 text-zinc-500 hover:text-black hover:border-zinc-300 transition-all text-xs font-semibold tracking-wide cursor-pointer"
                >
                  Voltar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-2">
                {/* Starter */}
                <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 flex flex-col justify-between hover:border-zinc-300 transition-all relative">
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Starter</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed min-h-[35px] mb-6 font-light">
                      Para empresas que precisam de uma ferramenta pronta para organizar sua operação.
                    </p>
                    <div className="mb-6 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-black tracking-tight">R$ 60</span>
                      <span className="text-zinc-500 text-xs">/mês</span>
                    </div>
                    <ul className="space-y-3.5 mb-8">
                      {['Sistema pronto para uso', 'Cadastro e gerenciamento de clientes', 'Clientes ilimitados', 'Sistema de vendas', 'Cadastro de produtos e/ou serviços', 'Controle de operações', 'Painel administrativo', 'Acesso pelo celular e computador', 'Atualizações do sistema', 'Hospedagem inclusa', 'Banco de dados incluso', 'Suporte ao cliente'].map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-zinc-700 text-xs font-medium">
                          <Check className="w-4 h-4 text-[#D7FE03] shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    disabled={hiringPlan !== null}
                    onClick={() => handleHirePlan('Starter', 60)}
                    className="w-full py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-black font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {hiringPlan === 'Starter' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Ativar Starter'}
                  </button>
                </div>

                {/* Profissional */}
                <div className="bg-white border-2 border-[#D7FE03] rounded-[2rem] p-8 flex flex-col justify-between hover:scale-[1.01] transition-all relative shadow-[0_0_40px_rgba(215,254,3,0.1)]">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D7FE03] text-zinc-950 text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                    Mais Popular
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2 flex items-center gap-2">
                      Profissional <Sparkles className="w-4 h-4 text-[#D7FE03] fill-[#D7FE03]" />
                    </h3>
                    <p className="text-zinc-500 text-xs leading-relaxed min-h-[35px] mb-6 font-light">
                      Para empresas que precisam de um site profissional, landing page ou uma solução digital enxuta e bem estruturada.
                    </p>
                    <div className="mb-6 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-black tracking-tight">R$ 149</span>
                      <span className="text-zinc-500 text-xs">/mês</span>
                    </div>
                    <ul className="space-y-3.5 mb-8">
                      {[
                        'Site desenvolvido sob medida',
                        'Projeto personalizado',
                        'Estrutura profissional de páginas',
                        'Landing pages',
                        'Design responsivo',
                        'Formulário de contato',
                        'Integração com WhatsApp',
                        'Integração com redes sociais',
                        'Otimização para Google (SEO)',
                        'Hospedagem inclusa',
                        'Domínio personalizado',
                        'Certificado SSL',
                        'Painel administrativo, quando aplicável',
                        'Atualizações e manutenção',
                        'Suporte por 1 ano',
                        'Clientes ilimitados'
                      ].map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-zinc-800 text-xs font-medium">
                          <Check className="w-4 h-4 text-[#D7FE03] shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    disabled={hiringPlan !== null}
                    onClick={() => handleHirePlan('Profissional', 149)}
                    className="w-full py-3 rounded-full bg-[#D7FE03] hover:bg-[#c4e602] text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(215,254,3,0.2)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {hiringPlan === 'Profissional' ? (
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Assinar Profissional'}
                  </button>
                </div>

                {/* Enterprise */}
                <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 flex flex-col justify-between hover:border-zinc-300 transition-all relative">
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Enterprise</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed min-h-[35px] mb-6 font-light">
                      Para empresas que precisam de sistemas complexos, aplicativos, plataformas e soluções desenvolvidas especificamente para sua operação.
                    </p>
                    <div className="mb-6 font-extrabold text-3xl text-black tracking-tight">
                      Sob consulta
                    </div>
                    <ul className="space-y-3.5 mb-8">
                      {[
                        'Sistemas personalizados',
                        'Aplicativos Android e iOS',
                        'Plataformas web',
                        'Painéis administrativos avançados',
                        'Gestão de usuários e permissões',
                        'Sistemas de vendas',
                        'Integração com APIs',
                        'Integração com sistemas externos',
                        'GPS e geolocalização (Beta)',
                        'Automação de processos',
                        'Monitoramento em tempo real',
                        'Banco de dados escalável',
                        'Infraestrutura personalizada',
                        'Segurança avançada',
                        'Backup e recuperação',
                        'Analytics e indicadores',
                        'Integrações com pagamentos',
                        'Arquitetura preparada para escala',
                        'Suporte e manutenção personalizados'
                      ].map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-zinc-700 text-xs font-medium">
                          <Check className="w-4 h-4 text-[#D7FE03] shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    disabled={hiringPlan !== null}
                    onClick={() => handleHirePlan('Enterprise', 0)}
                    className="w-full py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-black font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {hiringPlan === 'Enterprise' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Contratar Enterprise'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-14">
      
      {/* Header Profile Info */}
      <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          {!isClientView && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-300 flex items-center justify-center text-2xl font-display font-medium text-zinc-700 overflow-hidden cursor-pointer">
                {client.logoUrl ? (
                  <img src={client.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  client.logoInitials
                )}
              </div>
              
              {client.logoUrl && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 bg-white p-2 rounded-xl shadow-2xl border border-zinc-200/80 scale-95 group-hover:scale-100 origin-top w-[140px] h-[140px] flex items-center justify-center">
                  <img src={client.logoUrl} alt="Logo Ampliada" className="w-full h-full object-cover rounded-lg" />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="truncate max-w-[150px] sm:max-w-none mr-2">{client.name}</span>

                <div className="flex bg-zinc-800 rounded-xl overflow-hidden h-8 mt-0.5">
                  <span className="px-3.5 flex items-center justify-center text-sm font-medium text-white bg-zinc-800">
                    {client.plan}
                  </span>
                  <span className={cn(
                    "px-3.5 flex items-center justify-center gap-2 text-sm font-semibold border-2 border-solid border-zinc-800 rounded-[11px]",
                    client.status === 'active' ? "bg-accent text-black" :
                    client.status === 'trial' ? "bg-blue-500 text-white" :
                    client.status === 'ended' ? "bg-zinc-500 text-white" :
                    client.status === 'developing' ? "bg-purple-500 text-white" :
                    "bg-rose-500 text-white"
                  )}>
                    {client.status === 'active' ? (
                      <><motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}><Rocket className="w-4 h-4" /></motion.div>Ativo</>
                    ) : client.status === 'trial' ? (
                      <><Clock className="w-4 h-4" />{client?.trialEndDate ? 'Trial (' + Math.max(0, Math.ceil((new Date(client.trialEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) + 'd)' : 'Trial'}</>
                    ) : client.status === 'ended' ? (
                      <><Power className="w-4 h-4" />Encerrado</>
                    ) : client.status === 'developing' ? (
                      <><Code className="w-4 h-4" />Em construção</>
                    ) : (
                      <><Hand className="w-4 h-4" />Suspenso</>
                    )}
                  </span>
                </div>
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-[11px] sm:text-sm text-zinc-500 font-mono">
                <span>
                  <span className="font-sans text-zinc-400 mr-1">ID Guard:</span>
                  <span className="text-zinc-600">{client.id}</span>
                </span>

                {client.firebaseProjectId && client.firebaseProjectId !== 'N/A' && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                    <span className="truncate max-w-[200px] sm:max-w-none">
                      <span className="font-sans text-zinc-400 mr-1">ID Cloud:</span>
                      <span className="text-zinc-600">{client.firebaseProjectId}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions Menu */}
        <div className="flex items-center gap-2">
          {!isClientView && (
            <button
              onClick={handleCopyRenewalLink}
              title="Copiar Link de Renovação do Cliente"
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs",
                copiedRenewalLink 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300"
              )}
            >
              {copiedRenewalLink ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Copiado!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Copiar Link de Renovação</span>
                </>
              )}
            </button>
          )}

          {!isClientView && (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                  <div className="absolute right-0 top-12 w-52 bg-white border border-zinc-300/50 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                    <button 
                      onClick={() => { setShowMenu(false); setIsEditing(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 flex items-center gap-2 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 text-zinc-500" />
                      Editar Cliente
                    </button>
                    
                    <div className="h-px bg-zinc-800/50 my-1"></div>
                    
                    <button 
                      onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-zinc-100 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <ClientModal 
          client={client}
          onClose={() => setIsEditing(false)}
          onSave={handleSaveClient}
        />
      )}



      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'resumo' && (
          <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-6 lg:p-10 space-y-12">
            
            {/* Informações da Empresa */}
            {hasCompanyInfo && (
              <>
                <div>
                  <h3 className="text-lg font-display font-medium text-zinc-900 mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" /> Informações da Empresa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                    {client.name && (
                      <div>
                        <span className="block text-sm text-zinc-500 mb-1">Nome da Empresa</span>
                        <span className="text-zinc-800">{client.name}</span>
                      </div>
                    )}
                    {(client.cnpj || client.companyCnpj) && (
                      <div>
                        <span className="block text-sm text-zinc-500 mb-1">CNPJ</span>
                        <span className="text-zinc-800">{client.cnpj || client.companyCnpj}</span>
                      </div>
                    )}
                    {displayDomain && (
                      <div>
                        <span className="block text-sm text-zinc-500 mb-1">Domínio / Site da Empresa</span>
                        <a 
                          href={displayDomain.startsWith('http') ? displayDomain : `https://${displayDomain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-accent hover:underline break-words font-mono font-medium"
                        >
                          {displayDomain}
                        </a>
                      </div>
                    )}
                    {displayDomain && (() => {
                      const domInfo = getClientDomainInfo(client);
                      return (
                        <>
                          <div>
                            <span className="block text-sm text-zinc-500 mb-1">Validade do Domínio</span>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-800 font-mono font-medium">{domInfo.formattedDate}</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                domInfo.isExpired 
                                  ? "bg-rose-100 text-rose-700 border border-rose-200" 
                                  : domInfo.isExpiringSoon 
                                  ? "bg-amber-100 text-amber-800 border border-amber-200" 
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              )}>
                                {domInfo.statusText}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="block text-sm text-zinc-500 mb-1">Registro do Domínio</span>
                            <span className="text-zinc-800">
                              {domInfo.years} {domInfo.years === 1 ? 'Ano' : 'Anos'} (R$ {Number(domInfo.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                            </span>
                          </div>
                        </>
                      );
                    })()}
                    {(client.domainContractDate || client.hireDate) && (
                      <div>
                        <span className="block text-sm text-zinc-500 mb-1">Data da Contratação do Domínio</span>
                        <span className="text-zinc-800">
                          {new Date((client.domainContractDate || client.hireDate) + 'T12:00:00').toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {client.hireDate && (
                      <div>
                        <span className="block text-sm text-zinc-500 mb-1">Data da Contratação do Cliente</span>
                        <span className="text-zinc-800">{new Date(client.hireDate + 'T12:00:00').toLocaleDateString()}</span>
                      </div>
                    )}
                    {client.endDate && (
                      <div>
                        <span className="block text-sm text-zinc-500 mb-1">Data do Encerramento</span>
                        <span className="text-zinc-800">{new Date(client.endDate + 'T12:00:00').toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-px bg-zinc-200 w-full" />
              </>
            )}

            {/* Informações de Cobrança */}
            <div>
              <h3 className="text-lg font-display font-medium text-zinc-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-accent" /> Informações de Cobrança & Mensalidade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Plano Ativo</span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 border border-zinc-700 text-white inline-block">
                    {client.plan || 'Nenhum'}
                  </span>
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Valor da Mensalidade</span>
                  <span className="text-zinc-800 font-semibold font-mono">
                    {client.monthlyValue !== undefined ? `R$ ${Number(client.monthlyValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                  </span>
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Custo Google Cloud</span>
                  {(() => {
                    const costObj = getClientGcpCost();
                    return (
                      <div>
                        <span className="text-emerald-600 font-semibold font-mono">
                          R$ {costObj.cost.toFixed(costObj.isReal ? 2 : 4).replace('.', ',')}
                        </span>
                        <span className="block text-[10px] text-zinc-500 mt-0.5">
                          {costObj.isReal ? 'Fatura Real Sincronizada' : 'Estimado por Telemetria'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Dia do Vencimento</span>
                  <span className="text-zinc-800">
                    {client.dueDate ? `Todo dia ${client.dueDate}` : 'Não definido'}
                  </span>
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Próxima Renovação</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "font-mono font-semibold text-sm",
                      isClientRenewalAlert(client) ? "text-rose-600 font-bold" : "text-zinc-800"
                    )}>
                      {formatClientRenewalDate(client)}
                    </span>
                    {isClientRenewalAlert(client) && (
                      <span 
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold",
                          getClientDaysUntilRenewal(client) <= 0 
                            ? "bg-rose-100 text-rose-700 border border-rose-200" 
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        )}
                      >
                        {getClientDaysUntilRenewal(client) <= 0 ? "Vencido" : `${getClientDaysUntilRenewal(client)} dias restantes`}
                      </span>
                    )}

                    <button
                      onClick={handleCopyRenewalLink}
                      title="Copiar Link Direto de Renovação"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline ml-1 cursor-pointer bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded-md text-zinc-800 transition-colors"
                    >
                      {copiedRenewalLink ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-600" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-zinc-200 w-full" />

            {/* Informações do Responsável */}
            <div>
              <h3 className="text-lg font-display font-medium text-zinc-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" /> Informações do Responsável
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                {client.responsible && (
                  <div>
                    <span className="block text-sm text-zinc-500 mb-1">Nome do responsável</span>
                    <span className="text-zinc-800">{client.responsible}</span>
                  </div>
                )}
                {client.cpf && (
                  <div>
                    <span className="block text-sm text-zinc-500 mb-1">CPF</span>
                    <span className="text-zinc-800">{client.cpf}</span>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <span className="block text-sm text-zinc-500 mb-1">Telefone</span>
                    <span className="text-zinc-800">{client.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Endereço */}
            {hasAddressInfo && (
              <>
                <div className="h-px bg-zinc-200 w-full" />
                <div>
                  <h3 className="text-lg font-display font-medium text-zinc-900 mb-6 flex items-center gap-2">
                    <Database className="w-5 h-5 text-accent" /> Endereço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                    {client.cep && (
                      <div>
                        <span className="block text-sm text-zinc-500 mb-1">CEP</span>
                        <span className="text-zinc-800">{client.cep}</span>
                      </div>
                    )}
                    {client.street && (
                      <div className="md:col-span-2 lg:col-span-2">
                        <span className="block text-sm text-zinc-500 mb-1">Rua</span>
                        <span className="text-zinc-800">{client.street}</span>
                      </div>
                    )}
                    {client.number && (
                      <div>
                        <span className="block text-sm text-zinc-500 mb-1">Número</span>
                        <span className="text-zinc-800">{client.number}</span>
                      </div>
                    )}
                    {client.neighborhood && (
                      <div>
                        <span className="block text-sm text-zinc-500 mb-1">Bairro</span>
                        <span className="text-zinc-800">{client.neighborhood}</span>
                      </div>
                    )}
                    {client.complement && (
                      <div>
                        <span className="block text-sm text-zinc-500 mb-1">Complemento</span>
                        <span className="text-zinc-800">{client.complement}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {isTrialModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-2 text-zinc-900">Período de Trial</h3>
            <p className="text-sm text-zinc-500 mb-4">Selecione a data de encerramento do trial (quando deverá mudar para o status ativo).</p>
            <input 
              type="date"
              value={trialEndDate}
              onChange={(e) => setTrialEndDate(e.target.value)}
              className="w-full bg-white border border-zinc-200 text-zinc-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-accent mb-6"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setIsTrialModalOpen(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmTrial}
                disabled={!trialEndDate}
                className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-black font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
