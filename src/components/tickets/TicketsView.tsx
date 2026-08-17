import { useState } from 'react';
import { 
  Search, Filter, Plus, MessageSquare, Clock, 
  AlertCircle, CheckCircle2, ChevronRight, CircleDashed, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { TicketDetail } from './TicketDetail';

export type TicketStatus = 'open' | 'analysis' | 'development' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TicketData {
  id: string;
  title: string;
  client: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  assignee?: string;
  description: string;
}

const mockTickets: TicketData[] = [
  {
    id: 'TKT-2041',
    title: 'Erro na importação de dados PDF',
    client: 'TechFlow Solutions',
    status: 'open',
    priority: 'high',
    createdAt: 'Hoje, 09:14',
    updatedAt: 'Hoje, 09:14',
    description: 'Quando tento fazer o upload do relatório mensal via PDF, o sistema retorna erro 500 no console e não salva.'
  },
  {
    id: 'TKT-2040',
    title: 'Latência na consulta de usuários',
    client: 'DataNexus Analytics',
    status: 'analysis',
    priority: 'medium',
    createdAt: 'Ontem, 15:30',
    updatedAt: 'Hoje, 10:20',
    assignee: 'Carlos Dev',
    description: 'A lista de usuários está demorando mais de 5 segundos para carregar na página principal do dashboard.'
  },
  {
    id: 'TKT-2039',
    title: 'Falha de login com Google',
    client: 'Saúde & Vida Clinica',
    status: 'development',
    priority: 'critical',
    createdAt: 'Ontem, 08:00',
    updatedAt: 'Ontem, 16:45',
    assignee: 'Ana Engenharia',
    description: 'Nenhum usuário da clínica consegue acessar utilizando o botão do Google. Firebase auth lança erro invalid-credential.'
  },
  {
    id: 'TKT-2035',
    title: 'Solicitação de aumento de cota Storage',
    client: 'LojaVip E-commerce',
    status: 'resolved',
    priority: 'low',
    createdAt: '01/06/2026',
    updatedAt: '02/06/2026',
    assignee: 'Suporte N1',
    description: 'Gostaríamos de dobrar nossa capacidade de armazenamento pois faremos uma limpa no banco de imagens.'
  }
];

export function TicketsView() {
  const [tickets, setTickets] = useState<TicketData[]>(mockTickets);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.client.toLowerCase().includes(search.toLowerCase()) ||
                          t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 border border-rose-500 text-xs font-semibold text-white"><AlertCircle className="w-3 h-3" /> Aberto</span>;
      case 'analysis': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-medium text-orange-400"><CircleDashed className="w-3 h-3" /> Em Análise</span>;
      case 'development': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500 border border-blue-500 text-xs font-semibold text-white"><Clock className="w-3 h-3" /> Em Desenvol.</span>;
      case 'resolved': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Resolvido</span>;
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    if (priority === 'critical') return 'bg-rose-500';
    if (priority === 'high') return 'bg-orange-500';
    if (priority === 'medium') return 'bg-blue-500';
    return 'bg-zinc-500';
  };

  return (
    <div className="flex flex-col h-full space-y-14">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
           <p className="text-zinc-500 text-sm font-medium mb-1">Abertos</p>
           <h3 className="font-display font-bold text-3xl text-zinc-100">12</h3>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
           <p className="text-zinc-500 text-sm font-medium mb-1">Em Análise</p>
           <h3 className="font-display font-bold text-3xl text-zinc-100">5</h3>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
           <p className="text-zinc-500 text-sm font-medium mb-1">Em Desenvolvimento</p>
           <h3 className="font-display font-bold text-3xl text-zinc-100">3</h3>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
           <p className="text-zinc-500 text-sm font-medium mb-1">Tempo Médio Resposta</p>
           <h3 className="font-display font-bold text-3xl text-emerald-400">1.2h</h3>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 bg-white border border-zinc-200/80 rounded-[2rem] flex flex-col relative">
        
        <div className="p-6 border-b border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative group w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar ticket..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-zinc-200 focus:border-accent/50 outline-none rounded-full py-2.5 pl-11 pr-4 text-sm text-zinc-800 placeholder:text-zinc-500 transition-all"
              />
            </div>
            
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center justify-between gap-2.5 bg-white border border-zinc-200 text-sm text-zinc-700 rounded-full py-2.5 pl-5 pr-8 outline-none focus:border-accent/50 transition-all select-none cursor-pointer min-w-[160px]"
              >
                <span>
                  {filterStatus === 'all' ? 'Todos os Status' :
                   filterStatus === 'open' ? 'Abertos' :
                   filterStatus === 'analysis' ? 'Em Análise' :
                   filterStatus === 'development' ? 'Em Desenvolvimento' : 'Resolvidos'}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 absolute right-3.5 top-1/2 -translate-y-1/2", isStatusDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsStatusDropdownOpen(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="absolute left-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-40 py-1 overflow-hidden min-w-[180px] p-anchored-overlay-enter-active"
                      style={{ transformOrigin: 'top' }}
                    >
                      {[
                        { val: 'all', label: 'Todos os Status' },
                        { val: 'open', label: 'Abertos' },
                        { val: 'analysis', label: 'Em Análise' },
                        { val: 'development', label: 'Em Desenvolvimento' },
                        { val: 'resolved', label: 'Resolvidos' }
                      ].map(item => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => {
                            setFilterStatus(item.val);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                            filterStatus === item.val
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

          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-zinc-950 font-semibold py-2.5 px-6 rounded-full transition-colors text-sm">
            <Plus className="w-4 h-4" />
            Novo Ticket
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 text-sm text-zinc-500 bg-white/20">
                <th className="font-medium p-4 pl-6 w-8 text-center border-r border-transparent">P</th >
                <th className="font-medium p-4">Ticket / Assunto</th>
                <th className="font-medium p-4">Cliente</th>
                <th className="font-medium p-4">Responsável</th>
                <th className="font-medium p-4">Última Atualização</th>
                <th className="font-medium p-4 text-right pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredTickets.map(ticket => (
                <tr 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className="hover:bg-zinc-100/20 transition-colors group cursor-pointer"
                >
                  <td className="p-4 pl-6">
                     <div className="w-full h-full flex items-center justify-center">
                        <div className={cn("w-2 h-2 rounded-full", getPriorityColor(ticket.priority))} title={`Prioridade: ${ticket.priority}`}></div>
                     </div>
                  </td>
                  <td className="p-4 py-5">
                    <p className="font-medium text-zinc-800 group-hover:text-accent transition-colors">{ticket.title}</p>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">{ticket.id}</p>
                  </td>
                  <td className="p-4 text-sm text-zinc-700">{ticket.client}</td>
                  <td className="p-4 text-sm text-zinc-500">{ticket.assignee || '-'}</td>
                  <td className="p-4 text-sm text-zinc-500 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    {ticket.updatedAt}
                  </td>
                  <td className="p-4 text-right pr-6">
                    {getStatusBadge(ticket.status)}
                  </td>
                </tr>
              ))}

              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    Nenhum ticket encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {selectedTicket && (
        <TicketDetail ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}
