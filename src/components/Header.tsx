import { Search, Menu } from 'lucide-react';
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

export function Header({ currentView, onNavigate, onToggleMobileSidebar }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ClientData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchTerm.trim() || !auth.currentUser) {
        setSearchResults([]);
        return;
      }
      
      const q = query(
        collection(db, 'clients'),
        where('ownerId', '==', auth.currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const results: ClientData[] = [];
      const term = searchTerm.toLowerCase();
      
      snapshot.forEach(doc => {
        const data = doc.data() as ClientData;
        if (
          data.name.toLowerCase().includes(term) || 
          data.domain.toLowerCase().includes(term) ||
          data.responsible?.toLowerCase().includes(term)
        ) {
          results.push({ id: doc.id, ...data });
        }
      });
      
      setSearchResults(results);
    };

    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const titles: Record<ViewType, { title: string; subtitle: string }> = {
    dashboard: { title: 'Visão Geral da Operação', subtitle: 'Acompanhe a saúde de toda a infraestrutura AnimaSystem.' },
    clients: { title: 'Gestão de Clientes', subtitle: 'Administre os projetos, planos e status dos sistemas.' },
    'client-detail': { title: 'Detalhes do Cliente', subtitle: 'Visualização individual e configurações do projeto.' },
    finance: { title: 'Financeiro', subtitle: 'Acompanhe MRR, faturamentos e inadimplência.' },
    tickets: { title: 'Tickets', subtitle: 'Atendimento e suporte técnico das operações.' },
    monitor: { title: 'Monitoramento', subtitle: 'Status dos serviços na nuvem e limites.' },
    audit: { title: 'Auditoria', subtitle: 'Logs de ações críticas e segurança.' },
    settings: { title: 'Configurações', subtitle: 'Ajustes globais da plataforma.' },
    leads: { title: 'Leads', subtitle: 'Gerencie solicitações de consultoria e novos contatos.' },
    landing: { title: '', subtitle: '' }
  };

  const { title, subtitle } = titles[currentView];

  const displayName = user?.displayName || 'Admin Master';
  const email = user?.email || 'master@animasystem.com';
  const photoURL = user?.photoURL;
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <header className="h-20 flex items-center justify-between px-4 sm:px-8 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-3.5 min-w-0">
        {onToggleMobileSidebar && (
          <button 
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden flex items-center justify-center p-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors pointer-events-auto cursor-pointer"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-2xl font-bold tracking-tight text-white truncate max-w-[180px] sm:max-w-none">{title}</h1>
          <p className="text-zinc-400 text-xs sm:text-sm truncate hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <div className="relative group hidden md:block" ref={searchRef}>
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar clientes..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="bg-zinc-900/50 border border-zinc-800 focus:border-accent/50 outline-none rounded-full py-2 pl-10 pr-4 text-sm w-64 text-zinc-200 placeholder:text-zinc-500 transition-all"
          />
          
          {showDropdown && searchTerm.trim() !== '' && (
            <div className="absolute top-full mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden py-2 max-h-64 overflow-y-auto z-50">
              {searchResults.length > 0 ? (
                searchResults.map(client => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setShowDropdown(false);
                      setSearchTerm('');
                      if (onNavigate) onNavigate('client-detail', client.id);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                      {client.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200 truncate">{client.name}</p>
                      <p className="text-xs text-zinc-500 truncate flex items-center gap-1.5 mt-0.5">
                        <a 
                          href={client.domain.startsWith('http') ? client.domain : `https://${client.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-emerald-400 hover:underline cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {client.domain}
                        </a>
                        <span className="text-zinc-700">•</span>
                        <span>{client.responsible}</span>
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-zinc-500 text-center">Nenhum cliente encontrado.</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-zinc-800/50 relative">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-zinc-200">{displayName}</p>
            <p className="text-xs text-zinc-500">{email}</p>
          </div>
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center hover:border-zinc-500 transition-colors focus:outline-none cursor-pointer"
            >
               {photoURL ? (
                 <img src={photoURL} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                 <span className="text-sm font-medium font-display text-zinc-400">{initials}</span>
               )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50">
                <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-colors flex flex-col cursor-pointer">
                  <span className="font-medium text-white">Meu perfil</span>
                  <span className="text-[10px] text-zinc-500">Alterar nome, cargo ou foto</span>
                </button>
                <div className="h-px bg-zinc-800/50 my-1"></div>
                <button 
                  onClick={async () => {
                    // Sign in with prompt="select_account"
                    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
                    const provider = new GoogleAuthProvider();
                    provider.setCustomParameters({ prompt: 'select_account' });
                    try {
                      await signInWithPopup(auth, provider);
                      setShowProfileMenu(false);
                    } catch (e) {
                      console.error("Trocar de conta failed", e);
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-colors cursor-pointer"
                >
                  Trocar de conta
                </button>
                <button 
                  onClick={async () => {
                    const { signOut } = await import('firebase/auth');
                    await signOut(auth);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Sair do sistema
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
