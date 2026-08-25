import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation, useParams } from 'react-router-dom';
import { NotificationProvider } from './components/NotificationContext';
import { cn } from './utils';
import { Header } from './components/Header';
import { KPICard } from './components/KPICard';
import { ClientsView } from './components/clients/ClientsView';
import { ClientDetailView } from './components/clients/ClientDetailView';
import { MonitorView } from './components/monitor/MonitorView';
import { FinanceView } from './components/finance/FinanceView';
import { TicketsView } from './components/tickets/TicketsView';
import { AuditView } from './components/audit/AuditView';
import { SettingsView } from './components/settings/SettingsView';
import { LeadsView } from './components/leads/LeadsView';
import { CustomizationView } from './components/customization/CustomizationView';
import { InvestmentsView } from './components/investments/InvestmentsView';
import { AgendaView } from './components/agenda/AgendaView';
import { NocHubDashboard } from './components/dashboard/NocHubDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { TrialPage } from './components/trial/TrialPage';
import { PortfolioPage } from './components/portfolio/PortfolioPage';
import PlanDetailView from './components/plans/PlanDetailView';
import CheckoutView from "./components/plans/CheckoutView";
import AddServicesView from "./components/plans/AddServicesView";
import ClientAdminView from "./components/plans/ClientAdminView";
import { ClientSupportPage } from './components/support/ClientSupportPage';
import { CollaboratorAuthView } from './components/CollaboratorAuthView';
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
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
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
function DashboardHome({ onNavigate }: { onNavigate: (view: any, id?: string) => void }) {
  return (
    <NocHubDashboard onNavigate={onNavigate} />
  );
}

