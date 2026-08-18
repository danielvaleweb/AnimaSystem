import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Settings, ArrowLeft, ShieldCheck, Sparkles, Check } from 'lucide-react';

interface PlansHeaderProps {
  activeTab?: 'dashboard' | 'planos' | 'servicos' | 'checkout' | 'admin-cliente';
}

export function PlansHeader({ activeTab = 'planos' }: PlansHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const navItems = [
    { label: 'Dashboard', id: 'dashboard', path: '/' },
    { label: 'Planos', id: 'planos', path: '/planos/profissional' },
    { label: 'Serviços', id: 'servicos', path: '/adicionar-servicos' },
    { label: 'Checkout', id: 'checkout', path: '/checkout' },
    { label: 'Painel Cliente', id: 'admin-cliente', path: '/admin-cliente' },
  ];

  return (
    <header className="mx-4 sm:mx-8 xl:mx-14 mt-6 rounded-3xl bg-white shadow-sm border border-zinc-100 h-20 flex items-center justify-between px-6 sm:px-10 sticky top-4 z-40">
      {/* Brand Logo AnimaSystem */}
      <div 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all shrink-0 select-none"
      >
        <span className="text-2xl font-sans tracking-tight">
          <span className="font-light text-zinc-400">Anima</span>
          <span className="font-bold text-black tracking-tight">System</span>
        </span>
      </div>

      {/* Centered Navigation Pills matching image 1 */}
      <nav className="hidden md:flex items-center gap-2 lg:gap-3 mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id || location.pathname.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-black text-white shadow-sm font-bold'
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-50'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Icons: Notifications, Settings, Profile */}
      <div className="flex items-center gap-3 shrink-0 relative">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-11 h-11 flex items-center justify-center border border-zinc-200 rounded-full text-zinc-600 hover:text-black hover:bg-zinc-50 transition-all cursor-pointer relative"
          >
            <Bell className="w-5 h-5" strokeWidth={1.5} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-zinc-200 rounded-3xl shadow-xl p-4 z-50 animate-fade-in text-left">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-xs font-bold text-zinc-900">Notificações</span>
                <span className="text-[10px] text-zinc-400 font-medium">1 Nova</span>
              </div>
              <div className="py-3">
                <p className="text-xs font-bold text-zinc-800">Assinatura Ativa</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Seu plano AnimaSystem possui ativação instantânea via PIX.</p>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-11 h-11 flex items-center justify-center border border-zinc-200 rounded-full text-zinc-600 hover:text-black hover:bg-zinc-50 transition-all cursor-pointer"
          >
            <Settings className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-zinc-200 rounded-3xl shadow-xl p-3 z-50 animate-fade-in text-left">
              <div className="p-2 border-b border-zinc-100 mb-1">
                <p className="text-xs font-bold text-zinc-900">Opções do Sistema</p>
                <p className="text-[10px] text-zinc-400">AnimaSystem v2.4</p>
              </div>
              <button 
                onClick={() => { navigate('/planos/starter'); setShowSettings(false); }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
              >
                Ver Todos os Planos
              </button>
              <button 
                onClick={() => { navigate('/checkout'); setShowSettings(false); }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
              >
                Ir para o Checkout
              </button>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="w-11 h-11 rounded-full overflow-hidden border border-zinc-200 bg-zinc-900 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
            alt="Daniel Vale" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="hidden">DV</span>
        </div>
      </div>
    </header>
  );
}
