import { cn } from '../../utils';
import { useState, useEffect, FormEvent } from 'react';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, 
  QrCode, AlertCircle, FileText, Download, Filter, Search,
  CheckCircle2, Clock, Plus, X, ArrowUpCircle, ArrowDownCircle,
  Edit2, Trash2, ChevronDown
, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../NotificationContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { TransactionData } from '../../types';
import { KPICard } from '../KPICard';
import { ConfirmationModal } from '../ConfirmationModal';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function FinanceView({ onNavigate }: { onNavigate?: (view: any, id?: string) => void }) {
  const { showSuccess, showError } = useNotification();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    const bqProjectId = localStorage.getItem('bqProjectId');
    const bqDatasetId = localStorage.getItem('bqDatasetId');
    const bqTableId = localStorage.getItem('bqTableId');

    if (!bqProjectId || !bqDatasetId || !bqTableId) {
      showError("Configuração ausente", "Configure a sincronização do BigQuery nas Configurações do sistema.");
      return;
    }

    setIsSyncing(true);
    try {
      const url = `/api/gcp/billing-sync-bigquery?bqProjectId=${encodeURIComponent(bqProjectId)}&bqDatasetId=${encodeURIComponent(bqDatasetId)}&bqTableId=${encodeURIComponent(bqTableId)}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.details || "Falha ao sincronizar com o BigQuery.");
      }

      showSuccess("Sincronização concluída", "Dados financeiros atualizados com sucesso.");
    } catch (err: any) {
      console.error(err);
      showError("Erro na sincronização", err.message || "Erro desconhecido");
    } finally {
      setIsSyncing(false);
    }
  };
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [dismissedTransactions, setDismissedTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
  const [generatingBoletoId, setGeneratingBoletoId] = useState<string | null>(null);
  const [generatedBoleto, setGeneratedBoleto] = useState<{id: string, code: string, newValue: number} | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null);
  
  // Custom dropdown states
  const [isFormTypeDropdownOpen, setIsFormTypeDropdownOpen] = useState(false);
  const [isFormStatusDropdownOpen, setIsFormStatusDropdownOpen] = useState(false);
  const [isFormMethodDropdownOpen, setIsFormMethodDropdownOpen] = useState(false);
  const [isFormGatewayDropdownOpen, setIsFormGatewayDropdownOpen] = useState(false);
  const [isClientSearchFocused, setIsClientSearchFocused] = useState(false);

  const [formData, setFormData] = useState<Partial<TransactionData>>({
    title: '',
    clientName: '',
    type: 'entrada',
    method: 'manual',
    status: 'paid',
    gateway: 'manual',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'transactions'),
      where('ownerId', '==', auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: TransactionData[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as TransactionData);
      });
      // sort by date descending
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
    });

    const qDismissed = query(
      collection(db, 'dismissed_transactions'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubDismissed = onSnapshot(qDismissed, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setDismissedTransactions(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'dismissed_transactions');
    });

    return () => {
      unsubscribe();
      unsubDismissed();
    };
  }, []);

  const handleEdit = (trx: any) => {
    if (trx.isVirtual) {
      alert("Para editar gerar essa transacao manualmente, você pode 'Dar como Pago Manualmente' na página do cliente primeiro.");
      return;
    }
    setEditingId(trx.id || null);
    setFormData({
      type: trx.type,
      method: trx.method,
      status: trx.status,
      gateway: trx.gateway,
      date: trx.date,
      amount: trx.amount,
      clientName: trx.clientName,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (trx: any) => {
    try {
      if (trx.isVirtual) {
        await addDoc(collection(db, 'dismissed_transactions'), {
          ownerId: auth.currentUser?.uid,
          clientId: trx.clientId,
          clientName: trx.clientName,
          date: trx.date,
          amount: trx.amount,
          dismissedAt: serverTimestamp()
        });
      } else {
        await deleteDoc(doc(db, 'transactions', trx.id));
      }
      setTransactionToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'transactions');
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      title: '',
      clientName: '',
      type: 'entrada',
      method: 'manual',
      status: 'paid',
      gateway: 'manual',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleAddTransaction = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    const dataToSave = {
      ...formData,
      amount: Number(formData.amount),
      ...(formData.type === 'saida' ? { status: 'paid', method: 'manual', gateway: 'manual' } : {})
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'transactions', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'transactions'), {
          ...dataToSave,
          ownerId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch (err) {
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, 'transactions');
    }
  };

  const [clientsData, setClientsData] = useState<any[]>([]);
  
  useEffect(() => {
    if (!auth.currentUser) return;
    const qClients = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid));
    const unsub = onSnapshot(qClients, (snap) => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setClientsData(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clients');
    });
    return () => unsub();
  }, []);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayDay = now.getDate();
  
  const virtualTransactions: any[] = [];
  
  let mrr = 0; 
  let faturadoMes = 0;
  let aReceber = 0;
  let inadimplencia = 0;
  let clientesAtrasados = 0;
  
  // Calculate MRR from active clients (fixed to come)
  clientsData.forEach(c => {
    if (c.status === 'active') {
       mrr += (Number(c.monthlyValue) || 0);
       
       const hasTransactionThisMonth = transactions.some(
         t => t.clientName === c.name && t.date.startsWith(currentMonthStr)
       );

       if (!hasTransactionThisMonth && c.monthlyValue) {
          const dueDay = Number(c.dueDate) || 1;
          let virtStatus = 'pending';
          
          if (dueDay < todayDay) {
             virtStatus = 'overdue';
          }
          
          const dateStr = `${currentMonthStr}-${String(dueDay).padStart(2, '0')}`;
          
          // Check if this virtual transaction has been manually deleted
          const isDismissed = dismissedTransactions.some(
            d => d.clientId === c.id && d.date === dateStr
          );

          if (!isDismissed) {
            virtualTransactions.push({
              id: `v_${c.id}`,
              isVirtual: true,
              type: 'entrada',
              clientName: c.name,
              amount: Number(c.monthlyValue),
              date: dateStr,
              dueDate: dateStr,
              status: virtStatus,
              method: 'boleto',
              gateway: 'manual',
              dueDay: dueDay,
              clientId: c.id
            });
          }
       }
    }
  });

  // Calculate Faturado Mes from paid transactions
  transactions.forEach(t => {
    if (t.type === 'entrada') {
      if (t.status === 'paid' && t.date.startsWith(currentMonthStr)) {
        faturadoMes += t.amount;
      }
      if (t.status === 'overdue') {
        inadimplencia += t.amount;
        clientesAtrasados++;
      }
    }
  });

  virtualTransactions.forEach(t => {
    if (t.status === 'overdue') {
       inadimplencia += t.amount;
       clientesAtrasados++;
    }
  });

  aReceber = Math.max(0, mrr - faturadoMes);

  const allTransactionsList = [...transactions, ...virtualTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = allTransactionsList.filter((trx: any) => {
    const matchesSearch = trx.clientName?.toLowerCase().includes(search.toLowerCase()) || trx.title?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || trx.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string, isVirtual?: boolean, dueDay?: number) => {
    if (status === 'paid') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Pago</span>;
    if (status === 'pending') {
      if (isVirtual && dueDay === todayDay) {
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-medium text-orange-400"><Clock className="w-3.5 h-3.5" /> Vencendo Hoje</span>;
      }
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500 border border-blue-500 text-xs font-semibold text-white"><Clock className="w-3.5 h-3.5" /> {isVirtual ? 'A Receber' : 'Aguardando'}</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-600"><AlertCircle className="w-3.5 h-3.5" /> Atrasado {isVirtual ? '(Pendente)' : ''}</span>;
  };

  const getMethodIcon = (method: string) => {
    if (method === 'pix') return <QrCode className="w-4 h-4 text-emerald-600" />;
    if (method === 'credit_card') return <CreditCard className="w-4 h-4 text-accent" />;
    return <FileText className="w-4 h-4 text-zinc-500" />;
  };

  return (
    <div className="flex flex-col h-full space-y-14 relative">
      {/* Greeting Row Pattern */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-5 text-left">
          <button 
            onClick={() => onNavigate?.('dashboard')}
            className="w-12 h-12 rounded-full bg-transparent border border-zinc-200/80 flex items-center justify-center text-zinc-500 hover:bg-white hover:text-black transition-all cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="text-[40px] font-normal text-zinc-900 tracking-tight whitespace-nowrap">
              Financeiro
            </h1>
          </div>
        </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 w-full sm:w-auto">
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all w-full sm:w-auto text-sm cursor-pointer"
        >
          <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          {isSyncing ? "Atualizando..." : "Atualizar dados"}
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-black font-semibold rounded-xl transition-all w-full sm:w-auto text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Transação
        </button>
      </div>
      </div>

      {/* Finance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard data={{ title: 'Entradas Totais (Aprox MRR)', value: `R$ ${mrr >= 1000 ? (mrr/1000).toFixed(1) + 'k' : mrr.toFixed(2)}`, trend: 12, icon: DollarSign }} highlighted />
        <KPICard data={{ title: 'Faturado (Mês)', value: `R$ ${faturadoMes >= 1000 ? (faturadoMes/1000).toFixed(1) + 'k' : faturadoMes.toFixed(2)}`, trend: 8, icon: ArrowUpRight }} />
        <KPICard data={{ title: 'A Receber', value: `R$ ${aReceber >= 1000 ? (aReceber/1000).toFixed(1) + 'k' : aReceber.toFixed(2)}`, icon: Clock }} />
        <div onClick={() => setIsOverdueModalOpen(true)} className="bg-[#0c0d0f] rounded-3xl p-7 relative overflow-hidden group select-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1.5 border border-zinc-200/80">
          {/* Top visual gradient border */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 to-rose-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Icon badge inside circular background container */}
          <div className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <AlertCircle className="w-5 h-5" />
          </div>

          <div className="flex flex-col h-full justify-between">
            <div className="mb-6">
              <span className="text-zinc-500 text-[11px] font-bold block uppercase tracking-wider">
                Inadimplência
              </span>
              <h3 className="text-2.5xl sm:text-3.5xl font-black text-red-600 tracking-tight mt-4 group-hover:text-red-350 transition-colors">
                R$ {inadimplencia >= 1000 ? (inadimplencia/1000).toFixed(1) + 'k' : inadimplencia.toFixed(2)}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <span className="bg-red-500/15 text-red-600 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Crítico
              </span>
              <span className="text-[10px] text-zinc-500 font-semibold">
                {clientesAtrasados} transações atrasadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ASAAS integration removed as requested - pure manual/local ledger mode */}

      {/* Transactions List */}
      <div className="bg-white border border-zinc-200/80 rounded-[2rem] flex flex-col flex-1 relative">
        <div className="p-4 sm:p-6 border-b border-zinc-200/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative group w-full sm:w-72 shrink-0">
              <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar cliente ou transação..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-zinc-200 focus:border-accent/50 outline-none rounded-full py-2.5 pl-11 pr-4 text-sm text-zinc-800 placeholder:text-zinc-500 transition-all"
              />
            </div>
            
            <div className="relative w-full sm:w-auto shrink-0 z-30">
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center justify-between gap-2.5 bg-white border border-zinc-200 text-sm text-zinc-700 rounded-full py-2.5 pl-5 pr-8 outline-none focus:border-accent/50 transition-all select-none cursor-pointer w-full sm:w-auto sm:min-w-[170px] relative"
              >
                <span>
                  {filter === 'all' ? 'Todas as Cobranças' :
                   filter === 'paid' ? 'Pagas' :
                   filter === 'pending' ? 'Aguardando' : 'Atrasadas'}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 absolute right-3.5 top-1/2 -translate-y-1/2", isFilterDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isFilterDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsFilterDropdownOpen(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="absolute left-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-45 py-1 overflow-hidden w-full sm:min-w-[175px]"
                      style={{ transformOrigin: 'top' }}
                    >
                      {[
                        { val: 'all', label: 'Todas as Cobranças' },
                        { val: 'paid', label: 'Pagas' },
                        { val: 'pending', label: 'Aguardando' },
                        { val: 'overdue', label: 'Atrasadas' }
                      ].map(item => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => {
                            setFilter(item.val as any);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                            filter === item.val
                              ? "text-accent font-semibold hover:bg-white/40"
                              : "text-zinc-700 hover:bg-white"
                          )}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Carregando transações...</div>
          ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 text-sm text-zinc-500 bg-white/20">
                <th className="font-medium p-4 pl-6">ID / Cliente (ou Tipo)</th>
                <th className="font-medium p-4">Valor</th>
                <th className="font-medium p-4">Tipo</th>
                <th className="font-medium p-4">Método</th>
                <th className="font-medium p-4">Pagamento/Data</th>
                <th className="font-medium p-4">Status</th>
                <th className="font-medium p-4 text-right pr-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredTransactions.map(trx => (
                <tr key={trx.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                   <td className="p-4 pl-6">
                     <p className="font-medium text-zinc-800">{trx.title || trx.clientName || 'Sem Título'}</p>
                     <p className="text-xs text-zinc-500 mt-0.5 font-mono">{trx.title && trx.clientName ? trx.clientName : trx.id?.substring(0,8)}</p>
                   </td>
                   <td className="p-4">
                     <span className={cn(
                       "text-sm font-medium",
                       trx.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                     )}>
                       {trx.type === 'entrada' ? '+' : '-'} R$ {trx.amount?.toFixed(2)}
                     </span>
                   </td>
                   <td className="p-4">
                     {trx.type === 'entrada' ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
                          <ArrowUpCircle className="w-3.5 h-3.5" /> Entrada
                        </span>
                     ) : (
                        <span className="flex items-center gap-1.5 text-xs text-rose-600 font-medium bg-rose-500/10 px-2 py-0.5 rounded-full w-fit">
                          <ArrowDownCircle className="w-3.5 h-3.5" /> Saída
                        </span>
                     )}
                   </td>
                   <td className="p-4">
                     <div className="flex items-center gap-2 text-sm text-zinc-500 capitalize">
                       {getMethodIcon(trx.method)}
                       {trx.method?.replace('_', ' ')}
                     </div>
                   </td>
                   <td className="p-4 text-sm text-zinc-500">{trx.date.split('-').reverse().join('/')}</td>
                   <td className="p-4">
                     {getStatusBadge(trx.status, trx.isVirtual, trx.dueDay)}
                   </td>
                                       <td className="p-4 pr-6 flex items-center justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      {trx.isVirtual ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setTransactionToDelete(trx); }}
                          className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                          title="Excluir Cobrança Projetada"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(trx); }}
                            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-accent transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setTransactionToDelete(trx); }}
                            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>
      
      {/* Modal Nova Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 w-full max-w-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold">{editingId ? 'Editar Transação' : 'Nova Transação (Manual)'}</h2>
              <button 
                onClick={resetForm}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className={`grid gap-4 ${formData.type === 'saida' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-zinc-500">Tipo da Transação</label>
                  <button
                    type="button"
                    onClick={() => setIsFormTypeDropdownOpen(!isFormTypeDropdownOpen)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent flex items-center justify-between select-none cursor-pointer text-left text-zinc-800"
                  >
                    <span>{formData.type === 'entrada' ? 'Entrada (Receita)' : 'Saída (Despesa)'}</span>
                    <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0", isFormTypeDropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isFormTypeDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsFormTypeDropdownOpen(false)}></div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="absolute left-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-40 py-1 overflow-hidden min-w-[160px]"
                          style={{ transformOrigin: 'top left' }}
                        >
                          {[
                            { val: 'entrada', label: 'Entrada (Receita)' },
                            { val: 'saida', label: 'Saída (Despesa)' }
                          ].map(item => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, type: item.val as any});
                                setIsFormTypeDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                                formData.type === item.val
                                  ? "text-accent font-semibold hover:bg-white/40"
                                  : "text-zinc-700 hover:bg-white"
                              )}
                            >
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-500">Valor (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: e.target.value as any})}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-500">{formData.type === 'entrada' ? 'Título da Entrada' : 'Título da Saída'}</label>
                  <input 
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                    placeholder={formData.type === 'entrada' ? "Ex: Mensalidade, Desenvolvimento, etc..." : "Ex: Conta de Luz, Marketing, etc..."}
                  />
                </div>

                {formData.type === 'entrada' && (
                  <div className="space-y-1.5 relative">
                    <label className="text-sm font-medium text-zinc-500 flex items-center justify-between">
                      <span>Cliente Relacionado</span>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Opcional</span>
                    </label>
                    <input 
                      type="text"
                      value={formData.clientName || ''}
                      onChange={e => setFormData({...formData, clientName: e.target.value})}
                      onFocus={() => setIsClientSearchFocused(true)}
                      onBlur={() => {
                        setTimeout(() => setIsClientSearchFocused(false), 200);
                      }}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                      placeholder="Buscar cliente para abater na mensalidade..."
                      autoComplete="off"
                    />

                    {isClientSearchFocused && clientsData && clientsData.length > 0 && (
                      (() => {
                        const filteredClients = clientsData.filter(client => 
                          client.name.toLowerCase().includes((formData.clientName || '').toLowerCase())
                        );
                        if (filteredClients.length === 0) return null;
                        return (
                          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-50 py-1 max-h-48 overflow-y-auto">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200/80 mb-1">
                              Selecionar Cliente Ativo
                            </div>
                            {filteredClients.map(client => (
                              <button
                                key={client.id}
                                type="button"
                                onMouseDown={() => {
                                  setFormData({
                                    ...formData,
                                    clientName: client.name,
                                    title: formData.title ? formData.title : "Mensalidade",
                                    amount: formData.amount ? formData.amount : client.monthlyValue
                                  });
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:text-accent hover:bg-white transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span>{client.name}</span>
                                <span className="text-xs font-medium text-zinc-400">R$ {Number(client.monthlyValue || 0).toFixed(2)}/mês</span>
                              </button>
                            ))}
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-500">Data (Receb./Pag.)</label>
                  <input 
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-700 outline-none focus:border-accent [color-scheme:dark]"
                  />
                </div>
                {formData.type !== 'saida' && (
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-zinc-500">Status</label>
                  <button
                    type="button"
                    onClick={() => setIsFormStatusDropdownOpen(!isFormStatusDropdownOpen)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent flex items-center justify-between select-none cursor-pointer text-left text-zinc-800"
                  >
                    <span>
                      {formData.status === 'paid' ? 'Pago' :
                       formData.status === 'pending' ? 'Aguardando' : 'Atrasado'}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0", isFormStatusDropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isFormStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsFormStatusDropdownOpen(false)}></div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="absolute left-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-40 py-1 overflow-hidden min-w-[160px]"
                          style={{ transformOrigin: 'top left' }}
                        >
                          {[
                            { val: 'paid', label: 'Pago' },
                            { val: 'pending', label: 'Aguardando' },
                            { val: 'overdue', label: 'Atrasado' }
                          ].map(item => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, status: item.val as any});
                                setIsFormStatusDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                                formData.status === item.val
                                  ? "text-accent font-semibold hover:bg-white/40"
                                  : "text-zinc-700 hover:bg-white"
                              )}
                            >
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {formData.type !== 'saida' && (
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-zinc-500">Método de Recebimento</label>
                  <button
                    type="button"
                    onClick={() => setIsFormMethodDropdownOpen(!isFormMethodDropdownOpen)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent flex items-center justify-between select-none cursor-pointer text-left text-zinc-800"
                  >
                    <span>
                      {formData.method === 'manual' ? 'Dinheiro / Outros' :
                       formData.method === 'pix' ? 'PIX' :
                       formData.method === 'credit_card' ? 'Cartão de Crédito' : 'Boleto'}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0", isFormMethodDropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isFormMethodDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsFormMethodDropdownOpen(false)}></div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="absolute left-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-40 py-1 overflow-hidden min-w-[160px]"
                          style={{ transformOrigin: 'top left' }}
                        >
                          {[
                            { val: 'manual', label: 'Dinheiro / Outros' },
                            { val: 'pix', label: 'PIX' },
                            { val: 'credit_card', label: 'Cartão de Crédito' },
                            { val: 'boleto', label: 'Boleto' }
                          ].map(item => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, method: item.val as any, gateway: 'manual'});
                                setIsFormMethodDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                                formData.method === item.val
                                  ? "text-accent font-semibold hover:bg-white/40"
                                  : "text-zinc-700 hover:bg-white"
                              )}
                            >
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold bg-white hover:bg-zinc-200 text-black rounded-xl transition-colors shadow-lg shadow-white/5"
                >
                  Salvar Transação
                </button>
              </div>
            </form>
          </div>
        
      

</div>
      )}

      {/* Overdue Modal */}
      <AnimatePresence>
        {isOverdueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-zinc-200"
            >
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-black text-lg tracking-tight">Inadimplência</h3>
                    <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Clientes com pagamentos atrasados</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsOverdueModalOpen(false);
                    setGeneratedBoleto(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-black transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#f8f9fa]">
                {allTransactionsList.filter(t => t.status === 'overdue' && (t.type === 'entrada' || t.isVirtual)).length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-zinc-600 font-bold">Nenhum cliente inadimplente.</p>
                  </div>
                ) : (
                  allTransactionsList.filter(t => t.status === 'overdue' && (t.type === 'entrada' || t.isVirtual)).map(t => {
                    // Calculate days overdue
                    const today = new Date();
                    const due = new Date(t.date);
                    // Ensure we don't get negative values if math fails, though status === overdue already ensures it is in past
                    const diffTime = Math.abs(today.getTime() - due.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    const baseValue = t.amount;
                    const multa = 2.00;
                    const jurosPorDia = 0.006667;
                    const jurosTotal = baseValue * jurosPorDia * diffDays;
                    const totalAtualizado = baseValue + multa + jurosTotal;

                    const isGenerating = generatingBoletoId === t.id;
                    const isGenerated = generatedBoleto?.id === t.id;

                    return (
                      <div key={t.id} className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-zinc-900">{t.title || t.clientName || 'Cliente sem nome'}</h4>
                            {t.title && t.clientName && <p className="text-xs text-zinc-500 font-medium">{t.clientName}</p>}
                            <p className="text-xs text-zinc-500 mt-0.5">Vencimento: {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className="text-sm font-black text-red-600">R$ {baseValue.toFixed(2)}</span>
                              <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{diffDays} dias de atraso</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            {isGenerated ? (
                              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-center animate-fade-in">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Novo Boleto</p>
                                <p className="text-sm font-black text-emerald-600 mb-2">R$ {generatedBoleto.newValue.toFixed(2)}</p>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(generatedBoleto.code);
                                    alert("Linha digitável copiada!");
                                  }}
                                  className="w-full text-[10px] bg-black text-white py-1.5 rounded-lg font-bold uppercase cursor-pointer hover:bg-zinc-800 transition-colors"
                                >
                                  Copiar Código
                                </button>
                              </div>
                            ) : (
                              <button
                                disabled={isGenerating}
                                onClick={() => {
                                  setGeneratingBoletoId(t.id);
                                  setTimeout(() => {
                                    setGeneratingBoletoId(null);
                                    setGeneratedBoleto({
                                      id: t.id,
                                      code: "34191.09008 63396.643329 02519.820000 8 " + Math.floor(Math.random() * 100000000000000),
                                      newValue: totalAtualizado
                                    });
                                  }, 1500);
                                }}
                                className="bg-zinc-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {isGenerating ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Calculando...
                                  </>
                                ) : (
                                  <>Gerar Cobrança Atualizada</>
                                )}
                              </button>
                            )}
                            
                            {!isGenerated && (
                              <p className="text-[9px] text-zinc-400 text-center">
                                + R$ 2,00 multa + 0,66% a.d.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmationModal
        isOpen={transactionToDelete !== null}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (transactionToDelete) handleDelete(transactionToDelete);
        }}
        onCancel={() => setTransactionToDelete(null)}
      />
    </div>
  );
}

