import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { NotificationProvider } from './components/NotificationContext';
import { cn } from './utils';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KPICard } from './components/KPICard';
import { RevenueChart, ClientsChart } from './components/Charts';
import { AlertsPanel } from './components/AlertsPanel';
import { ClientsView } from './components/clients/ClientsView';
import { ClientDetailView } from './components/clients/ClientDetailView';
import { MonitorView } from './components/monitor/MonitorView';
import { FinanceView } from './components/finance/FinanceView';
import { TicketsView } from './components/tickets/TicketsView';
import { AuditView } from './components/audit/AuditView';
import { SettingsView } from './components/settings/SettingsView';
import { LeadsView } from './components/leads/LeadsView';
import { LandingPage } from './components/landing/LandingPage';
import { PortfolioPage } from './components/portfolio/PortfolioPage';
import { 
  DollarSign, 
  Wallet, 
  Users, 
  UserPlus, 
  UserMinus, 
  Ticket, 
  ShieldAlert 
} from 'lucide-react';
import { KPIData, ViewType } from './types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';

const defaultKpiData: KPIData[] = [
  { title: 'Receita Mensal', value: 'R$ 0k', trend: 12, icon: DollarSign },
  { title: 'Receita Anual', value: 'R$ 0M', trend: 15, icon: Wallet },
  { title: 'Clientes Ativos', value: '0', trend: 5, icon: Users },
  { title: 'Clientes Trial', value: '0', trend: -2, icon: UserPlus },
  { title: 'Clientes Suspensos', value: '0', trend: 0, icon: UserMinus },
  { title: 'Tickets Abertos', value: '12', trend: 3, icon: Ticket },
  { title: 'Alertas Críticos', value: '2', trend: -1, icon: ShieldAlert },
];

