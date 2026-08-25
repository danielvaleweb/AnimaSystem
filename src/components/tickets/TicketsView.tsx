import { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, MessageSquare, Clock, 
  AlertCircle, CheckCircle2, ChevronRight, CircleDashed, ChevronDown,
  X, LifeBuoy, User, Building, Globe, Check, AlertOctagon, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { TicketDetail } from './TicketDetail';
import { collection, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { ClientData } from '../../types';

export type TicketStatus = 'open' | 'analysis' | 'development' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical' | 'normal' | 'alta' | 'urgente';

export interface TicketReply {
  id?: string;
  author: string;
  text: string;
  type?: 'public' | 'internal';
  createdAt: string;
}

export interface TicketData {
  id: string;
  protocol?: string;
  title: string;
  client?: string;
  clientName?: string;
  clientId?: string;
  clientDomain?: string;
  clientPlan?: string;
  status: TicketStatus;
  statusLabel?: string;
  priority: TicketPriority;
  category?: string;
  categoryLabel?: string;
  requesterName?: string;
  requesterContact?: string;
  pageUrl?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: string;
  description: string;
  replies?: TicketReply[];
}

const mockTickets: TicketData[] = [
  {
    id: 'mock_1',
    protocol: 'TKT-2041',
    title: 'Erro na importação de dados PDF',
    client: 'TechFlow Solutions',
    clientName: 'TechFlow Solutions',
    status: 'open',
    priority: 'high',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    description: 'Quando tento fazer o upload do relatório mensal via PDF, o sistema retorna erro 500 no console e não salva.'
  },
  {
    id: 'mock_2',
    protocol: 'TKT-2040',
    title: 'Latência na consulta de usuários',
    client: 'DataNexus Analytics',
    clientName: 'DataNexus Analytics',
    status: 'analysis',
    priority: 'medium',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    assignee: 'Carlos Dev',
    description: 'A lista de usuários está demorando mais de 5 segundos para carregar na página principal do dashboard.'
  },
  {
    id: 'mock_3',
    protocol: 'TKT-2039',
    title: 'Falha de login com Google',
    client: 'Saúde & Vida Clinica',
    clientName: 'Saúde & Vida Clinica',
    status: 'development',
    priority: 'critical',
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    assignee: 'Ana Engenharia',
    description: 'Nenhum usuário da clínica consegue acessar utilizando o botão do Google. Firebase auth lança erro invalid-credential.'
  },
  {
    id: 'mock_4',
    protocol: 'TKT-2035',
    title: 'Solicitação de aumento de cota Storage',
    client: 'LojaVip E-commerce',
    clientName: 'LojaVip E-commerce',
    status: 'resolved',
    priority: 'low',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    assignee: 'Suporte N1',
    description: 'Gostaríamos de dobrar nossa capacidade de armazenamento pois faremos uma limpa no banco de imagens.'
  }
];

export function TicketsView() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  // New ticket form state
  const [newTitle, setNewTitle] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newCategory, setNewCategory] = useState('ajuste_conteudo');
  const [newPriority, setNewPriority] = useState<TicketPriority>('normal');
  const [newDescription, setNewDescription] = useState('');
  const [newRequesterName, setNewRequesterName] = useState('');
  const [newRequesterContact, setNewRequesterContact] = useState('');
  const [newPageUrl, setNewPageUrl] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Safe date formatter
  const formatDate = (dateVal?: any) => {
    if (!dateVal) return 'Recente';
    try {
      if (typeof dateVal === 'object' && dateVal.seconds) {
        return new Date(dateVal.seconds * 1000).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Recente';
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recente';
    }
  };

  // Real-time Firestore sync for real tickets
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'tickets'), (snapshot) => {
        const firestoreList: TicketData[] = [];
        snapshot.forEach((docSnap) => {
          firestoreList.push({
            id: docSnap.id,
            ...docSnap.data()
          } as TicketData);
        });

        // Sort by createdAt / updatedAt descending
        firestoreList.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });

        setTickets(firestoreList);
      }, (err) => {
        console.warn("Tickets subscription error:", err);
        setTickets([]);
      });

      return () => unsub();
    } catch (e) {
      setTickets([]);
    }
  }, []);

  // Fetch clients for the dropdown in "Novo Ticket"
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const snap = await getDocs(collection(db, 'clients'));
        const list: ClientData[] = [];
        snap.forEach(d => list.push({ ...d.data(), id: d.id } as ClientData));
        setClients(list);
        if (list.length > 0) {
          setNewClientId(list[0].id);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchClients();
  }, []);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) || 
      (t.clientName || t.client || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.protocol || t.id).toLowerCase().includes(search.toLowerCase()) ||
      (t.requesterName || '').toLowerCase().includes(search.toLowerCase());

    const isMatchOpen = filterStatus === 'open' && (t.status === 'open' || t.status === ('aberto' as any) || !t.status);
    const isMatchAnalysis = filterStatus === 'analysis' && t.status === 'analysis';
    const isMatchDevelopment = filterStatus === 'development' && t.status === 'development';
    const isMatchResolved = filterStatus === 'resolved' && t.status === 'resolved';

    const matchesStatus = filterStatus === 'all' || isMatchOpen || isMatchAnalysis || isMatchDevelopment || isMatchResolved;
    return matchesSearch && matchesStatus;
  });

  // Calculate real-time metric counts
  const countOpen = tickets.filter(t => t.status === 'open' || t.status === ('aberto' as any) || !t.status).length;
  const countAnalysis = tickets.filter(t => t.status === 'analysis').length;
  const countDevelopment = tickets.filter(t => t.status === 'development').length;
  const countResolved = tickets.filter(t => t.status === 'resolved').length;

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open': 
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700"><AlertCircle className="w-3 h-3" /> Aberto</span>;
      case 'analysis': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-orange-700"><CircleDashed className="w-3 h-3" /> Em Análise</span>;
      case 'development': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700"><Clock className="w-3 h-3" /> Em Desenvol.</span>;
      case 'resolved': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Resolvido</span>;
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    if (priority === 'critical' || priority === 'urgente') return 'bg-rose-500 ring-2 ring-rose-300';
    if (priority === 'high' || priority === 'alta') return 'bg-orange-500';
    if (priority === 'medium' || priority === 'normal') return 'bg-blue-500';
    return 'bg-zinc-400';
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setIsSubmittingNew(true);
    try {
      const selectedClient = clients.find(c => c.id === newClientId);
      const protocolNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      const nowIso = new Date().toISOString();

      const newTicketPayload = {
        protocol: protocolNumber,
        clientId: newClientId || 'interno',
        clientName: selectedClient?.name || selectedClient?.domain || 'Cliente Interno',
        clientDomain: selectedClient?.domain || '',
        clientPlan: selectedClient?.plan || 'Standard',
        category: newCategory,
        priority: newPriority,
        title: newTitle.trim(),
        description: newDescription.trim(),
        requesterName: newRequesterName.trim() || 'Admin Master',
        requesterContact: newRequesterContact.trim() || 'master@animasystem.com',
        pageUrl: newPageUrl.trim(),
        status: 'open',
        statusLabel: 'Aberto',
        createdAt: nowIso,
        updatedAt: nowIso,
        unread: true,
        source: 'painel_admin'
      };

      await addDoc(collection(db, 'tickets'), newTicketPayload);

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewRequesterName('');
      setNewRequesterContact('');
      setNewPageUrl('');
      setIsNewTicketModalOpen(false);
    } catch (err) {
      console.warn("Failed to create ticket:", err);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-8" style={{ fontFamily: 'Urbanist, sans-serif' }}>
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-5 shadow-2xs">
           <div className="flex items-center justify-between mb-1">
             <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Abertos</p>
             <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
           </div>
           <h3 className="font-sans font-black text-3xl text-zinc-900">{countOpen}</h3>
        </div>
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-5 shadow-2xs">
           <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Em Análise</p>
           <h3 className="font-sans font-black text-3xl text-zinc-900">{countAnalysis}</h3>
        </div>
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-5 shadow-2xs">
           <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Em Desenvolvimento</p>
           <h3 className="font-sans font-black text-3xl text-zinc-900">{countDevelopment}</h3>
        </div>
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-5 shadow-2xs">
           <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Resolvidos</p>
           <h3 className="font-sans font-black text-3xl text-emerald-600">{countResolved}</h3>
        </div>
      </div>

      {/* Main List Container */}
      <div className="flex-1 bg-white border border-zinc-200/90 rounded-3xl flex flex-col relative shadow-2xs overflow-hidden">
        
        <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <div className="relative group w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar por protocolo, assunto ou cliente..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-black outline-none rounded-2xl py-2.5 pl-11 pr-4 text-xs font-medium text-zinc-800 placeholder:text-zinc-400 transition-all"
              />
            </div>
            
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center justify-between gap-2.5 bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-700 rounded-2xl py-2.5 pl-4 pr-8 outline-none hover:bg-zinc-100 transition-all select-none cursor-pointer min-w-[160px]"
              >
                <span>
                  {filterStatus === 'all' ? 'Todos os Status' :
                   filterStatus === 'open' ? `Abertos (${countOpen})` :
                   filterStatus === 'analysis' ? `Em Análise (${countAnalysis})` :
                   filterStatus === 'development' ? `Em Desenvol. (${countDevelopment})` : `Resolvidos (${countResolved})`}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 shrink-0 absolute right-3 top-1/2 -translate-y-1/2", isStatusDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsStatusDropdownOpen(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl z-40 py-1 overflow-hidden min-w-[190px]"
                    >
                      {[
                        { val: 'all', label: 'Todos os Status' },
                        { val: 'open', label: `Abertos (${countOpen})` },
                        { val: 'analysis', label: `Em Análise (${countAnalysis})` },
                        { val: 'development', label: `Em Desenvolvimento (${countDevelopment})` },
                        { val: 'resolved', label: `Resolvidos (${countResolved})` }
                      ].map(item => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => {
                            setFilterStatus(item.val);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer",
                            filterStatus === item.val
                              ? "text-black font-bold bg-zinc-100"
                              : "text-zinc-600 hover:bg-zinc-50"
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

          <button 
            onClick={() => setIsNewTicketModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#D7FE03] hover:bg-[#c8ee02] text-black font-bold py-2.5 px-6 rounded-2xl transition-all text-xs cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Ticket / Chamado</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50/60">
                <th className="p-4 pl-6 w-8 text-center">P</th>
                <th className="p-4">Ticket / Assunto</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Solicitante</th>
                <th className="p-4">Última Atualização</th>
                <th className="p-4 text-right pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {filteredTickets.map(ticket => (
                <tr 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                >
                  <td className="p-4 pl-6">
                     <div className="w-full h-full flex items-center justify-center">
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", getPriorityColor(ticket.priority))} title={`Prioridade: ${ticket.priority}`}></div>
                     </div>
                  </td>
                  <td className="p-4 py-4">
                    <p className="font-bold text-zinc-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {ticket.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-zinc-400">
                      <span>{ticket.protocol || ticket.id}</span>
                      {ticket.categoryLabel && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-500 font-sans">{ticket.categoryLabel}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-zinc-800 font-medium">
                    <p className="font-bold">{ticket.clientName || ticket.client}</p>
                    {ticket.clientDomain && (
                      <p className="text-[10px] text-zinc-400">{ticket.clientDomain}</p>
                    )}
                  </td>
                  <td className="p-4 text-zinc-600">
                    <p className="font-semibold text-zinc-800">{ticket.requesterName || ticket.assignee || '-'}</p>
                    {ticket.requesterContact && (
                      <p className="text-[10px] text-zinc-400">{ticket.requesterContact}</p>
                    )}
                  </td>
                  <td className="p-4 text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{formatDate(ticket.createdAt || ticket.updatedAt)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right pr-6">
                    {getStatusBadge(ticket.status)}
                  </td>
                </tr>
              ))}

              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400">
                    <LifeBuoy className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-zinc-700">Nenhum chamado encontrado</p>
                    <p className="text-xs text-zinc-400 mt-1">Todos os tickets foram atendidos ou não correspondem ao filtro.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Ticket Details Panel */}
      {selectedTicket && (
        <TicketDetail 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          onTicketUpdated={(updated) => {
            setSelectedTicket(updated);
            setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
          }}
        />
      )}

      {/* Modal: Novo Ticket Manual */}
      <AnimatePresence>
        {isNewTicketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewTicketModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-10 border border-zinc-200"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Novo Chamado de Suporte</h3>
                  <p className="text-xs text-zinc-500">Cadastre uma solicitação interna ou para um cliente</p>
                </div>
                <button 
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Cliente Vinculado</label>
                  <select
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-semibold outline-none focus:border-black cursor-pointer"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.domain || 'Sem domínio'})
                      </option>
                    ))}
                    {clients.length === 0 && (
                      <option value="interno">Cliente Geral / Interno</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Categoria</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-semibold outline-none focus:border-black cursor-pointer"
                    >
                      <option value="ajuste_conteudo">Alteração de Conteúdo</option>
                      <option value="bug_erro">Relatar Bug / Erro</option>
                      <option value="novo_recurso">Novo Recurso</option>
                      <option value="faturamento_dominio">Faturamento / Domínio</option>
                      <option value="urgencia">Urgência / Fora do Ar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Prioridade</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-semibold outline-none focus:border-black cursor-pointer"
                    >
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Crítica / Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Título do Chamado *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Atualização do banner principal e ajuste no formulário"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-medium outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Descrição Detalhada *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Descreva o que precisa ser ajustado ou o erro relatado..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-medium outline-none focus:border-black resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Solicitante</label>
                    <input
                      type="text"
                      placeholder="Nome do solicitante"
                      value={newRequesterName}
                      onChange={(e) => setNewRequesterName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">WhatsApp / Contato</label>
                    <input
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={newRequesterContact}
                      onChange={(e) => setNewRequesterContact(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewTicketModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNew || !newTitle.trim() || !newDescription.trim()}
                    className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingNew ? 'Criando...' : 'Criar Chamado'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
