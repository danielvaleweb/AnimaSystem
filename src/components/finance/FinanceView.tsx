import { useState, useEffect, FormEvent } from 'react';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, 
  QrCode, AlertCircle, FileText, Download, Filter, Search,
  CheckCircle2, Clock, Plus, X, ArrowUpCircle, ArrowDownCircle,
  Edit2, Trash2
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { TransactionData } from '../../types';
import { cn } from '../../utils';
import { KPICard } from '../KPICard';

export function FinanceView() {
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      
      
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-black font-semibold rounded-xl transition-all"
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
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] flex flex-col flex-1 overflow-hidden">
        <div className="p-6 border-b border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative group w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar cliente ou transação..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-accent/50 outline-none rounded-full py-2.5 pl-11 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 transition-all"
              />
            </div>
            
            <div className="relative hidden sm:block">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="appearance-none bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-full py-2.5 pl-4 pr-10 outline-none focus:border-accent/50 transition-all"
              >
                <option value="all">Todas as Cobranças</option>
                <option value="paid">Pagas</option>
                <option value="pending">Aguardando</option>
                <option value="overdue">Atrasadas</option>
              </select>
              <Filter className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Tipo da Transação</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as 'entrada'|'saida'})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                  >
                    <option value="entrada">Entrada (Receita)</option>
                    <option value="saida">Saída (Despesa)</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Valor (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                  >
                    <option value="paid">Pago</option>
                    <option value="pending">Aguardando</option>
                    <option value="overdue">Atrasado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Método</label>
                  <select 
                    value={formData.method}
                    onChange={e => setFormData({...formData, method: e.target.value as any})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                  >
                    <option value="manual">Dinheiro / Outros</option>
                    <option value="pix">PIX</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Gateway</label>
                  <select 
                    value={formData.gateway}
                    onChange={e => setFormData({...formData, gateway: e.target.value as any})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                  >
                    <option value="manual">Manual/Local</option>
                    <option value="asaas">ASAAS</option>
                  </select>
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

