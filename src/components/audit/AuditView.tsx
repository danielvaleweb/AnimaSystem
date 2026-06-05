import { useState } from 'react';
import { 
  Search, Filter, Calendar, Download, ShieldCheck, 
  LogIn, Edit3, Upload, Trash2, AlertOctagon, Link2,
  ChevronRight, Database, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';

type EventType = 'login' | 'change' | 'upload' | 'delete' | 'error' | 'integration';

interface AuditLog {
  id: string;
  timestamp: string;
  type: EventType;
  user: string;
  client: string;
  ip: string;
  description: string;
  details?: string;
  status: 'success' | 'failure';
}

const mockLogs: AuditLog[] = [
  { id: 'LOG-10025', timestamp: '02/06/2026 14:30:12', type: 'login', user: 'admin@animahub.com', client: 'Sistema Global', ip: '192.168.1.1', description: 'Autenticação bem sucedida (MFA)', status: 'success' },
  { id: 'LOG-10024', timestamp: '02/06/2026 14:25:00', type: 'change', user: 'suporte@animahub.com', client: 'TechFlow Solutions', ip: '189.10.20.30', description: 'Alteração de plano', details: 'De: Pro -> Para: Enterprise', status: 'success' },
  { id: 'LOG-10023', timestamp: '02/06/2026 13:10:45', type: 'delete', user: 'carlos@datanexus.io', client: 'DataNexus Analytics', ip: '201.55.10.2', description: 'Batch delete concluído', details: '45 registros de usuários inativos removidos', status: 'success' },
  { id: 'LOG-10022', timestamp: '02/06/2026 12:05:00', type: 'integration', user: 'system_webhook', client: 'LojaVip E-commerce', ip: 'internal', description: 'Falha de webhook Asaas', details: 'HTTP 504 Gateway Timeout', status: 'failure' },
  { id: 'LOG-10021', timestamp: '02/06/2026 11:30:22', type: 'upload', user: 'marketing@saudevida.com', client: 'Saúde & Vida Clinica', ip: '177.20.10.5', description: 'Upload concluído', details: 'relatorio_maio_2026.pdf (4.2MB)', status: 'success' },
  { id: 'LOG-10020', timestamp: '02/06/2026 10:15:10', type: 'error', user: 'system_monitor', client: 'TechFlow Solutions', ip: 'internal', description: 'Quota Exceeded', details: 'Firestore Read Quota exceeded for techflow-prod-123', status: 'failure' },
];

export function AuditView() {
  const [filterType, setFilterType] = useState<string>('all');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  const getTypeInfo = (type: EventType) => {
    switch (type) {
      case 'login': return { icon: LogIn, color: 'text-emerald-400 bg-emerald-500/10' };
      case 'change': return { icon: Edit3, color: 'text-blue-400 bg-blue-500/10' };
      case 'upload': return { icon: Upload, color: 'text-purple-400 bg-purple-500/10' };
      case 'delete': return { icon: Trash2, color: 'text-rose-400 bg-rose-500/10' };
      case 'error': return { icon: AlertOctagon, color: 'text-red-500 bg-red-500/10' };
      case 'integration': return { icon: Link2, color: 'text-orange-400 bg-orange-500/10' };
    }
  };

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(search.toLowerCase()) || 
                          log.client.toLowerCase().includes(search.toLowerCase()) ||
                          log.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header Insight */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          <div>
             <h2 className="font-display text-2xl font-bold text-zinc-100">Auditoria Global</h2>
             <p className="text-zinc-400 text-sm mt-1">
               Os logs brutos são armazendados no <b>Google Cloud Logging (BigQuery)</b> para retenção infinita sob baixo custo.
             </p>
          </div>
        </div>

        <button className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-sm font-medium py-2.5 px-5 rounded-full transition-colors whitespace-nowrap">
          <Download className="w-4 h-4" />
          Exportar Logs (CSV)
        </button>
      </div>

      <div className="flex-1 bg-zinc-900 border border-zinc-800/50 rounded-[2rem] flex flex-col relative">
        
        {/* Filters */}
        <div className="p-6 border-b border-zinc-800/50 flex flex-wrap gap-4 items-center justify-between bg-zinc-950/20">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative group w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar usuário, cliente ou evento..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-accent/50 outline-none rounded-full py-2 pl-11 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 transition-all"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="flex items-center justify-between gap-2.5 bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-full py-2.5 pl-5 pr-8 outline-none focus:border-accent/50 transition-all select-none cursor-pointer min-w-[160px]"
              >
                <span>
                  {filterType === 'all' ? 'Tipos de Evento' :
                   filterType === 'login' ? 'Autenticação' :
                   filterType === 'change' ? 'Alterações' :
                   filterType === 'upload' ? 'Uploads' :
                   filterType === 'delete' ? 'Exclusões' :
                   filterType === 'error' ? 'Erros' : 'Integrações'}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 absolute right-3.5 top-1/2 -translate-y-1/2", isTypeDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isTypeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsTypeDropdownOpen(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="absolute left-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-40 py-1 overflow-hidden min-w-[180px] p-anchored-overlay-enter-active"
                      style={{ transformOrigin: 'top' }}
                    >
                      {[
                        { val: 'all', label: 'Tipos de Evento' },
                        { val: 'login', label: 'Autenticação' },
                        { val: 'change', label: 'Alterações' },
                        { val: 'upload', label: 'Uploads' },
                        { val: 'delete', label: 'Exclusões' },
                        { val: 'error', label: 'Erros' },
                        { val: 'integration', label: 'Integrações' }
                      ].map(item => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => {
                            setFilterType(item.val);
                            setIsTypeDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                            filterType === item.val
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

            <button className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-full py-2 px-4 hover:border-zinc-700 transition-all">
              <Calendar className="w-4 h-4 text-zinc-500" />
              Últimos 7 dias
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-950/20">
                <th className="font-medium p-4 pl-6">Data / Hora</th>
                <th className="font-medium p-4">Evento</th>
                <th className="font-medium p-4">Usuário</th>
                <th className="font-medium p-4">Cliente / Projeto</th>
                <th className="font-medium p-4">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredLogs.map(log => {
                const info = getTypeInfo(log.type);
                const TypeIcon = info.icon;
                
                return (
                  <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors group text-sm">
                    <td className="p-4 pl-6 whitespace-nowrap">
                      <div className="text-zinc-300">{log.timestamp.split(' ')[0]}</div>
                      <div className="text-xs font-mono text-zinc-500 mt-0.5">{log.timestamp.split(' ')[1]}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", info.color)}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="font-medium text-zinc-200">{log.description}</span>
                             {log.status === 'failure' && (
                               <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-red-500/20 text-red-400">Falha</span>
                             )}
                          </div>
                          {log.details && (
                            <p className="text-xs text-zinc-500 mt-1">{log.details}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-400">{log.user}</td>
                    <td className="p-4">
                      <span className="text-zinc-300 block">{log.client}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                        {log.ip}
                      </span>
                    </td>
                  </tr>
                );
              })}
              
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Nenhum registro encontrado com estes filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500">
           <span>Mostrando os últimos 100 registros em memória. Realize uma busca para carregar registros remotos (BigQuery).</span>
           <div className="flex items-center gap-1">
             <Database className="w-3 h-3" /> Conectado ao Log Stream
           </div>
        </div>

      </div>
    </div>
  );
}
