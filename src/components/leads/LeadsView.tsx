import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Search, Plus, Trash2, Mail, Phone, Calendar, Clock, ChevronRight, MoreVertical, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';

export interface LeadData {
  id?: string;
  ownerId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost' | 'converted';
  createdAt: string;
  message?: string;
}

const STAGES = [
  { id: 'new', label: 'Nova Solicitação', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/10', dotColor: 'bg-blue-400' },
  { id: 'contacted', label: 'Em Contato', borderColor: 'border-yellow-500/30', bgColor: 'bg-yellow-500/10', dotColor: 'bg-yellow-400' },
  { id: 'qualified', label: 'Qualificado', borderColor: 'border-purple-500/30', bgColor: 'bg-purple-500/10', dotColor: 'bg-purple-400' },
  { id: 'converted', label: 'Negócio Fechado', borderColor: 'border-green-500/30', bgColor: 'bg-green-500/10', dotColor: 'bg-green-400' },
  { id: 'lost', label: 'Perdido', borderColor: 'border-red-500/30', bgColor: 'bg-red-500/10', dotColor: 'bg-red-400' }
] as const;

export function LeadsView() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeDropdownLeadId, setActiveDropdownLeadId] = useState<string | null>(null);

  useEffect(() => {
    // se não há user, maybe we don't return early if it's a test? well no, let's just use a dummy uid for local tests or the actual auth
    const uid = auth.currentUser?.uid || 'anonymous';
    const qParams = query(collection(db, 'leads'), where('ownerId', '==', uid));
    const unsub = onSnapshot(qParams, (snap) => {
      const docs: LeadData[] = [];
      snap.forEach(d => {
        docs.push({ id: d.id, ...d.data() } as LeadData);
      });
      // Sort by newest
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLeads(docs);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: LeadData['status']) => {
    try {
      await updateDoc(doc(db, 'leads', id), { status: newStatus });
    } catch (e) {
      console.error("Error updating lead:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este lead?")) return;
    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (e) {
      console.error("Error deleting lead:", e);
    }
  };

  const filtered = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-8 text-zinc-500">Carregando leads...</div>;
  }

  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-display font-medium text-white mb-1">CRM / Leads</h2>
          <p className="text-zinc-400 text-sm">Gerencie solicitações de contatos no pipeline visual.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por nome, email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STAGES.map(stage => {
            const stageLeads = filtered.filter(l => l.status === stage.id);
            
            return (
              <div 
                key={stage.id} 
                className="flex flex-col bg-zinc-900/20 backdrop-blur-sm rounded-2xl border border-zinc-800/60 overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const cardId = e.dataTransfer.getData('cardId');
                  if (cardId) handleUpdateStatus(cardId, stage.id);
                }}
              >
                {/* Stage Header */}
                <div className={cn("p-4 border-b shrink-0 flex items-center justify-between bg-zinc-950/40", stage.borderColor)}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]", stage.dotColor, stage.dotColor.replace('bg-', 'text-'))}></div>
                    <span className="text-sm font-semibold text-zinc-200">{stage.label}</span>
                  </div>
                  <span className="text-xs font-medium text-zinc-400 bg-zinc-900 px-2 py-1 rounded-full border border-zinc-800">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3">
                  {stageLeads.length === 0 ? (
                    <div className="text-xs text-zinc-600 text-center py-8 font-medium">Arraste leads para cá</div>
                  ) : (
                    stageLeads.map(lead => (
                      <div 
                        key={lead.id} 
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('cardId', lead.id!);
                        }}
                        className="bg-zinc-900/60 backdrop-blur-md border border-zinc-700/50 rounded-xl p-4 hover:border-accent hover:shadow-[0_0_15px_rgba(151,251,46,0.15)] transition-all shadow-sm group cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-sm font-medium text-white group-hover:text-accent transition-colors">{lead.name}</h4>
                          <div className="relative">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownLeadId(activeDropdownLeadId === lead.id ? null : lead.id!);
                              }}
                              className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Mover de etapa"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            <AnimatePresence>
                              {activeDropdownLeadId === lead.id && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveDropdownLeadId(null); }}></div>
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="absolute right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-40 py-1 overflow-hidden min-w-[180px]"
                                    style={{ transformOrigin: 'top right' }}
                                  >
                                    {STAGES.map(stage => (
                                      <button
                                        key={stage.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateStatus(lead.id!, stage.id);
                                          setActiveDropdownLeadId(null);
                                        }}
                                        className={cn(
                                          "w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer",
                                          lead.status === stage.id
                                            ? "text-accent font-semibold hover:bg-zinc-900/40"
                                            : "text-zinc-300 hover:bg-zinc-900"
                                        )}
                                      >
                                        <span>{stage.label}</span>
                                      </button>
                                    ))}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span className="truncate">{lead.phone}</span>
                            </div>
                          )}
                          {lead.message && (
                            <div className="mt-3 text-xs text-zinc-500 bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/80 line-clamp-3">
                              {lead.message}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                            <Clock className="w-3 h-3" />
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </div>
                          <button 
                            onClick={() => handleDelete(lead.id!)}
                            className="text-zinc-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Excluir Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
