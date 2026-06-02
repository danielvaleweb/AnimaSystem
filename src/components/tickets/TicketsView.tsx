import { useState } from 'react';
import { 
  Search, Filter, Plus, MessageSquare, Clock, 
  AlertCircle, CheckCircle2, ChevronRight, CircleDashed
} from 'lucide-react';
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
      case 'open': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-400"><AlertCircle className="w-3 h-3" /> Aberto</span>;
      case 'analysis': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-medium text-orange-400"><CircleDashed className="w-3 h-3" /> Em Análise</span>;
      case 'development': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400"><Clock className="w-3 h-3" /> Em Desenvol.</span>;
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
    <div className="flex flex-col h-full space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5">
           <p className="text-zinc-500 text-sm font-medium mb-1">Abertos</p>
           <h3 className="font-display font-bold text-3xl text-zinc-100">12</h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5">
           <p className="text-zinc-500 text-sm font-medium mb-1">Em Análise</p>
           <h3 className="font-display font-bold text-3xl text-zinc-100">5</h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5">
           <p className="text-zinc-500 text-sm font-medium mb-1">Em Desenvolvimento</p>
           <h3 className="font-display font-bold text-3xl text-zinc-100">3</h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5">
           <p className="text-zinc-500 text-sm font-medium mb-1">Tempo Médio Resposta</p>
           <h3 className="font-display font-bold text-3xl text-emerald-400">1.2h</h3>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800/50 rounded-[2rem] flex flex-col overflow-hidden">
        
        <div className="p-6 border-b border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative group w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar ticket..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-accent/50 outline-none rounded-full py-2.5 pl-11 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 transition-all"
              />
            </div>
            
            <div className="relative hidden sm:block">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-full py-2.5 pl-4 pr-10 outline-none focus:border-accent/50 transition-all"
              >
                <option value="all">Todos os Status</option>
                <option value="open">Abertos</option>
                <option value="analysis">Em Análise</option>
                <option value="development">Em Desenvolvimento</option>
                <option value="resolved">Resolvidos</option>
              </select>
              <Filter className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              <tr className="border-b border-zinc-800/50 text-sm text-zinc-500 bg-zinc-950/20">
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
                  className="hover:bg-zinc-800/20 transition-colors group cursor-pointer"
                >
                  <td className="p-4 pl-6">
                     <div className="w-full h-full flex items-center justify-center">
                        <div className={cn("w-2 h-2 rounded-full", getPriorityColor(ticket.priority))} title={`Prioridade: ${ticket.priority}`}></div>
                     </div>
                  </td>
                  <td className="p-4 py-5">
                    <p className="font-medium text-zinc-200 group-hover:text-accent transition-colors">{ticket.title}</p>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">{ticket.id}</p>
                  </td>
                  <td className="p-4 text-sm text-zinc-300">{ticket.client}</td>
                  <td className="p-4 text-sm text-zinc-400">{ticket.assignee || '-'}</td>
                  <td className="p-4 text-sm text-zinc-400 flex items-center gap-2">
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