function MainLayout({ currentView, children, onNavigate }: { currentView: ViewType, children: React.ReactNode, onNavigate: (view: ViewType, id?: string) => void }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

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
    return <div className="min-h-screen bg-[#F5F5F8] flex items-center justify-center text-zinc-500">Checking auth...</div>;
  }

  if (user === null) {
    return (
      <div className="min-h-screen bg-[#F5F5F8] flex items-center justify-center px-4">
        <div className="bg-white border border-zinc-200 p-6 sm:p-8 rounded-2xl max-w-md w-full text-center">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-black mb-4">Acesso Restrito</h2>
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
    <div className="flex min-h-screen bg-[#f5f5f8] text-zinc-900 font-sans relative overflow-x-hidden">
      <main className="flex-1 flex flex-col min-h-screen w-full overflow-hidden ml-0 mr-0">
        <Header 
          currentView={currentView} 
          onNavigate={onNavigate} 
        />
        
        <div className="flex-1 overflow-auto flex flex-col custom-scrollbar pb-16">
          {/* Main Content Area */}
          <div className="w-full flex-1 flex flex-col px-6 sm:px-10 xl:px-16 pt-16 pb-16">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function SmartRootRoute() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const page = searchParams.get('page');

  if (page === 'suporte' || page === 'suporte-cliente' || location.pathname.startsWith('/suporte-cliente')) {
    return <ClientSupportPage />;
  }
  if (page === 'trial' || page === 'demonstracao') {
    return <TrialPage />;
  }
  if (page === 'checkout' || searchParams.has('isRenewal') || searchParams.has('renov') || searchParams.get('plan') === 'renovacao') {
    return <CheckoutView />;
  }
  if (page === 'portfolio') {
    return <PortfolioPage />;
  }
  if (page === 'services' || page === 'adicionar-servicos') {
    return <AddServicesView />;
  }
  if (page === 'admin-cliente') {
    return <ClientAdminView />;
  }

  return <LandingPage onEnter={() => {}} />;
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const [userRole, setUserRole] = useState<'collaborator' | 'client' | null>(null);
  const [clientDocId, setClientDocId] = useState<string | null>(null);

  // If the user is accessing the client support portal (e.g. /suporte-cliente-id=..., /suporte-cliente/..., /suporte),
  // always render the ClientSupportPage directly regardless of auth state!
  if (
    location.pathname.startsWith('/suporte') ||
    location.pathname.includes('suporte-cliente') ||
    location.search.includes('page=suporte') ||
    location.search.includes('suporte')
  ) {
    return <ClientSupportPage />;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Enforce Google login restricted strictly to danielvaleweb@gmail.com
        const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
        if (isGoogle && user.email !== 'danielvaleweb@gmail.com') {
          await auth.signOut();
          setCurrentUser(null);
          setUserRole(null);
          setClientDocId(null);
          return;
        }

        try {
          const q = query(collection(db, 'clients'), where('authUid', '==', user.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setUserRole('client');
            setClientDocId(snap.docs[0].id);
          } else {
            setUserRole('collaborator');
            setClientDocId(null);
          }
        } catch (err) {
          console.error("Error checking user role", err);
          setUserRole('collaborator');
          setClientDocId(null);
        }
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setClientDocId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleNavigateToClientDetail = (clientId: string) => {
    navigate(`/clientes/${clientId}`);
  };

  const handleBackToClients = () => {
    navigate('/clientes');
  };

  const handleNavigate = (v: ViewType, id?: string) => {
    if (v === 'dashboard') navigate('/admin');
    else if (v === 'client-detail' && id) navigate(`/clientes/${id}`);
    else navigate(`/${v === 'settings' ? 'configuracoes' : v === 'monitor' ? 'monitoramento' : v === 'audit' ? 'auditoria' : v === 'tickets' ? 'tickets' : v === 'finance' ? 'financeiro' : v === 'clients' ? 'clientes' : v === 'leads' ? 'leads' : v === 'colab-auth' ? 'autorizar-colaborador' : v === 'customization' ? 'personalizacao' : v === 'investments' ? 'investimentos' : v === 'agenda' ? 'agenda' : v}`);
  };

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-[#F5F5F8] flex items-center justify-center text-zinc-500 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#D7FE03]">Carregando Sistema...</p>
        </div>
      </div>
    );
  }

  // Client Routing Sandbox
  if (currentUser && userRole === 'client') {
    return (
      <Routes>
        <Route path="/" element={<Navigate to={`/cliente/${clientDocId}`} replace />} />
        <Route path="/suporte/*" element={<ClientSupportPage />} />
        <Route path="/suporte" element={<ClientSupportPage />} />
        <Route path="/trial" element={<TrialPage />} />
        <Route path="/demonstracao" element={<TrialPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/planos/:planName" element={<PlanDetailView />} />
        <Route path="/plano/:planName" element={<PlanDetailView />} />
        <Route path="/plano-starter" element={<PlanDetailView />} />
        <Route path="/plano-profissional" element={<PlanDetailView />} />
        <Route path="/plano-enterprise" element={<PlanDetailView />} />
        <Route path="/checkout" element={<CheckoutView />} />
        <Route path="/adicionar-servicos" element={<AddServicesView />} />
        <Route path="/admin-cliente" element={<ClientAdminView />} />
        <Route path="/cliente/:clientId" element={
          <ClientPortalLayout>
            <ClientPortalRoute clientDocId={clientDocId!} />
          </ClientPortalLayout>
        } />
        <Route path="*" element={<Navigate to={`/cliente/${clientDocId}`} replace />} />
      </Routes>
    );
  }

  // Collaborator Routing
  if (currentUser && userRole === 'collaborator') {
    return (
      <Routes>
        <Route path="/" element={<SmartRootRoute />} />
        <Route path="/suporte/*" element={<ClientSupportPage />} />
        <Route path="/suporte" element={<ClientSupportPage />} />
        <Route path="/trial" element={<TrialPage />} />
        <Route path="/demonstracao" element={<TrialPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/planos/:planName" element={<PlanDetailView />} />
        <Route path="/plano/:planName" element={<PlanDetailView />} />
        <Route path="/plano-starter" element={<PlanDetailView />} />
        <Route path="/plano-profissional" element={<PlanDetailView />} />
        <Route path="/plano-enterprise" element={<PlanDetailView />} />
        <Route path="/checkout" element={<CheckoutView />} />
        <Route path="/adicionar-servicos" element={<AddServicesView />} />
        <Route path="/admin-cliente" element={<ClientAdminView />} />
        <Route path="/admin" element={<MainLayout currentView="dashboard" onNavigate={handleNavigate}><DashboardHome onNavigate={handleNavigate} /></MainLayout>} />
        <Route path="/leads" element={<MainLayout currentView="leads" onNavigate={handleNavigate}><LeadsView /></MainLayout>} />
        <Route path="/clientes" element={<MainLayout currentView="clients" onNavigate={handleNavigate}><ClientsView onClientSelect={handleNavigateToClientDetail} /></MainLayout>} />
        <Route path="/clientes/:clientId" element={<MainLayout currentView="client-detail" onNavigate={handleNavigate}><ClientDetailRoute onBack={handleBackToClients} /></MainLayout>} />
        <Route path="/financeiro" element={<MainLayout currentView="finance" onNavigate={handleNavigate}><FinanceView onNavigate={handleNavigate} /></MainLayout>} />
        <Route path="/tickets" element={<MainLayout currentView="tickets" onNavigate={handleNavigate}><TicketsView /></MainLayout>} />
        <Route path="/monitoramento" element={<MainLayout currentView="monitor" onNavigate={handleNavigate}><MonitorView onNavigate={handleNavigate} /></MainLayout>} />
        <Route path="/auditoria" element={<MainLayout currentView="audit" onNavigate={handleNavigate}><AuditView /></MainLayout>} />
        <Route path="/configuracoes" element={<MainLayout currentView="settings" onNavigate={handleNavigate}><SettingsView /></MainLayout>} />
        <Route path="/personalizacao" element={<MainLayout currentView="customization" onNavigate={handleNavigate}><CustomizationView /></MainLayout>} />
        <Route path="/investimentos" element={<MainLayout currentView="investments" onNavigate={handleNavigate}><InvestmentsView onNavigate={handleNavigate} /></MainLayout>} />
        <Route path="/agenda" element={<MainLayout currentView="agenda" onNavigate={handleNavigate}><AgendaView onNavigate={handleNavigate} /></MainLayout>} />
        <Route path="/autorizar-colaborador" element={<MainLayout currentView="colab-auth" onNavigate={handleNavigate}><CollaboratorAuthView /></MainLayout>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  // Public/Unauthenticated Routing
  return (
    <Routes>
      <Route path="/" element={<SmartRootRoute />} />
      <Route path="/suporte/*" element={<ClientSupportPage />} />
      <Route path="/suporte" element={<ClientSupportPage />} />
      <Route path="/trial" element={<TrialPage />} />
      <Route path="/demonstracao" element={<TrialPage />} />
      <Route path="/portfolio" element={<PortfolioPage />} />
      <Route path="/planos/:planName" element={<PlanDetailView />} />
      <Route path="/plano/:planName" element={<PlanDetailView />} />
      <Route path="/plano-starter" element={<PlanDetailView />} />
      <Route path="/plano-profissional" element={<PlanDetailView />} />
      <Route path="/plano-enterprise" element={<PlanDetailView />} />
      <Route path="/checkout" element={<CheckoutView />} />
      <Route path="/adicionar-servicos" element={<AddServicesView />} />
      <Route path="/admin-cliente" element={<ClientAdminView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ClientPortalRoute({ clientDocId }: { clientDocId: string }) {
  const { clientId } = useParams<{ clientId: string }>();
  
  if (clientId !== clientDocId) {
    return <Navigate to={`/cliente/${clientDocId}`} replace />;
  }

  return <ClientDetailView clientId={clientDocId} onBack={() => {}} isClientView={true} />;
}

function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F8] text-zinc-900 flex flex-col font-sans">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D7FE03]/10 border border-[#D7FE03]/20 flex items-center justify-center">
              <span className="text-[#D7FE03] font-display font-bold text-xs">AS</span>
            </div>
            <div>
              <span className="font-display font-bold text-sm tracking-wide text-black">AnimaSystem</span>
              <span className="text-[10px] text-zinc-500 block -mt-1 font-medium uppercase tracking-wider">Portal do Cliente</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-black text-xs font-semibold tracking-wide transition-all cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-grow p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

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

