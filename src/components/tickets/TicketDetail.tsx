import { useState } from 'react';
import { 
  X, Paperclip, Send, Clock, User, MessageSquare, 
  CheckCircle2, AlertCircle, CircleDashed, History, FileDown,
  ChevronDown, Check, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { TicketData, TicketStatus } from './TicketsView';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

interface TicketDetailProps {
  ticket: TicketData;
  onClose: () => void;
  onTicketUpdated?: (updated: TicketData) => void;
}

export function TicketDetail({ ticket, onClose, onTicketUpdated }: TicketDetailProps) {
  const [currentTicket, setCurrentTicket] = useState<TicketData>(ticket);
  const [reply, setReply] = useState('');
  const [replyType, setReplyType] = useState<'public' | 'internal'>('public');
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const getStatusDisplay = (status: TicketStatus) => {
    switch (status) {
      case 'open': return { label: 'Aberto', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: AlertCircle };
      case 'analysis': return { label: 'Em Análise', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: CircleDashed };
      case 'development': return { label: 'Em Desenvolvimento', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Clock };
      case 'resolved': return { label: 'Resolvido', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2 };
      default: return { label: 'Aberto', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: AlertCircle };
    }
  };

  const statusInfo = getStatusDisplay(currentTicket.status);
  const StatusIcon = statusInfo.icon;

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    setIsUpdatingStatus(true);
    setIsStatusMenuOpen(false);
    try {
      const nowIso = new Date().toISOString();
      const statusLabels: Record<TicketStatus, string> = {
        open: 'Aberto',
        analysis: 'Em Análise',
        development: 'Em Desenvolvimento',
        resolved: 'Resolvido'
      };

      const updated = {
        ...currentTicket,
        status: newStatus,
        statusLabel: statusLabels[newStatus],
        updatedAt: nowIso
      };

      setCurrentTicket(updated);
      onTicketUpdated?.(updated);

      // If document exists in Firestore (not a pure hardcoded mock)
      if (ticket.id && !ticket.id.startsWith('mock_')) {
        const ticketRef = doc(db, 'tickets', ticket.id);
        await updateDoc(ticketRef, {
          status: newStatus,
          statusLabel: statusLabels[newStatus],
          updatedAt: nowIso
        });
      }
    } catch (err) {
      console.warn("Could not persist ticket status to firestore:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    setIsSendingReply(true);

    try {
      const currentUser = auth.currentUser;
      const authorName = currentUser?.displayName || 'Suporte Técnico AnimaSystem';
      const nowIso = new Date().toISOString();

      const newReplyObj = {
        id: `rep_${Date.now()}`,
        author: authorName,
        text: reply.trim(),
        type: replyType,
        createdAt: nowIso
      };

      const existingReplies = currentTicket.replies || [];
      const updatedReplies = [...existingReplies, newReplyObj];

      const updated = {
        ...currentTicket,
        replies: updatedReplies,
        updatedAt: nowIso
      };

      setCurrentTicket(updated);
      onTicketUpdated?.(updated);
      setReply('');

      if (ticket.id && !ticket.id.startsWith('mock_')) {
        const ticketRef = doc(db, 'tickets', ticket.id);
        await updateDoc(ticketRef, {
          replies: arrayUnion(newReplyObj),
          updatedAt: nowIso
        });
      }
    } catch (err) {
      console.warn("Failed to send reply to ticket:", err);
    } finally {
      setIsSendingReply(false);
    }
  };

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

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={onClose}></div>
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-white border-l border-zinc-200 flex flex-col shadow-2xl animate-in slide-in-from-right font-sans">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono font-bold text-zinc-500 bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                {currentTicket.protocol || currentTicket.id}
              </span>

              {/* Interactive Status Changer */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:opacity-90",
                    statusInfo.color
                  )}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{statusInfo.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                </button>

                <AnimatePresence>
                  {isStatusMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsStatusMenuOpen(false)}></div>
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 mt-1 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 py-1.5 min-w-[170px] overflow-hidden"
                      >
                        <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                          Alterar Status
                        </div>
                        {[
                          { val: 'open', label: 'Aberto', col: 'text-rose-600' },
                          { val: 'analysis', label: 'Em Análise', col: 'text-orange-600' },
                          { val: 'development', label: 'Em Desenvolvimento', col: 'text-blue-600' },
                          { val: 'resolved', label: 'Resolvido', col: 'text-emerald-600' }
                        ].map(st => (
                          <button
                            key={st.val}
                            type="button"
                            onClick={() => handleUpdateStatus(st.val as TicketStatus)}
                            className={cn(
                              "w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-zinc-50 flex items-center justify-between cursor-pointer",
                              st.col
                            )}
                          >
                            <span>{st.label}</span>
                            {currentTicket.status === st.val && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <h2 className="text-lg font-bold text-zinc-900 leading-tight">{currentTicket.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto flex flex-col custom-scrollbar">
          {/* Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 border-b border-zinc-100 bg-white text-xs">
            <div>
              <span className="block text-zinc-400 mb-0.5 font-medium">Cliente</span>
              <span className="font-bold text-zinc-900 truncate block">{currentTicket.clientName || currentTicket.client}</span>
              {currentTicket.clientDomain && (
                <span className="text-[10px] text-zinc-500 truncate block">{currentTicket.clientDomain}</span>
              )}
            </div>
            <div>
              <span className="block text-zinc-400 mb-0.5 font-medium">Data de Abertura</span>
              <span className="text-zinc-700 font-semibold">
                {formatDateTime(currentTicket.createdAt)}
              </span>
            </div>
            <div>
              <span className="block text-zinc-400 mb-0.5 font-medium">Solicitante</span>
              <span className="text-zinc-700 font-semibold flex items-center gap-1">
                <User className="w-3 h-3 text-zinc-400" />
                {currentTicket.requesterName || currentTicket.assignee || 'Cliente'}
              </span>
              {currentTicket.requesterContact && (
                <span className="text-[10px] text-zinc-500 block truncate">{currentTicket.requesterContact}</span>
              )}
            </div>
            <div>
               <span className="block text-zinc-400 mb-0.5 font-medium">Prioridade</span>
               <span className={cn(
                 "font-bold uppercase text-[11px] px-2 py-0.5 rounded-md inline-block", 
                 (currentTicket.priority === 'critical' || currentTicket.priority === 'urgente') ? 'text-rose-700 bg-rose-50' :
                 (currentTicket.priority === 'high' || currentTicket.priority === 'alta') ? 'text-orange-700 bg-orange-50' :
                 (currentTicket.priority === 'medium' || currentTicket.priority === 'normal') ? 'text-blue-700 bg-blue-50' : 'text-zinc-700 bg-zinc-100'
               )}>
                 {currentTicket.priority || 'Normal'}
               </span>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-6">
            {/* Original Message from Client */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="flex-1">
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl rounded-tl-none p-4 text-xs text-zinc-800 leading-relaxed shadow-2xs">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-200/60">
                    <span className="font-bold text-zinc-900">{currentTicket.requesterName || currentTicket.clientName || 'Solicitante'}</span>
                    <span className="text-[10px] text-zinc-400">
                      {formatTime(currentTicket.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-line">{currentTicket.description}</p>
                  
                  {currentTicket.pageUrl && (
                    <div className="mt-3 pt-3 border-t border-zinc-200/60 text-[11px] text-zinc-500">
                      <strong>URL / Página Relacionada:</strong>{' '}
                      <a href={currentTicket.pageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {currentTicket.pageUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Replies List */}
            {currentTicket.replies && currentTicket.replies.map((rep, idx) => (
              <div key={rep.id || idx} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-[#D7FE03] border border-[#c5eb02] flex items-center justify-center shrink-0 shadow-2xs">
                  <span className="text-xs font-bold text-black">AS</span>
                </div>
                <div className="flex-1">
                  <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-none p-4 text-xs text-zinc-800 leading-relaxed shadow-2xs">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">{rep.author}</span>
                        {rep.type === 'internal' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">Nota Interna</span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {formatTime(rep.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-line">{rep.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reply Box */}
        <div className="p-4 sm:p-6 border-t border-zinc-200 bg-white">
          <div className="border border-zinc-200 rounded-2xl overflow-hidden focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100 transition-all bg-white shadow-2xs">
             <textarea 
               value={reply}
               onChange={(e) => setReply(e.target.value)}
               placeholder="Digite uma resposta para o cliente ou uma nota interna..." 
               className="w-full bg-transparent p-3 sm:p-4 outline-none text-xs text-zinc-800 resize-none h-20 placeholder:text-zinc-400"
             ></textarea>
             <div className="bg-zinc-50 p-2 sm:p-3 border-t border-zinc-100 flex items-center justify-between">
               <div className="flex gap-2 items-center">
                  {/* Custom Dropdown: Public vs Internal */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTypeSelectOpen(!isTypeSelectOpen)}
                      className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-700 outline-none hover:bg-zinc-100 cursor-pointer px-2.5 py-1.5 select-none font-semibold"
                    >
                      <span>{replyType === 'public' ? 'Resposta ao Cliente' : 'Nota Interna'}</span>
                      <ChevronDown className={cn("w-3 h-3 text-zinc-400 transition-transform duration-200", isTypeSelectOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {isTypeSelectOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsTypeSelectOpen(false)}></div>
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute bottom-full left-0 mb-1.5 bg-white border border-zinc-200 rounded-xl shadow-xl z-40 py-1 overflow-hidden min-w-[160px]"
                          >
                            {[
                              { val: 'public', label: 'Resposta ao Cliente' },
                              { val: 'internal', label: 'Nota Interna (Equipe)' }
                            ].map(item => (
                              <button
                                key={item.val}
                                type="button"
                                onClick={() => {
                                  setReplyType(item.val as any);
                                  setIsTypeSelectOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer font-medium",
                                  replyType === item.val
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
                 onClick={handleSendReply}
                 disabled={!reply.trim() || isSendingReply}
                 className="flex items-center gap-1.5 bg-black hover:bg-zinc-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-40 cursor-pointer shadow-xs"
               >
                 <Send className="w-3.5 h-3.5" />
                 <span>{isSendingReply ? 'Enviando...' : 'Enviar'}</span>
               </button>
             </div>
          </div>
        </div>

      </div>
    </>
  );
}
