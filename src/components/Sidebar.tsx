import { cn } from '../utils';
import { LayoutDashboard, Users, CreditCard, Ticket, Settings, Activity, ShieldAlert, LogOut } from 'lucide-react';
import { ViewType } from '../types';
import { FirebaseStatusBadge } from './FirebaseStatusBadge';
import { LightningLogo } from './LightningLogo';

const menuItems: { icon: any; label: string; view: ViewType }[] = [
  { icon: LayoutDashboard, label: 'Dashboard Master', view: 'dashboard' },
  { icon: Users, label: 'Clientes', view: 'clients' },
  { icon: CreditCard, label: 'Financeiro', view: 'finance' },
  { icon: Ticket, label: 'Tickets', view: 'tickets' },
  { icon: Activity, label: 'Monitoramento', view: 'monitor' },
  { icon: ShieldAlert, label: 'Auditoria', view: 'audit' },
  { icon: Settings, label: 'Configurações', view: 'settings' },
];

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-zinc-950 border-r border-zinc-800/50 flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <div 
          className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => onViewChange('dashboard')}
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <LightningLogo className="w-6 h-6" />
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            <span className="font-light">Anima</span><span className="font-bold">System</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-6">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onViewChange(item.view)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
              currentView === item.view 
                ? "bg-accent/10 text-accent" 
                : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
               currentView === item.view ? "text-accent" : "text-zinc-500 group-hover:text-zinc-300"
            )} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800/50 space-y-4">
        <FirebaseStatusBadge />
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100 transition-all duration-200">
          <LogOut className="w-5 h-5 text-zinc-500" />
          Sair do Painel
        </button>
      </div>
    </aside>
  );
}
