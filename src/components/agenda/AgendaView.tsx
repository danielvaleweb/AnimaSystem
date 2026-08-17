import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ClientData } from '../../types';

interface AgendaEvent {
  id: string;
  title: string;
  type: 'meeting' | 'task' | 'billing' | 'payment' | 'reminder';
  date: string;
  time: string;
  description: string;
  completed: boolean;
  isVirtual?: boolean;
}

const typeColors = {
  meeting: 'bg-blue-50 text-blue-700 border-blue-200',
  task: 'bg-purple-50 text-purple-700 border-purple-200',
  billing: 'bg-[#D7FE03]/20 text-emerald-800 border-[#D7FE03]/40',
  payment: 'bg-red-50 text-red-700 border-red-200',
  reminder: 'bg-zinc-100 text-zinc-700 border-zinc-200'
};

const typeLabels = {
  meeting: 'Reunião',
  task: 'Tarefa',
  billing: 'Cobrança',
  payment: 'Pagamento',
  reminder: 'Lembrete'
};

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function AgendaView({ onNavigate }: { onNavigate?: (view: any, id?: string) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'reminder' as AgendaEvent['type'],
    date: '',
    time: '12:00',
    description: ''
  });

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(d => ({id: d.id, ...d.data()} as ClientData)));
    });
    const u2 = onSnapshot(collection(db, 'agenda'), (snap) => {
      setEvents(snap.docs.map(d => ({id: d.id, ...d.data()} as AgendaEvent)));
    });
    return () => { u1(); u2(); };
  }, []);

  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const generateVirtualEvents = (baseDate: Date) => {
     const y = baseDate.getFullYear();
     const m = baseDate.getMonth() + 1;
     return clients.map(c => ({
       id: `virtual-${c.id}-${y}-${m}`,
       title: `Cobrança: ${c.name}`,
       type: 'billing',
       date: `${y}-${String(m).padStart(2, '0')}-${String(c.dueDate||1).padStart(2, '0')}`,
       time: '08:00',
       description: `Mensalidade plano ${c.plan}: R$ ${c.monthlyValue}`,
       completed: false,
       isVirtual: true
     })) as AgendaEvent[];
  }

  const allEvents = [...events, ...generateVirtualEvents(currentDate)];
  if (selectedDate.getMonth() !== currentDate.getMonth()) {
     allEvents.push(...generateVirtualEvents(selectedDate));
  }
  const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDayClick = (d: number) => {
    setSelectedDate(new Date(year, month, d));
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDate = (dateStr: string) => uniqueEvents.filter(e => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));

  const handleSaveEvent = async (e: React.FormEvent) => {
     e.preventDefault();
     try {
       await addDoc(collection(db, 'agenda'), {
          ...formData,
          completed: false,
          createdAt: new Date().getTime()
       });
       setIsModalOpen(false);
       setFormData({...formData, title: '', description: ''});
     } catch (error) {
       console.error("Error adding event: ", error);
     }
  };

  const toggleEvent = async (event: AgendaEvent) => {
     if (event.isVirtual) return;
     await updateDoc(doc(db, 'agenda', event.id), {
        completed: !event.completed
     });
  };

  const deleteEvent = async (id: string) => {
     await deleteDoc(doc(db, 'agenda', id));
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
              Agenda
            </h1>
          </div>
        </div>
      </div>

    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 animate-fade-in pb-16 w-full">
      <div className="flex-1 bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
           <h2 className="text-xl font-black text-black capitalize">
             {monthNames[month]} {year}
           </h2>
           <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 cursor-pointer transition-colors"><ChevronLeft className="w-4 h-4"/></button>
              <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="px-3 py-1.5 text-xs font-bold rounded-full border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors">Hoje</button>
              <button onClick={handleNextMonth} className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 cursor-pointer transition-colors"><ChevronRight className="w-4 h-4"/></button>
           </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
           {weekDays.map(wd => <div key={wd} className="text-center text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">{wd}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
           {blanks.map(b => <div key={`blank-${b}`} className="min-h-[70px] sm:min-h-[100px] rounded-2xl bg-zinc-50/50 border border-zinc-100/50" />)}
           {days.map(d => {
              const cellDateStr = formatDateStr(new Date(year, month, d));
              const dayEvents = getEventsForDate(cellDateStr);
              const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
              const isToday = formatDateStr(new Date()) === cellDateStr;
              
              return (
                 <div 
                   key={d} 
                   onClick={() => handleDayClick(d)}
                   className={`min-h-[70px] sm:min-h-[100px] rounded-2xl border p-1.5 sm:p-2 cursor-pointer transition-all ${
                     isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent' : 
                     isToday ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-200/60 hover:border-zinc-300'
                   }`}
                 >
                    <div className={`text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full mb-1 ${
                      isToday ? 'bg-black text-white' : 'text-zinc-700'
                    }`}>
                      {d}
                    </div>
                    <div className="flex flex-col gap-1">
                      {dayEvents.slice(0, 3).map(ev => (
                        <div key={ev.id} className={`text-[8px] sm:text-[9px] font-bold truncate px-1.5 py-0.5 rounded-md ${typeColors[ev.type]}`}>
                          <span className="hidden sm:inline">{ev.time} - </span>{ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[8px] sm:text-[9px] font-bold text-zinc-400 px-1">+{dayEvents.length - 3}</div>
                      )}
                    </div>
                 </div>
              )
           })}
        </div>
      </div>
      
      <div className="w-full lg:w-96 flex flex-col gap-4">
         <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm flex-1 flex flex-col lg:h-[calc(100vh-140px)] lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-black">
                  {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
                </h3>
                <p className="text-xs text-zinc-500 font-medium">{weekDays[selectedDate.getDay()]}</p>
              </div>
              <button 
                onClick={() => {
                  setFormData({...formData, date: formatDateStr(selectedDate)});
                  setIsModalOpen(true);
                }}
                className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3 min-h-[300px]">
               {getEventsForDate(formatDateStr(selectedDate)).length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                     <Calendar className="w-12 h-12 text-zinc-300 mb-3" />
                     <p className="text-sm font-bold text-zinc-500">Nenhum evento neste dia.</p>
                     <p className="text-xs text-zinc-400">Clique no + para adicionar.</p>
                  </div>
               ) : (
                  getEventsForDate(formatDateStr(selectedDate)).map(ev => (
                     <div key={ev.id} className={`p-3 rounded-2xl border ${ev.completed ? 'opacity-60 bg-zinc-50 border-zinc-100' : 'bg-white border-zinc-200'} flex flex-col gap-2 relative group transition-all`}>
                        <div className="flex items-start justify-between gap-2">
                           <div className="flex items-start gap-2">
                              {!ev.isVirtual && (
                                <button onClick={() => toggleEvent(ev)} className="mt-0.5 text-zinc-400 hover:text-black cursor-pointer transition-colors shrink-0">
                                   {ev.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
                                </button>
                              )}
                              {ev.isVirtual && (
                                <AlertCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              )}
                              <div className="flex flex-col">
                                <span className={`text-sm font-bold ${ev.completed ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>{ev.title}</span>
                                <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {ev.time}
                                </span>
                              </div>
                           </div>
                           {!ev.isVirtual && (
                             <button onClick={() => deleteEvent(ev.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0 cursor-pointer">
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                           <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${typeColors[ev.type]}`}>
                              {typeLabels[ev.type]}
                           </span>
                        </div>
                        {ev.description && (
                           <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                              {ev.description}
                           </p>
                        )}
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-100">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="font-black text-black">Novo Evento</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-black cursor-pointer transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Título do Evento</label>
                <input 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  type="text" 
                  placeholder="Ex: Reunião de Alinhamento" 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-black outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>
              
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Tipo</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map(type => (
                    <div 
                      key={type}
                      onClick={() => setFormData({...formData, type: type as AgendaEvent['type']})}
                      className={`px-3 py-2 border rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer text-center transition-all ${
                        formData.type === type ? typeColors[type as AgendaEvent['type']] + ' ring-1 ring-current scale-[1.02]' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                      }`}
                    >
                      {typeLabels[type as AgendaEvent['type']]}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Data</label>
                  <input 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    type="date" 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-black outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Horário</label>
                  <input 
                    required
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    type="time" 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-black outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Descrição (Opcional)</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Detalhes adicionais..." 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-black outline-none focus:border-black focus:bg-white transition-all resize-none"
                />
              </div>
              
              <div className="mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-xs font-bold text-zinc-500 hover:text-black cursor-pointer transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-xs font-bold bg-black text-white rounded-xl shadow-sm hover:bg-zinc-800 transition-colors cursor-pointer">
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

