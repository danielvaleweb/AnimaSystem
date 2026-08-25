import { Search, Menu, Settings, ShieldAlert, Bell, Palette, LogOut, Key, SearchIcon, Zap, ShieldCheck, Activity, ChevronDown, CheckCircle2, Calendar, Clock, LifeBuoy, AlertCircle, ArrowRight } from 'lucide-react';
import { ViewType, ClientData } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';

interface HeaderProps {
  currentView: ViewType;
  onNavigate?: (view: ViewType, id?: string) => void;
  onToggleMobileSidebar?: () => void;
}

interface MenuItem {
  label: string;
  view?: ViewType;
  submenus?: { label: string; view: ViewType }[];
}

const topMenus: MenuItem[] = [
  { label: 'Dashboard', view: 'dashboard' },
  { label: 'Agenda', view: 'agenda' },
  { 
    label: 'Clientes', 
    view: 'clients',
    submenus: [
      { label: 'Leads', view: 'leads' },
      { label: 'Tickets', view: 'tickets' }
    ]
  },
  { 
    label: 'Financeiro', 
    view: 'finance',
    submenus: [
      { label: 'Investimentos', view: 'investments' }
    ]
  },
  { label: 'Operacional', view: 'monitor' },
];

export function Header({ currentView, onNavigate }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [readTicketIds, setReadTicketIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('animasystem_read_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const notificationsRef = useRef<HTMLDivElement>(null);
  const [dueClients, setDueClients] = useState<ClientData[]>([]);
  const [liveTickets, setLiveTickets] = useState<any[]>([]);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Keep track of the active hover state for dropdowns
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Real-time listener for tickets
  useEffect(() => {
    try {
      const q = collection(db, 'tickets');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tList: any[] = [];
        snapshot.forEach((docSnap) => {
          tList.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort by date descending
        tList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setLiveTickets(tList);
      }, (err) => {
        console.warn("Header tickets listener warning:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Tickets collection listener error:", e);
    }
  }, []);

  // Real-time listener for due clients
  useEffect(() => {
    try {
      const q = collection(db, 'clients');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cList: ClientData[] = [];
        const today = new Date();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ClientData;
          if (data.renewalDate) {
            const rDate = new Date(data.renewalDate);
            if (rDate.getDate() === today.getDate() && rDate.getMonth() === today.getMonth()) {
              cList.push({ ...data, id: docSnap.id });
            }
          }
        });
        setDueClients(cList);
      }, (err) => {
        console.warn("Header clients listener warning:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      // ignore
    }
  }, []);

  // Unread calculation
  const openTickets = liveTickets.filter(t => t.status === 'open' || t.status === 'aberto' || !t.status);
  const unreadTicketsCount = openTickets.filter(t => !readTicketIds.includes(t.id)).length;
  const totalNotificationBadgeCount = unreadTicketsCount + dueClients.length;

  useEffect(() => {
    setHasUnread(totalNotificationBadgeCount > 0);
  }, [totalNotificationBadgeCount]);

  const markAllAsRead = () => {
    const allIds = liveTickets.map(t => t.id);
    setReadTicketIds(allIds);
    localStorage.setItem('animasystem_read_tickets', JSON.stringify(allIds));
    setHasUnread(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.displayName || 'Admin Master';
  const email = user?.email || 'master@animasystem.com';
  const photoURL = user?.photoURL;
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleTicketClick = (ticketId: string) => {
    if (!readTicketIds.includes(ticketId)) {
      const updated = [...readTicketIds, ticketId];
      setReadTicketIds(updated);
      localStorage.setItem('animasystem_read_tickets', JSON.stringify(updated));
    }
    setShowNotifications(false);
    onNavigate?.('tickets');
  };

  return (
    <header className="mx-6 sm:mx-10 xl:mx-16 mt-6 rounded-3xl bg-white shadow-sm h-20 flex items-center justify-between px-6 sm:px-10 xl:px-12 sticky top-4 z-40" style={{ fontFamily: 'Urbanist, sans-serif' }}>
      
      {/* LEFT: Brand Logo "AnimaSystem" */}
      <div 
        onClick={() => onNavigate?.('dashboard')}
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-all shrink-0 select-none"
      >
        <span className="text-2xl font-sans tracking-tight select-none">
          <span className="font-light text-zinc-400">Anima</span>
          <span className="font-bold text-black tracking-tight">System</span>
        </span>
      </div>

      {/* MIDDLE: Top navigation menus (centered exactly like screenshot) */}
      <nav className="hidden md:flex items-center gap-2 lg:gap-4 mx-auto overflow-visible py-1 no-scrollbar">
        {topMenus.map((item) => {
          const isActive = currentView === item.view || item.submenus?.some(sub => sub.view === currentView);
          const hasSubmenu = item.submenus && item.submenus.length > 0;
          
          return (
            <div 
              key={item.label}
              className="relative group"
              onMouseEnter={() => setActiveDropdown(item.label)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onClick={() => item.view && onNavigate?.(item.view)}
                className={`px-4 py-2 rounded-full text-xs transition-all font-semibold whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-black text-white shadow-xs font-bold' 
                    : 'text-zinc-600 hover:text-black font-medium hover:bg-zinc-50'
                }`}
              >
                <span>{item.label}</span>
                {item.label === 'Clientes' && openTickets.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                {hasSubmenu && (
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 opacity-70 ${activeDropdown === item.label ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Submenu Dropdown */}
              {hasSubmenu && activeDropdown === item.label && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
                  <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xl py-2 min-w-[160px] animate-fade-in text-left">
                    {item.submenus!.map(sub => (
                      <button
                        key={sub.view}
                        onClick={() => {
                          onNavigate?.(sub.view);
                          setActiveDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs transition-all cursor-pointer font-bold whitespace-nowrap flex items-center justify-between ${currentView === sub.view ? 'text-black bg-zinc-50' : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'}`}
                      >
                        <span>{sub.label}</span>
                        {sub.view === 'tickets' && openTickets.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white">
                            {openTickets.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* RIGHT: Notifications, Settings Dropdown, Profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 relative" ref={profileRef}>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative w-11 h-11 flex items-center justify-center border rounded-full transition-all cursor-pointer ${
              showNotifications 
                ? 'bg-zinc-100 text-black border-zinc-300' 
                : totalNotificationBadgeCount > 0 
                  ? 'border-rose-300 bg-rose-50/50 text-rose-600 hover:bg-rose-100/60' 
                  : 'border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50'
            }`}
            title="Notificações e Chamados"
          >
            <Bell className="h-5 w-5" strokeWidth={1.5} />
            {totalNotificationBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white animate-bounce">
                {totalNotificationBadgeCount > 9 ? '9+' : totalNotificationBadgeCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-88 sm:w-96 bg-white border border-zinc-200/90 rounded-3xl shadow-2xl py-3 z-50 animate-fade-in font-sans text-left">
              <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Central de Notificações</span>
                  <p className="text-sm font-black text-zinc-900 leading-tight">Atualizações & Chamados</p>
                </div>
                {totalNotificationBadgeCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {totalNotificationBadgeCount} Novas
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-zinc-400">Em dia</span>
                )}
              </div>

              <div className="flex flex-col py-2 max-h-[380px] overflow-auto custom-scrollbar divide-y divide-zinc-100">
                
                {/* Tickets from Clients */}
                {liveTickets.length > 0 && liveTickets.slice(0, 5).map(ticket => {
                  const isOpen = ticket.status === 'open' || ticket.status === 'aberto' || !ticket.status;
                  const isUnread = !readTicketIds.includes(ticket.id);
                  const isUrgent = ticket.priority === 'urgente' || ticket.priority === 'critical' || ticket.category === 'urgencia';

                  return (
                    <div 
                      key={ticket.id} 
                      onClick={() => handleTicketClick(ticket.id)}
                      className={`px-5 py-3 hover:bg-zinc-50 transition-colors flex gap-3 cursor-pointer group ${
                        isUnread ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isUrgent 
                          ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-500/20' 
                          : 'bg-[#D7FE03]/20 text-zinc-900 border border-[#D7FE03]/40'
                      }`}>
                        <LifeBuoy className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
                            {ticket.title || 'Chamado de Suporte'}
                          </p>
                          {isOpen && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white shrink-0">
                              Aberto
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">
                          Cliente: <strong className="text-zinc-800 font-semibold">{ticket.clientName || ticket.client || ticket.clientId}</strong>
                        </p>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-mono">
                          <span>{ticket.protocol || ticket.id}</span>
                          <span>•</span>
                          <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Recente'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Due clients alerts */}
                {dueClients.length > 0 && dueClients.map(client => (
                  <div 
                    key={client.id} 
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate?.('finance');
                    }}
                    className="px-5 py-3 hover:bg-zinc-50 transition-colors flex gap-3 cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 group-hover:text-accent transition-colors">Vencimento de Mensalidade</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                        A mensalidade do cliente <span className="font-semibold text-zinc-700">{client.name}</span> vence hoje.
                      </p>
                      <span className="text-[10px] text-zinc-400 font-medium mt-1 block">Hoje</span>
                    </div>
                  </div>
                ))}

                {liveTickets.length === 0 && dueClients.length === 0 && (
                  <div className="py-8 text-center px-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-bold text-zinc-700">Nenhuma notificação pendente</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Todos os chamados e vencimentos estão em dia.</p>
                  </div>
                )}

              </div>

              <div className="px-4 pt-2.5 pb-1 border-t border-zinc-100 flex items-center justify-between gap-2">
                <button 
                  onClick={markAllAsRead} 
                  className="py-1.5 px-3 text-[11px] font-bold text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  Marcar como lidas
                </button>

                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate?.('tickets');
                  }}
                  className="py-1.5 px-3 text-[11px] font-bold bg-[#D7FE03] hover:bg-[#c8ee02] text-black rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>Ver Central de Tickets</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Icon (Gear) with its comprehensive tooltip/dropdown */}
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`w-11 h-11 flex items-center justify-center border border-zinc-200 rounded-full transition-all cursor-pointer ${
              showSettingsMenu ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'
            }`}
          >
            <Settings className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {showSettingsMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-zinc-200/80 rounded-2xl shadow-xl py-2 z-50 animate-fade-in font-sans text-left">
              <div className="px-4 py-2 border-b border-zinc-100">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Painel Administrativo</span>
                <p className="text-xs font-black text-zinc-900 leading-tight">Configurações Rápidas</p>
              </div>

              <div className="p-1.5 space-y-0.5">
                <button 
                  onClick={() => {
                    onNavigate?.('settings');
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-black rounded-lg transition-all cursor-pointer font-bold flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-400" />
                  Parâmetros do Sistema
                </button>

                <button 
                  onClick={() => {
                    onNavigate?.('colab-auth');
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-black rounded-lg transition-all cursor-pointer font-bold flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  Aprovar Logins / Colaboradores
                </button>
                
                <button 
                  onClick={() => {
                    onNavigate?.('customization');
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-black rounded-lg transition-all cursor-pointer font-bold flex items-center gap-2"
                >
                  <Palette className="w-3.5 h-3.5 text-zinc-400" />
                  Personalização da Marca
                </button>

                <button 
                  onClick={() => {
                    onNavigate?.('audit');
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-black rounded-lg transition-all cursor-pointer font-bold flex items-center gap-2"
                >
                  <Activity className="w-3.5 h-3.5 text-zinc-400" />
                  Histórico de Auditoria
                </button>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-zinc-100 hover:ring-2 ring-zinc-200 transition-all focus:outline-none cursor-pointer relative"
        >
           {photoURL ? (
             <img src={photoURL} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
           ) : (
             <span className="text-xs font-bold text-zinc-600">{initials}</span>
           )}
        </button>

        {showProfileMenu && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in font-sans text-left">
            <div className="px-4 py-2.5 border-b border-zinc-100">
              <p className="text-xs font-bold text-zinc-900 truncate">{displayName}</p>
              <p className="text-[10px] text-zinc-400 truncate">{email}</p>
            </div>

            <div className="py-1.5">
              <button 
                onClick={async () => {
                  const { signOut } = await import('firebase/auth');
                  await signOut(auth);
                }}
                className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer font-semibold"
              >
                Sair do Sistema
              </button>
            </div>
          </div>
        )}
      </div>

    </header>
  );
}
