import { Search, Menu, Settings, ShieldAlert, Bell, Palette, LogOut, Key, SearchIcon, Zap, ShieldCheck, Activity, ChevronDown, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { ViewType, ClientData } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
  const [hasUnread, setHasUnread] = useState(true);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [dueClients, setDueClients] = useState<ClientData[]>([]);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Keep track of the active hover state for dropdowns
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

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
                className={`px-4 py-2 rounded-full text-xs transition-all font-semibold whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  isActive 
                    ? 'bg-black text-white shadow-xs font-bold' 
                    : 'text-zinc-600 hover:text-black font-medium hover:bg-zinc-50'
                }`}
              >
                {item.label}
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
                        className={`w-full text-left px-4 py-2 text-xs transition-all cursor-pointer font-bold whitespace-nowrap ${currentView === sub.view ? 'text-black bg-zinc-50' : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'}`}
                      >
                        {sub.label}
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
            className={`relative w-11 h-11 flex items-center justify-center border border-zinc-200 rounded-full transition-all cursor-pointer ${
              showNotifications ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'
            }`}
          >
            <Bell className="h-5 w-5" strokeWidth={1.5} />
            {hasUnread && <span className="absolute top-[10px] right-[10px] block h-2 w-2 rounded-full border-2 border-white bg-red-500" />}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200/80 rounded-3xl shadow-2xl py-3 z-50 animate-fade-in font-sans text-left">
              <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Notificações</span>
                  <p className="text-sm font-black text-zinc-900 leading-tight">Suas atualizações</p>
                </div>
                {hasUnread && <div className="text-[10px] font-medium text-zinc-500">3 Novas</div>}
              </div>

              <div className="flex flex-col py-2 max-h-[350px] overflow-auto custom-scrollbar">
                
                {dueClients.length > 0 && dueClients.map(client => (
                  <div key={client.id} className="px-5 py-3 hover:bg-zinc-50 transition-colors flex gap-3 cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 group-hover:text-accent transition-colors">Vencimento Hoje</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                        A mensalidade do cliente <span className="font-semibold text-zinc-700">{client.name}</span> vence hoje.
                      </p>
                      <span className="text-[10px] text-zinc-400 font-medium mt-1.5 block">Agora mesmo</span>
                    </div>
                  </div>
                ))}

                {dueClients.length === 0 && (
                  <div className="px-5 py-3 hover:bg-zinc-50 transition-colors flex gap-3 cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 group-hover:text-accent transition-colors">Vencimento Hoje</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                        O cliente <span className="font-semibold text-zinc-700">Marcenaria Sheiffer</span> vence hoje.
                      </p>
                      <span className="text-[10px] text-zinc-400 font-medium mt-1.5 block">Há 5 min</span>
                    </div>
                  </div>
                )}

                <div className="px-5 py-3 hover:bg-zinc-50 transition-colors flex gap-3 cursor-pointer group">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 group-hover:text-accent transition-colors">Compromisso</p>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                      Hoje você tem um compromisso agendado às 14:00.
                    </p>
                    <span className="text-[10px] text-zinc-400 font-medium mt-1.5 block">Há 2 horas</span>
                  </div>
                </div>

                <div className="px-5 py-3 hover:bg-zinc-50 transition-colors flex gap-3 cursor-pointer group">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 group-hover:text-accent transition-colors">Tarefa Pendente</p>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                      Você tem uma nova tarefa para concluir até o final do dia.
                    </p>
                    <span className="text-[10px] text-zinc-400 font-medium mt-1.5 block">Ontem</span>
                  </div>
                </div>

              </div>

              <div className="px-5 pt-3 pb-1 border-t border-zinc-100">
                <button onClick={() => setHasUnread(false)} className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer">
                  Marcar todas como lidas
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