function DashboardHome() {
  const [showMoreKPIs, setShowMoreKPIs] = useState(false);
  const [kpis, setKpis] = useState([...defaultKpiData]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Load Transactions for Revenue
    const qTrx = query(collection(db, 'transactions'), where('ownerId', '==', auth.currentUser.uid));
    const unsubTrx = onSnapshot(qTrx, (snap) => {
       const now = new Date();
       const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
       const currentYearPrefix = `${now.getFullYear()}`;
       
       let monthRevenue = 0;
       let yearRevenue = 0;
       
       snap.forEach(doc => {
         const t = doc.data();
         if (t.type === 'entrada' && t.status === 'paid' && t.date) {
            if (t.date.startsWith(currentMonthPrefix)) {
               monthRevenue += t.amount;
            }
            if (t.date.startsWith(currentYearPrefix)) {
               yearRevenue += t.amount;
            }
         }
       });

       setKpis(prev => {
         const newKpis = [...prev];
         newKpis[0] = { ...newKpis[0], value: `R$ ${(monthRevenue/1000).toFixed(1)}k` };
         
         const yearString = yearRevenue > 1000000 ? `${(yearRevenue/1000000).toFixed(2)}M` : `${(yearRevenue/1000).toFixed(1)}k`;
         newKpis[1] = { ...newKpis[1], value: `R$ ${yearString}` };
         return newKpis;
       });
    });

    // Load Clients
    const qCl = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid));
    const unsubCl = onSnapshot(qCl, (snap) => {
       let active = 0, trial = 0, suspended = 0;
       snap.forEach(doc => {
         const status = doc.data().status;
         if (status === 'active') active++;
         if (status === 'trial') trial++;
         if (status === 'suspended') suspended++;
       });
       
       setKpis(prev => {
         const newKpis = [...prev];
         newKpis[2] = { ...newKpis[2], value: active.toString() };
         newKpis[3] = { ...newKpis[3], value: trial.toString() };
         newKpis[4] = { ...newKpis[4], value: suspended.toString() };
         return newKpis;
       });
    });

    return () => {
      unsubTrx();
      unsubCl();
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <KPICard data={kpis[0]} highlighted={true} />
        </div>
        <KPICard data={kpis[2]} />
        <div className="lg:col-span-1 flex items-center justify-center">
          <button 
            onClick={() => setShowMoreKPIs(!showMoreKPIs)}
            className="w-full h-full min-h-[120px] rounded-[2rem] border border-dashed border-zinc-700 hover:border-accent text-zinc-400 hover:text-accent transition-colors flex flex-col items-center justify-center gap-2"
          >
            <span className="text-sm font-medium">{showMoreKPIs ? 'Ocultar Detalhes' : 'Mostrar Mais KPIs'}</span>
          </button>
        </div>

        {showMoreKPIs && (
          <>
            <KPICard data={kpis[1]} />
            <KPICard data={kpis[3]} />
            <KPICard data={kpis[5]} />
            <KPICard data={kpis[6]} />
            <KPICard data={kpis[4]} />
          </>
        )}
      </div>

      {/* Charts & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-[380px]">
            <RevenueChart />
          </div>
          <div className="h-[380px]">
            <ClientsChart />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
}

function MainLayout({ currentView, children, onNavigate }: { currentView: ViewType, children: React.ReactNode, onNavigate: (view: ViewType, id?: string) => void }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  if (user === undefined) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Checking auth...</div>;
  }

  if (user === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-2xl max-w-md w-full text-center">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-zinc-100 mb-4">Acesso Restrito</h2>
          <p className="text-zinc-400 text-sm mb-8">Faça login com sua conta do Google para acessar a AnimaSystem Master.</p>
          <button 
            onClick={handleLogin}
            className="bg-accent text-zinc-950 font-semibold px-6 py-3 rounded-full hover:bg-accent-hover transition-colors w-full cursor-pointer"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-x-hidden">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(v) => {
          onNavigate(v);
          setMobileSidebarOpen(false);
        }} 
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      
      <main className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 w-full overflow-hidden ml-0 mr-0",
        isCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <Header 
          currentView={currentView} 
          onNavigate={onNavigate} 
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
        />
        
        <div className="flex-1 p-4 sm:p-8 overflow-auto flex flex-col custom-scrollbar">
          {/* Main Content Area */}
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  // We use currentView to keep the sidebar highlighting matching until we refactor it completely to use route matching.
  
  const handleNavigateToClientDetail = (clientId: string) => {
    navigate(`/clientes/${clientId}`);
  };

  const handleBackToClients = () => {
    navigate('/clientes');
  };

  const handleNavigate = (v: ViewType, id?: string) => {
    if (v === 'dashboard') navigate('/home');
    else if (v === 'client-detail' && id) navigate(`/clientes/${id}`);
    else navigate(`/${v === 'settings' ? 'configuracoes' : v === 'monitor' ? 'monitoramento' : v === 'audit' ? 'auditoria' : v === 'tickets' ? 'tickets' : v === 'finance' ? 'financeiro' : v === 'clients' ? 'clientes' : v === 'leads' ? 'leads' : v}`);
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage onEnter={() => navigate('/home')} />} />
      <Route path="/portfolio" element={<PortfolioPage />} />
      <Route path="/home" element={<MainLayout currentView="dashboard" onNavigate={handleNavigate}><DashboardHome /></MainLayout>} />
      <Route path="/leads" element={<MainLayout currentView="leads" onNavigate={handleNavigate}><LeadsView /></MainLayout>} />
      <Route path="/clientes" element={<MainLayout currentView="clients" onNavigate={handleNavigate}><ClientsView onClientSelect={handleNavigateToClientDetail} /></MainLayout>} />
      <Route path="/clientes/:clientId" element={<MainLayout currentView="client-detail" onNavigate={handleNavigate}><ClientDetailRoute onBack={handleBackToClients} /></MainLayout>} />
      <Route path="/financeiro" element={<MainLayout currentView="finance" onNavigate={handleNavigate}><FinanceView /></MainLayout>} />
      <Route path="/tickets" element={<MainLayout currentView="tickets" onNavigate={handleNavigate}><TicketsView /></MainLayout>} />
      <Route path="/monitoramento" element={<MainLayout currentView="monitor" onNavigate={handleNavigate}><MonitorView /></MainLayout>} />
      <Route path="/auditoria" element={<MainLayout currentView="audit" onNavigate={handleNavigate}><AuditView /></MainLayout>} />
      <Route path="/configuracoes" element={<MainLayout currentView="settings" onNavigate={handleNavigate}><SettingsView /></MainLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { useParams } from 'react-router-dom';

function ClientDetailRoute({ onBack }: { onBack: () => void }) {
  const { clientId } = useParams<{ clientId: string }>();
  return <ClientDetailView clientId={clientId || "unknown"} onBack={onBack} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </BrowserRouter>
  );
}

