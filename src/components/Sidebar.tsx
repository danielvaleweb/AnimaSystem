import { cn } from '../utils';
import { LayoutDashboard, Users, CreditCard, Ticket, Settings, Activity, ShieldAlert, LogOut, Mail, PanelLeft, Image, X } from 'lucide-react';
import { ViewType } from '../types';
import { FirebaseStatusBadge } from './FirebaseStatusBadge';
import { LightningLogo } from './LightningLogo';
import { useNavigate } from 'react-router-dom';

const menuItems: { icon: any; label: string; view: ViewType }[] = [
  { icon: LayoutDashboard, label: 'Dashboard Master', view: 'dashboard' },
  { icon: Mail, label: 'Leads / Solicitações', view: 'leads' },
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ currentView, onViewChange, isCollapsed, onToggleCollapse, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Drawer Overlay Back Drop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden cursor-pointer transition-opacity"
        />
      )}

      <aside className={cn(
        "h-screen bg-zinc-950 border-r border-zinc-800/50 flex flex-col fixed left-0 top-0 transition-all duration-300 z-50",
        // Widths: if collapsed or open on desktop, or if mobile
        isCollapsed ? "md:w-20" : "md:w-64",
        "w-64", // default mobile width
        // Mobile translation
        mobileOpen ? "translate-x-0 shadow-[5px_0_30px_rgba(0,0,0,0.8)]" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between">
          {(!isCollapsed || mobileOpen) ? (
            <>
              <div 
                className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80 overflow-hidden"
                onClick={() => onViewChange('dashboard')}
              >
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <LightningLogo className="w-6 h-6" />
                </div>
                <span className="text-xl tracking-tight whitespace-nowrap" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  <span className="font-light">Anima</span><span className="font-bold">System</span>
                </span>
              </div>
              
              <div className="relative group flex items-center shrink-0 ml-2">
                <button
                  onClick={onCloseMobile && mobileOpen ? onCloseMobile : onToggleCollapse}
                  className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-xl md:rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  title=""
                >
                  {mobileOpen ? <X className="w-5 h-5 text-zinc-400" /> : <PanelLeft className="w-5 h-5" />}
                </button>
                {!mobileOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    Recolher
                  </div>
                )}
              </div>
            </>
          ) : (
             <div 
              className="w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer mx-auto group relative"
              onClick={onToggleCollapse}
            >
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
                 <LightningLogo className="w-6 h-6" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                 <PanelLeft className="w-5 h-5 text-zinc-400 group-hover:text-white" />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Expandir
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onViewChange(item.view)}
              className={cn(
                "w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden cursor-pointer",
                (isCollapsed && !mobileOpen) ? "justify-center px-0" : "px-3",
                currentView === item.view 
                  ? "bg-accent/10 text-accent" 
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100"
              )}
              title={(isCollapsed && !mobileOpen) ? item.label : undefined}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0",
                 currentView === item.view ? "text-accent" : "text-zinc-500 group-hover:text-zinc-300"
              )} />
              {(!isCollapsed || mobileOpen) && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={cn("p-4 border-t border-zinc-800/50 space-y-4", (isCollapsed && !mobileOpen) ? "items-center flex flex-col" : "")}>
          {(!isCollapsed || mobileOpen) ? (
            <FirebaseStatusBadge />
          ) : (
            <div className="w-2 h-2 rounded-full bg-green-500" title="Firebase Online"></div>
          )}
          <button 
            onClick={() => navigate('/')}
            title="Sair para site"
            className={cn(
              "flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100 transition-all duration-200 cursor-pointer",
              (isCollapsed && !mobileOpen) ? "justify-center w-10 px-0" : "w-full px-3"
            )}
          >
            <LogOut className="w-5 h-5 text-zinc-500 shrink-0" />
            {(!isCollapsed || mobileOpen) && <span className="whitespace-nowrap">Sair para site</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
