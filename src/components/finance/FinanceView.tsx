import { useState, useEffect, FormEvent } from 'react';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, 
  QrCode, AlertCircle, FileText, Download, Filter, Search,
  CheckCircle2, Clock, Plus, X, ArrowUpCircle, ArrowDownCircle,
  Edit2, Trash2, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { TransactionData } from '../../types';
import { cn } from '../../utils';
import { KPICard } from '../KPICard';

export function FinanceView() {
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContractsModalOpen, setIsContractsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Custom dropdown states
  const [openClientPlanDropdownId, setOpenClientPlanDropdownId] = useState<string | null>(null);
  const [isFormTypeDropdownOpen, setIsFormTypeDropdownOpen] = useState(false);
  const [isFormStatusDropdownOpen, setIsFormStatusDropdownOpen] = useState(false);
  const [isFormMethodDropdownOpen, setIsFormMethodDropdownOpen] = useState(false);
  const [isFormGatewayDropdownOpen, setIsFormGatewayDropdownOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<TransactionData>>({
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
    });

    return () => unsubscribe();
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
    if (trx.isVirtual) return;
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await deleteDoc(doc(db, 'transactions', trx.id));
      } catch (err) {
        console.error('Failed to delete transaction', err);
      }
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
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
    
    try {
      if (editingId) {
        await updateDoc(doc(db, 'transactions', editingId), {
          ...formData,
          amount: Number(formData.amount),
        });
      } else {
        await addDoc(collection(db, 'transactions'), {
          ...formData,
          ownerId: auth.currentUser.uid,
          amount: Number(formData.amount),
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save transaction', err);
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
            gateway: 'asaas',
            dueDay: dueDay,
            clientId: c.id
          });
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
    const matchesSearch = trx.clientName?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || trx.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string, isVirtual?: boolean, dueDay?: number) => {
    if (status === 'paid') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Pago</span>;
    if (status === 'pending') {
      if (isVirtual && dueDay === todayDay) {
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-medium text-orange-400"><Clock className="w-3.5 h-3.5" /> Vencendo Hoje</span>;
      }
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400"><Clock className="w-3.5 h-3.5" /> {isVirtual ? 'A Receber' : 'Aguardando'}</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400"><AlertCircle className="w-3.5 h-3.5" /> Atrasado {isVirtual ? '(Pendente)' : ''}</span>;
  };

  const getMethodIcon = (method: string) => {
    if (method === 'pix') return <QrCode className="w-4 h-4 text-emerald-400" />;
    if (method === 'credit_card') return <CreditCard className="w-4 h-4 text-accent" />;
    return <FileText className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <div className="flex flex-col h-full space-y-6 relative">
      
      
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button 
          onClick={() => setIsContractsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl transition-all w-full sm:w-auto text-sm cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          Gerenciar Contratos
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-black font-semibold rounded-xl transition-all w-full sm:w-auto text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Transação
        </button>
      </div>

      {/* Finance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard data={{ title: 'Entradas Totais (Aprox MRR)', value: `R$ ${mrr >= 1000 ? (mrr/1000).toFixed(1) + 'k' : mrr.toFixed(2)}`, trend: 12, icon: DollarSign }} highlighted />
        <KPICard data={{ title: 'Faturado (Mês)', value: `R$ ${faturadoMes >= 1000 ? (faturadoMes/1000).toFixed(1) + 'k' : faturadoMes.toFixed(2)}`, trend: 8, icon: ArrowUpRight }} />
        <KPICard data={{ title: 'A Receber', value: `R$ ${aReceber >= 1000 ? (aReceber/1000).toFixed(1) + 'k' : aReceber.toFixed(2)}`, icon: Clock }} />
        <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-400">
               <AlertCircle className="w-6 h-6" />
            </div>
            <div className="bg-red-500/20 text-red-400 text-xs font-medium px-2 py-1 rounded-md">Crítico</div>
          </div>
          <div>
            <p className="text-sm font-medium text-red-400/80 mb-1">Inadimplência</p>
            <h3 className="font-display text-3xl font-bold text-red-400">R$ {inadimplencia >= 1000 ? (inadimplencia/1000).toFixed(1) + 'k' : inadimplencia.toFixed(2)}</h3>
            <p className="text-xs text-red-400/60 mt-1">{clientesAtrasados} transações atrasadas</p>
          </div>
        </div>
      </div>

      {/* ASAAS Integration Status */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#001E60] border border-blue-900 flex items-center justify-center font-display font-bold text-white text-xs">
            ASAAS
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              Gateway Principal Online
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">Cobranças automáticas, PIX e Cartão de Crédito operando normalmente. (Integração configurável via webhook na V2)</p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] flex flex-col flex-1 relative">
        <div className="p-4 sm:p-6 border-b border-zinc-800/50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative group w-full sm:w-72 shrink-0">
              <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar cliente ou transação..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-accent/50 outline-none rounded-full py-2.5 pl-11 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 transition-all"
              />
            </div>
            
            <div className="relative w-full sm:w-auto shrink-0 z-30">
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center justify-between gap-2.5 bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-full py-2.5 pl-5 pr-8 outline-none focus:border-accent/50 transition-all select-none cursor-pointer w-full sm:w-auto sm:min-w-[170px] relative"
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
                      className="absolute left-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-45 py-1 overflow-hidden w-full sm:min-w-[175px]"
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
                              ? "text-accent font-semibold hover:bg-zinc-900/40"
                              : "text-zinc-300 hover:bg-zinc-900"
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
              <tr className="border-b border-zinc-800/50 text-sm text-zinc-500 bg-zinc-950/20">
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
                <tr key={trx.id} className="hover:bg-zinc-800/20 transition-colors group cursor-pointer">
                   <td className="p-4 pl-6">
                     <p className="font-medium text-zinc-200">{trx.clientName}</p>
                     <p className="text-xs text-zinc-500 font-mono mt-0.5">{trx.id?.substring(0,8)}</p>
                   </td>
                   <td className="p-4">
                     <span className={cn(
                       "text-sm font-medium",
                       trx.type === 'entrada' ? 'text-emerald-400' : 'text-rose-400'
                     )}>
                       {trx.type === 'entrada' ? '+' : '-'} R$ {trx.amount?.toFixed(2)}
                     </span>
                   </td>
                   <td className="p-4">
                     {trx.type === 'entrada' ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
                          <ArrowUpCircle className="w-3.5 h-3.5" /> Entrada
                        </span>
                     ) : (
                        <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium bg-rose-500/10 px-2 py-0.5 rounded-full w-fit">
                          <ArrowDownCircle className="w-3.5 h-3.5" /> Saída
                        </span>
                     )}
                   </td>
                   <td className="p-4">
                     <div className="flex items-center gap-2 text-sm text-zinc-400 capitalize">
                       {getMethodIcon(trx.method)}
                       {trx.method?.replace('_', ' ')}
                     </div>
                   </td>
                   <td className="p-4 text-sm text-zinc-400">{trx.date.split('-').reverse().join('/')}</td>
                   <td className="p-4">
                     {getStatusBadge(trx.status, trx.isVirtual, trx.dueDay)}
                   </td>
                   <td className="p-4 pr-6 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!trx.isVirtual && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(trx); }}
                            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-accent transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(trx); }}
                            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
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
      {isContractsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-xl font-display font-bold">Mensalidades e Planos</h2>
              <button 
                onClick={() => setIsContractsModalOpen(false)}
                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {clientsData.map(c => (
                <div key={c.id} className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 w-full shrink-0 min-w-44">
                    <h3 className="font-semibold text-zinc-200">{c.name}</h3>
                    <p className="text-xs text-zinc-500">{c.domain || c.cnpj || 'Sem info'}</p>
                    {c.status !== 'active' && <span className="inline-block mt-1 text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">Inativo</span>}
                  </div>
                  <div className="w-full md:w-auto grid grid-cols-3 gap-3 flex-1">
                    <div className="relative">
                      <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">Plano</label>
                      <button
                        type="button"
                        onClick={() => setOpenClientPlanDropdownId(openClientPlanDropdownId === c.id ? null : c.id)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent flex items-center justify-between gap-1 select-none cursor-pointer text-left"
                      >
                        <span>{c.plan || 'Starter'}</span>
                        <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 shrink-0", openClientPlanDropdownId === c.id && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {openClientPlanDropdownId === c.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenClientPlanDropdownId(null)}></div>
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                              className="absolute left-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-40 py-1 overflow-hidden min-w-[130px]"
                              style={{ transformOrigin: 'top left' }}
                            >
                              {['Starter', 'Pro', 'Enterprise'].map(planName => (
                                <button
                                  key={planName}
                                  type="button"
                                  onClick={async () => {
                                    await updateDoc(doc(db, 'clients', c.id), { plan: planName });
                                    setOpenClientPlanDropdownId(null);
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                                    (c.plan || 'Starter') === planName
                                      ? "text-accent font-semibold hover:bg-zinc-900/40"
                                      : "text-zinc-300 hover:bg-zinc-900"
                                  )}
                                >
                                  <span>{planName}</span>
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">Valor Mensal</label>
                      <input 
                        type="number"
                        defaultValue={c.monthlyValue || 0}
                        onBlur={async (e) => await updateDoc(doc(db, 'clients', c.id), { monthlyValue: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">Vencimento (Dia)</label>
                      <input 
                        type="number"
                        min="1" max="31"
                        defaultValue={c.dueDate || 1}
                        onBlur={async (e) => await updateDoc(doc(db, 'clients', c.id), { dueDate: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {clientsData.length === 0 && (
                <div className="text-center text-zinc-500 py-8">Nenhum cliente cadastrado.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold">{editingId ? 'Editar Transação' : 'Nova Transação (Manual)'}</h2>
              <button 
                onClick={resetForm}
                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-zinc-400">Tipo da Transação</label>
                  <button
                    type="button"
                    onClick={() => setIsFormTypeDropdownOpen(!isFormTypeDropdownOpen)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent flex items-center justify-between select-none cursor-pointer text-left text-zinc-200"
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
                          className="absolute left-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-40 py-1 overflow-hidden min-w-[160px]"
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
                                  ? "text-accent font-semibold hover:bg-zinc-900/40"
                                  : "text-zinc-300 hover:bg-zinc-900"
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
                  <label className="text-sm font-medium text-zinc-400">Valor (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: e.target.value as any})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Cliente / Descrição</label>
                <input 
                  type="text"
                  required
                  value={formData.clientName || ''}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                  placeholder="Nome do cliente ou despesa..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Data (Receb./Pag.)</label>
                  <input 
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-accent [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-zinc-400">Status</label>
                  <button
                    type="button"
                    onClick={() => setIsFormStatusDropdownOpen(!isFormStatusDropdownOpen)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent flex items-center justify-between select-none cursor-pointer text-left text-zinc-200"
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
                          className="absolute left-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-40 py-1 overflow-hidden min-w-[160px]"
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
                                  ? "text-accent font-semibold hover:bg-zinc-900/40"
                                  : "text-zinc-300 hover:bg-zinc-900"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-zinc-400">Método</label>
                  <button
                    type="button"
                    onClick={() => setIsFormMethodDropdownOpen(!isFormMethodDropdownOpen)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent flex items-center justify-between select-none cursor-pointer text-left text-zinc-200"
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
                          className="absolute left-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-40 py-1 overflow-hidden min-w-[160px]"
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
                                setFormData({...formData, method: item.val as any});
                                setIsFormMethodDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                                formData.method === item.val
                                  ? "text-accent font-semibold hover:bg-zinc-900/40"
                                  : "text-zinc-300 hover:bg-zinc-900"
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
                
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-zinc-400">Gateway</label>
                  <button
                    type="button"
                    onClick={() => setIsFormGatewayDropdownOpen(!isFormGatewayDropdownOpen)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent flex items-center justify-between select-none cursor-pointer text-left text-zinc-200"
                  >
                    <span>{formData.gateway === 'manual' ? 'Manual/Local' : 'ASAAS'}</span>
                    <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0", isFormGatewayDropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isFormGatewayDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsFormGatewayDropdownOpen(false)}></div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="absolute left-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-40 py-1 overflow-hidden min-w-[160px]"
                          style={{ transformOrigin: 'top left' }}
                        >
                          {[
                            { val: 'manual', label: 'Manual/Local' },
                            { val: 'asaas', label: 'ASAAS' }
                          ].map(item => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, gateway: item.val as any});
                                setIsFormGatewayDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                                formData.gateway === item.val
                                  ? "text-accent font-semibold hover:bg-zinc-900/40"
                                  : "text-zinc-300 hover:bg-zinc-900"
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

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
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

    </div>
  );
}

