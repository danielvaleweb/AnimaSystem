import { useState } from 'react';
import { 
  X, Paperclip, Send, Clock, User, MessageSquare, 
  CheckCircle2, AlertCircle, CircleDashed, History, FileDown,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { TicketData, TicketStatus } from './TicketsView';

interface TicketDetailProps {
  ticket: TicketData;
  onClose: () => void;
}

export function TicketDetail({ ticket, onClose }: TicketDetailProps) {
  const [reply, setReply] = useState('');
  const [replyType, setReplyType] = useState<'public' | 'internal'>('public');
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false);

  const getStatusDisplay = (status: TicketStatus) => {
    switch (status) {
      case 'open': return { label: 'Aberto', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: AlertCircle };
      case 'analysis': return { label: 'Em Análise', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: CircleDashed };
      case 'development': return { label: 'Em Desenvolvimento', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Clock };
      case 'resolved': return { label: 'Resolvido', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 };
    }
  };

  const statusInfo = getStatusDisplay(ticket.status);
  const StatusIcon = statusInfo.icon;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-zinc-500">{ticket.id}</span>
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", statusInfo.color)}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusInfo.label}
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-zinc-100">{ticket.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto flex flex-col">
          {/* Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 border-b border-zinc-800/50 text-sm">
            <div>
              <span className="block text-zinc-500 mb-1 text-xs">Cliente</span>
              <span className="font-medium text-zinc-200">{ticket.client}</span>
            </div>
            <div>
              <span className="block text-zinc-500 mb-1 text-xs">Abertura</span>
              <span className="text-zinc-300">{ticket.createdAt}</span>
            </div>
            <div>
              <span className="block text-zinc-500 mb-1 text-xs">Responsável</span>
              <span className="text-zinc-300 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                {ticket.assignee || 'Não atribuído'}
              </span>
            </div>
            <div>
               <span className="block text-zinc-500 mb-1 text-xs">Prioridade</span>
               <span className={cn(
                 "font-medium", 
                 ticket.priority === 'critical' ? 'text-rose-400' :
                 ticket.priority === 'high' ? 'text-orange-400' :
                 ticket.priority === 'medium' ? 'text-blue-400' : 'text-zinc-400'
               )}>
                 {ticket.priority.toUpperCase()}
               </span>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-8">
            {/* Original Message */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none p-5 text-sm text-zinc-300 leading-relaxed">
                  <div className="flex justify-between items-center mb-3 text-xs">
                    <span className="font-medium text-zinc-200">Contato do Cliente</span>
                    <span className="text-zinc-500">{ticket.createdAt}</span>
                  </div>
                  <p>{ticket.description}</p>
                  
                  {/* Attachments */}
                  <div className="mt-4 pt-4 border-t border-zinc-800/50 flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-accent hover:border-accent/30 cursor-pointer transition-colors">
                      <FileDown className="w-3.5 h-3.5" />
                      print_erro.png
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Notification line */}
            <div className="flex items-center gap-4 text-xs text-zinc-500 justify-center">
              <span className="h-px bg-zinc-800/50 flex-1"></span>
              <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Status alterado para <b>Em Análise</b> por {ticket.assignee}</span>
              <span className="h-px bg-zinc-800/50 flex-1"></span>
            </div>

            {/* Support Reply */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                <span className="text-xl font-display font-medium text-accent">A</span>
              </div>
              <div className="flex-1">
                <div className="bg-accent/5 border border-accent/10 rounded-2xl rounded-tl-none p-5 text-sm text-zinc-300 leading-relaxed">
                  <div className="flex justify-between items-center mb-3 text-xs">
                    <span className="font-medium text-zinc-200">{ticket.assignee} (Suporte)</span>
                    <span className="text-zinc-500">Ontem, 14:30</span>
                  </div>
                  <p>Olá! Verificamos o problema e confirmamos que ocorreu uma falha de sincronização na região us-central1 após a última atualização. Nossa equipe de engenharia já está trabalhando na correção.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reply Box */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-950">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-accent/50 transition-colors">
             <textarea 
               value={reply}
               onChange={(e) => setReply(e.target.value)}
               placeholder="Digite sua resposta ou nota interna..." 
               className="w-full bg-transparent p-4 outline-none text-sm text-zinc-200 resize-none h-24 placeholder:text-zinc-500"
             ></textarea>
             <div className="bg-zinc-950/50 p-2 border-t border-zinc-800/50 flex items-center justify-between">
               <div className="flex gap-1 items-center">
                 <button className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors group relative">
                   <Paperclip className="w-4 h-4" />
                 </button>
                 
                  {/* Custom Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTypeSelectOpen(!isTypeSelectOpen)}
                      className="flex items-center gap-1 bg-transparent text-xs text-zinc-500 outline-none hover:text-zinc-300 cursor-pointer px-2 py-1 select-none font-medium"
                    >
                      <span>{replyType === 'public' ? 'Resposta Pública' : 'Nota Interna'}</span>
                      <ChevronDown className={cn("w-3 h-3 text-zinc-500 transition-transform duration-200", isTypeSelectOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {isTypeSelectOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsTypeSelectOpen(false)}></div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="absolute bottom-full left-2 mb-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-40 py-1 overflow-hidden min-w-[150px]"
                            style={{ transformOrigin: 'bottom' }}
                          >
                            {[
                              { val: 'public', label: 'Resposta Pública' },
                              { val: 'internal', label: 'Nota Interna' }
                            ].map(item => (
                              <button
                                key={item.val}
                                type="button"
                                onClick={() => {
                                  setReplyType(item.val as any);
                                  setIsTypeSelectOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer",
                                  replyType === item.val
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
               <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-zinc-950 font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50" disabled={!reply.trim()}>
                 <Send className="w-4 h-4" />
                 Enviar
               </button>
             </div>
          </div>
        </div>

      </div>
    </>
  );
}
