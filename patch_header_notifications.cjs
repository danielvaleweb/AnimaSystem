const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Imports
content = content.replace(
  /import { Search, Menu, Settings, ShieldAlert, Bell, Palette, LogOut, Key, SearchIcon, Zap, ShieldCheck, Activity, ChevronDown } from 'lucide-react';/g,
  "import { Search, Menu, Settings, ShieldAlert, Bell, Palette, LogOut, Key, SearchIcon, Zap, ShieldCheck, Activity, ChevronDown, CheckCircle2, Calendar, Clock } from 'lucide-react';"
);

// State
content = content.replace(
  /const \[showSettingsMenu, setShowSettingsMenu\] = useState\(false\);/g,
  "const [showSettingsMenu, setShowSettingsMenu] = useState(false);\n  const [showNotifications, setShowNotifications] = useState(false);\n  const notificationsRef = useRef<HTMLDivElement>(null);\n  const [dueClients, setDueClients] = useState<ClientData[]>([]);"
);

// Click outside
content = content.replace(
  /if \(settingsRef\.current && !settingsRef\.current\.contains\(event\.target as Node\)\) \{/g,
  "if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {"
);

const useEffectMatch = `useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);`;

const useEffectReplacement = `useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid), where('status', '==', 'active'));
    getDocs(q).then((snapshot) => {
      const today = new Date().getDate();
      const due = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ClientData))
        .filter(c => c.dueDate === today);
      setDueClients(due);
    });
  }, [auth.currentUser]);`;

content = content.replace(useEffectMatch, useEffectReplacement);

// Render notifications
const bellMatch = `{/* Notifications Icon with Red Dot badge */}
        <button className="relative w-11 h-11 flex items-center justify-center border border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50 rounded-full transition-all cursor-pointer">
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          <span className="absolute top-[10px] right-[10px] block h-2 w-2 rounded-full bg-red-500" />
        </button>`;

const bellReplacement = `{/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={\`relative w-11 h-11 flex items-center justify-center border border-zinc-200 rounded-full transition-all cursor-pointer \${
              showNotifications ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'
            }\`}
          >
            <Bell className="h-5 w-5" strokeWidth={1.5} />
            <span className="absolute top-[10px] right-[10px] block h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200/80 rounded-3xl shadow-2xl py-3 z-50 animate-fade-in font-sans text-left">
              <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Notificações</span>
                  <p className="text-sm font-black text-zinc-900 leading-tight">Suas atualizações</p>
                </div>
                <div className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">3 Novas</div>
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
                <button className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer">
                  Marcar todas como lidas
                </button>
              </div>
            </div>
          )}
        </div>`;

content = content.replace(bellMatch, bellReplacement);

fs.writeFileSync('src/components/Header.tsx', content);
console.log("Header patched with notifications");
