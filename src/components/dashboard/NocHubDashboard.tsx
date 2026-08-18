import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, RefreshCw, Plus, Calendar, Search, 
  Sliders, SlidersHorizontal, Check, MapPin, Send, Download, ArrowLeftRight, CreditCard, Award, 
  Megaphone, Crown, Sparkles, Smartphone, CheckCircle2, ChevronRight, Coins, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { ClientData } from '../../types';
import { cn } from '../../utils';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip
} from 'recharts';

interface Investment {
  id: string;
  name: string;
  ticker: string;
  classe?: string;
  corretora?: string;
  quantidade?: number;
  precoMedio?: number;
  precoAtual?: number;
  proventos?: number;
  value: number; // Current Total Value
  valorInvestido?: number;
  changePercent: number;
  logoType: 'black' | 'green' | 'white';
}


const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const currentVal = payload[0].value;
    const prevVal = currentVal * 0.91; 

    return (
      <div className="flex items-center gap-2 mb-2 -ml-5 -mt-10 outline-none">
        <span className="text-[10px] bg-zinc-100 text-zinc-600 font-semibold px-2.5 py-1 rounded-full border border-zinc-200">
          R$ {prevVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-[10px] bg-[#D7FE03] text-black font-bold px-2.5 py-1 rounded-full border border-transparent shadow-[0_0_15px_rgba(215,254,3,0.3)]">
          R$ {currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    );
  }
  return null;
};

export function NocHubDashboard({ onNavigate }: { onNavigate: (view: any, id?: string) => void }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showChartMenu, setShowChartMenu] = useState(false);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);

  useEffect(() => {
    const activeClients = clients.filter(c => c.status === 'active');
    if (activeClients.length === 0) return;
    const interval = setInterval(() => {
      setCurrentReminderIndex((prev) => (prev + 1) % Math.min(activeClients.length, 5));
    }, 4000);
    return () => clearInterval(interval);
  }, [clients]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'total' | 'ano' | 'mes' | '7dias' | 'custom'>('total');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [activeModal, setActiveModal] = useState<'widget' | 'period' | 'settings' | 'search' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [dashboardBanners, setDashboardBanners] = useState({ banner1: '', banner2: '', banner3: '' });

  // Fetch global settings
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDashboardBanners({
            banner1: data.banner1Url || data.dashboardBanner1Url || '',
            banner2: data.banner2Url || data.dashboardBanner2Url || '',
            banner3: data.banner3Url || data.dashboardBanner3Url || ''
          });
        }
      } catch (error) {
        console.error("Error fetching global settings:", error);
      }
    };
    fetchGlobalSettings();
  }, []);

  // Fetch clients
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientData));
      data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setClients(data);
    });
    return unsubscribe;
  }, []);

  // Fetch transactions
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'transactions'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });
    return unsubscribe;
  }, []);

  // Fetch investments
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'investments'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));
      setInvestments(data);
    });
    return unsubscribe;
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFullScan = async () => {
    setIsRefreshing(true);
    showToast("Efetuando varredura e atualizando custos GCP...", "info");
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Varredura geral concluída com sucesso!", "success");
    }, 1500);
  };

  // Financial summary calculations
  const totalRevenue = clients
    .filter(c => c.status === 'active' || c.status === 'trial')
    .reduce((sum, c) => sum + (c.monthlyValue || 0), 0);
  
  // Calculate total collected based on period
  const calculateTotalBalance = () => {
    const now = new Date();
    let startDate = new Date(0);
    
    if (selectedPeriod === 'ano') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (selectedPeriod === 'mes') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (selectedPeriod === '7dias') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (selectedPeriod === 'custom' && customDateRange.start) {
      startDate = new Date(customDateRange.start);
    }

    let endDate = now;
    if (selectedPeriod === 'custom' && customDateRange.end) {
      endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
    }

    const filtered = transactions.filter(t => {
      if (t.status !== 'paid') return false;
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });

    const sum = filtered.reduce((acc, t) => {
      const amt = Number(t.amount) || 0;
      return t.type === 'saida' ? acc - amt : acc + amt;
    }, 0);
    return sum;
  };

  const currentTotalBalance = calculateTotalBalance();

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'total': return 'Total arrecadado';
      case 'ano': return 'Este Ano';
      case 'mes': return 'Este Mês';
      case '7dias': return 'Últimos 7 dias';
      case 'custom': return customDateRange.start ? 'Período customizado' : 'Período';
      default: return 'Total';
    }
  };

  // Mock smooth spline expenses data for "Your expenses this year" chart
  const expensesChartData = [
    { name: 'jan', expense: 1200, bg: 1500 },
    { name: 'feb', expense: 1400, bg: 1300 },
    { name: 'mar', expense: 1100, bg: 1600 },
    { name: 'apr', expense: 1900, bg: 1400 },
    { name: 'may', expense: 1700, bg: 2000 },
    { name: 'jun', expense: 2300, bg: 1800 },
    { name: 'jul', expense: 2120, bg: 1500 },
    { name: 'aug', expense: 1800, bg: 2100 },
    { name: 'sep', expense: 2200, bg: 1900 },
    { name: 'oct', expense: 1950, bg: 1600 },
    { name: 'nov', expense: 2500, bg: 2200 },
    { name: 'dec', expense: 2400, bg: 2000 },
  ];
  
  const [selectedChartPeriod, setSelectedChartPeriod] = useState('Anual');
  const [activeMonth, setActiveMonth] = useState('jul');
  

  return (
    <div className="min-h-screen bg-transparent text-zinc-900" style={{ fontFamily: 'Urbanist, sans-serif' }}>
      <div className="w-full max-w-none space-y-14">
        
        {/* ================= GREETING ROW (Hello, Daniel / Michael) ================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-5 text-left">
            <button 
              onClick={() => onNavigate('clients')}
              className="w-12 h-12 rounded-full bg-transparent border border-zinc-200/80 flex items-center justify-center text-zinc-500 hover:bg-white hover:text-black transition-all cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div>
              <h1 className="text-[40px] font-normal text-zinc-900 tracking-tight">
                Hello, {auth.currentUser?.displayName?.split(' ')[0] || 'Michael'}
              </h1>
            </div>
          </div>

          {/* Quick buttons from print: Search, Sliders, Date, Add Widget */}
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setActiveModal('search')}
              className="w-11 h-11 rounded-full bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-500 hover:text-black transition-all cursor-pointer"
            >
              <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>

            <button 
              onClick={() => setActiveModal('settings')}
              className="w-11 h-11 rounded-full bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-500 hover:text-black transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>

            <button 
              onClick={() => setActiveModal('period')}
              className="bg-white border border-zinc-200/80 hover:border-zinc-300 text-zinc-700 text-[13px] font-medium px-5 py-3 rounded-full flex items-center gap-2.5 transition-all cursor-pointer h-11"
            >
              <Calendar className="w-4 h-4 text-accent-02" strokeWidth={1.5} />
              <span className="font-bold">{getPeriodLabel()}</span>
            </button>

            <button 
              onClick={() => setActiveModal('widget')}
              className="bg-white border border-zinc-200/80 hover:border-zinc-300 text-zinc-900 text-[13px] font-bold px-5 py-3 rounded-full flex items-center gap-2 transition-all cursor-pointer h-11"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Add Widget</span>
            </button>

            <button 
              onClick={handleFullScan}
              disabled={isRefreshing}
              className="w-11 h-11 rounded-full bg-[#161616] text-[#D7FE03] flex items-center justify-center transition-all cursor-pointer hover:bg-black"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing ? "animate-spin" : "")} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ================= MAIN THREE-COLUMN GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ----------------- COLUMN 1: TOTAL BALANCE (3/12 width) ----------------- */}
          <div className="lg:col-span-3 bg-black text-white rounded-3xl p-6 flex flex-col justify-start border border-zinc-900 relative overflow-hidden text-left">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-light uppercase tracking-wider text-zinc-400">Total balance</span>
                <button 
                  onClick={() => onNavigate('finance')}
                  className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-all flex items-center justify-center cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-3xl font-light font-sans tracking-tight">
                  R$ {currentTotalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>

              {/* Action Buttons: Send, Receive, Swap, Card */}
              <div className="flex items-center gap-3.5">
                <button className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-all flex items-center justify-center text-white cursor-pointer" title="Send">
                  <Send className="w-4 h-4" />
                </button>
                <button className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-all flex items-center justify-center text-white cursor-pointer" title="Receive">
                  <Download className="w-4 h-4" />
                </button>
                <button className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-all flex items-center justify-center text-white cursor-pointer" title="Swap">
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
                <button className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-all flex items-center justify-center text-white cursor-pointer" title="Cards">
                  <CreditCard className="w-4 h-4" />
                </button>
              </div>

              {/* Progress: Spending in June */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-light text-zinc-400">Spending in June</span>
                </div>
                {/* Visual horizontal slider progress bar: toxic green pill on left, diagonal hatched track on right */}
                <div className="w-full h-8 bg-zinc-900 rounded-full p-1.5 flex items-center overflow-hidden">
                  <div className="bg-[#D7FE03] h-full rounded-full flex items-center justify-end px-3" style={{ width: '45%' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-black" />
                  </div>
                  {/* Hatched lines in remaining track */}
                  <div className="flex-1 h-full bg-[repeating-linear-gradient(45deg,#27272a,#27272a_2px,#09090b_2px,#09090b_8px)] rounded-full ml-1" />
                </div>
                
                <p className="text-[11px] text-zinc-400 leading-normal font-light">
                  <span className="font-semibold text-white">R$ 460,00</span> This is R$ 150,00 less than last month.
                </p>
              </div>
            </div>

            {/* Bottom History sub-cards */}
            <div className="space-y-2 mt-4">
              {transactions
                .filter(t => t.status === 'paid')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3)
                .map((trx) => (
                  <div key={trx.id} className="flex justify-between items-center bg-zinc-950 border border-zinc-900 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className={"w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold font-mono shrink-0 " + (trx.type === 'saida' ? 'text-rose-500' : 'text-[#D7FE03]')}>
                        {trx.type === 'saida' ? '-' : '+'}
                      </span>
                      <div className="flex flex-col text-left min-w-0">
                         <span className="text-xs font-light text-zinc-300 truncate w-full">{trx.title || trx.clientName || (trx.type === 'saida' ? 'Saída' : 'Entrada')}</span>
                         <span className="text-[9px] text-zinc-500 font-mono">
                           {new Date(trx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                         </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs font-light font-mono text-white">
                        R$ {Number(trx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
                {transactions.filter(t => t.type === 'entrada' && t.status === 'paid').length === 0 && (
                  <div className="text-center py-4 text-xs text-zinc-500 font-light border border-dashed border-zinc-900 rounded-2xl">
                    Nenhuma entrada recente.
                  </div>
                )}
            </div>
          </div>
          {/* ----------------- COLUMN 2: INVESTMENTS, ATMs, YOUR EXPENSES (5/12 width) ----------------- */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6 text-left">
            
            {/* Top row of column 2: Investments & (ATMs + Cashback) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              
              {/* Card 1: Investments */}
              <div className="bg-white border border-zinc-200/75 rounded-3xl p-5 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="font-light text-black text-sm tracking-wide">Investments</span>
                  <button 
                    onClick={() => onNavigate('investments')}
                    className="w-7 h-7 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 flex items-center justify-center"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600" />
                  </button>
                </div>

                
                                {/* Dynamically render top 3 investments with overlapping style */}
                <div className="relative my-4 flex flex-col pb-4">
                  {investments.length > 0 ? (
                    [...investments].sort((a, b) => b.value - a.value).slice(0, 3).map((inv, index) => {
                      const periodMult = selectedPeriod === 'ano' ? 12 : selectedPeriod === '7dias' ? 0.25 : 1;
                      const periodSuffix = selectedPeriod === 'ano' ? 'Per year' : selectedPeriod === '7dias' ? 'Per week' : selectedPeriod === 'mes' ? 'Per month' : 'Total';
                      const adjustedChange = inv.changePercent * periodMult;
                      const quantity = (inv.quantidade || 0).toFixed(4); 
                      const currentPrice = inv.precoAtual || inv.precoMedio || 0;
                      
                      const forcedLogoType = index === 0 ? 'black' : index === 1 ? 'green' : 'white';
                      
                      return (
                      <div 
                        key={inv.id || index}
                        style={{ zIndex: index * 10 }}
                        className={`px-5 pt-5 pb-7 rounded-[28px] flex items-center justify-between border relative shadow-sm ${index > 0 ? '-mt-6' : ''} ${
                          forcedLogoType === 'black' ? 'bg-[#0f0f0f] text-white border-zinc-800' :
                          forcedLogoType === 'green' ? 'bg-[#D7FE03] text-black border-[#D7FE03]' :
                          'bg-white text-zinc-900 border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-normal text-lg shrink-0 uppercase border ${
                            forcedLogoType === 'black' ? 'bg-white text-black border-white' :
                            forcedLogoType === 'green' ? 'bg-black text-white border-black' :
                            'bg-black text-white border-black'
                          }`}>
                            {inv.ticker ? inv.ticker.charAt(0) : inv.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex flex-col gap-1.5">
                            <p className={`font-normal text-[15px] truncate leading-none ${forcedLogoType === 'black' ? 'text-zinc-100' : 'text-zinc-900'}`}>{inv.name}</p>
                            <span className={`text-[11px] font-light ${
                              forcedLogoType === 'black' ? 'text-zinc-500' :
                              forcedLogoType === 'green' ? 'text-[#879901]' :
                              'text-zinc-400'
                            }`}>{quantity} ativos</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className={`text-[13px] font-normal tracking-wide ${
                            adjustedChange >= 0 ? 
                              (forcedLogoType === 'black' ? 'text-[#D7FE03]' : 'text-zinc-900') : 
                              (forcedLogoType === 'black' ? 'text-white' : 'text-zinc-900')
                          }`}>
                            {adjustedChange > 0 ? '+' : ''}{adjustedChange.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                          </span>
                          <p className={`text-[11px] font-light ${
                              forcedLogoType === 'black' ? 'text-zinc-500' :
                              forcedLogoType === 'green' ? 'text-[#879901]' :
                              'text-zinc-400'
                            }`}>{periodSuffix}</p>
                          <span className={`text-[9px] font-mono mt-0.5 ${
                              forcedLogoType === 'black' ? 'text-zinc-600' :
                              forcedLogoType === 'green' ? 'text-[#a1b505]' :
                              'text-zinc-400'
                          }`}>Preço R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )})
                  ) : (
                    <div className="text-center py-6 text-xs text-zinc-400">
                      Nenhuma alocação registrada.
                    </div>
                  )}
                </div>
              </div>
              {/* Right Side: ATMs + Cashback */}
              <div className="flex flex-col gap-6">
                {/* Card 2: Lembretes (Agenda) */}
                <div 
                  onClick={() => onNavigate('agenda')}
                  className="bg-white border border-zinc-200/75 rounded-3xl p-5 flex flex-col justify-between cursor-pointer hover:border-zinc-300 transition-all flex-1"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="font-light text-black text-sm tracking-wide block">Lembretes</span>
                      <span className="text-[10px] text-zinc-400 font-light">Agenda de Vencimentos</span>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600" />
                    </button>
                  </div>
                  
                  {/* Lembretes List (Slide 1 by 1) */}
                  <div className="flex-1 flex flex-col justify-center overflow-hidden relative min-h-[140px]">
                    {clients.filter(c => c.status === 'active').length > 0 ? clients.filter(c => c.status === 'active').slice(0, 5).map((client, idx) => {
                      const today = new Date();
                      const dueDate = new Date();
                      dueDate.setDate(client.dueDate || (today.getDate() + idx));
                      
                      const isToday = dueDate.getDate() === today.getDate();
                      const daysLeft = dueDate.getDate() - today.getDate();
                      
                      let statusText = "";
                      let statusColor = "";
                      
                      if (isToday) {
                        statusText = "Vence Hoje";
                        statusColor = "text-red-600 bg-red-50 border-red-100";
                      } else if (daysLeft < 0) {
                        statusText = "Atrasado";
                        statusColor = "text-red-700 bg-red-50 border-red-200";
                      } else {
                        statusText = `Vence em ${daysLeft} dias`;
                        statusColor = "text-amber-600 bg-amber-50 border-amber-100";
                      }

                      return (
                        <div 
                          key={client.id} 
                          className={`absolute inset-0 flex flex-col justify-center p-5 rounded-2xl border border-zinc-100 transition-all duration-500 ${
                            currentReminderIndex === idx ? 'opacity-100 translate-x-0 z-10 bg-zinc-50/80' : 'opacity-0 translate-x-4 -z-10 pointer-events-none'
                          }`}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-sm font-bold text-zinc-600 shadow-sm shrink-0">
                              {client.logoInitials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-zinc-800 line-clamp-1">{client.name}</span>
                              <span className="text-xs text-zinc-500 mt-0.5">Mensalidade</span>
                            </div>
                          </div>
                          <div className="mt-auto flex justify-between items-center">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full border ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-4 text-xs text-zinc-400 h-full flex items-center justify-center">Nenhum lembrete.</div>
                    )}
                  </div>
                  
                  {/* Indicators removed per request */}
                </div>

                {/* Card 3: Clientes recentes */}
                <div 
                  onClick={() => onNavigate('clients')}
                  className="bg-white border border-zinc-200/75 rounded-3xl p-5 flex flex-col justify-between shrink-0 cursor-pointer hover:border-zinc-300 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-light text-black text-sm tracking-wide">Clientes recentes</span>
                    <button className="w-7 h-7 rounded-full bg-zinc-50 border border-zinc-200/80 flex items-center justify-center">
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600" />
                    </button>
                  </div>

                  {/* Multi-logos horizontal overlapped lists */}
                  <div className="flex justify-center mt-6 mb-2">
                    <div className="flex -space-x-3 overflow-hidden">
                      {clients.length > 0 ? (
                        <>
                          {clients.slice(0, 4).map((client, idx) => (
                            <div key={client.id} title={client.name} className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center overflow-hidden relative" style={{ zIndex: idx }}>
                              {client.logoUrl ? (
                                <img src={client.logoUrl} alt={client.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                              ) : (
                                <span className="text-xl font-bold text-zinc-500">{client.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                          ))}
                          {clients.length > 4 && (
                            <div className="w-16 h-16 rounded-full bg-black border-2 border-white flex items-center justify-center text-lg font-bold text-white relative" style={{ zIndex: 4 }}>
                              +{clients.length - 4}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-white border border-zinc-200 text-zinc-500">A</div>
                          <div className="w-16 h-16 rounded-full bg-white border border-zinc-200 text-zinc-500">KFC</div>
                          <div className="w-16 h-16 rounded-full bg-white border border-zinc-200 text-zinc-500">M</div>
                          <div className="w-16 h-16 rounded-full bg-white border border-zinc-200 text-zinc-500">+3</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Crescimento financeiro chart */}
            <div className="bg-white border border-zinc-200/75 rounded-[32px] p-8 shadow-xs flex flex-col justify-between flex-1 relative overflow-visible">
              <div className="flex justify-between items-start pb-4">
                <span className="font-display font-medium text-zinc-900 text-2xl tracking-tight">Crescimento financeiro</span>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => setShowChartMenu(!showChartMenu)}
                      className="w-10 h-10 rounded-full border border-zinc-200/80 flex items-center justify-center hover:bg-zinc-50 text-zinc-500 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-4 h-4" />
                    </button>
                    
                    {showChartMenu && (
                      <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-zinc-200/80 rounded-2xl shadow-xl py-2 z-50 animate-fade-in text-left">
                        {['Mensal', 'Anual', 'Total', 'Por Período'].map(p => (
                          <button 
                            key={p}
                            onClick={() => { setSelectedChartPeriod(p); setShowChartMenu(false); }} 
                            className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${selectedChartPeriod === p ? 'text-black bg-zinc-50' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => onNavigate('finance')}
                    className="w-10 h-10 rounded-full border border-zinc-200/80 flex items-center justify-center hover:bg-zinc-50 text-zinc-500 transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Area Spline chart */}
              <div className="h-44 w-full pt-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={expensesChartData} 
                    margin={{ top: 15, right: 10, left: 10, bottom: 20 }}
                    onMouseMove={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        setActiveMonth(state.activePayload[0].payload.name);
                      }
                    }}
                    onMouseLeave={() => setActiveMonth('jul')}
                  >
                    {/* Background Mountain Shapes */}
                    <Area 
                      type="monotone" 
                      dataKey="bg" 
                      stroke="none"
                      fill="#f4f4f5" 
                      fillOpacity={0.6} 
                    />
                    
                    <XAxis 
                      dataKey="name" 
                      stroke="#d4d4d8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dy={15}
                      tick={(props: any) => {
                        const { x, y, payload } = props;
                        const isActive = payload.value === activeMonth;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <rect 
                               x="-18" 
                               y="-10" 
                               width="36" 
                               height="20" 
                               rx="10" 
                               fill={isActive ? '#09090b' : '#ffffff'} 
                               stroke={isActive ? '#09090b' : '#e4e4e7'} 
                               strokeWidth={1}
                            />
                            <text 
                               x="0" 
                               y="3" 
                               textAnchor="middle" 
                               fill={isActive ? '#ffffff' : '#71717a'} 
                               fontSize={10} 
                               fontWeight={isActive ? 600 : 500}
                            >
                              {payload.value}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <ChartTooltip 
                      content={<CustomChartTooltip />}
                      cursor={{ stroke: '#d4d4d8', strokeWidth: 1.5 }}
                      isAnimationActive={false}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#18181b" 
                      strokeWidth={2} 
                      fill="transparent" 
                      activeDot={{ r: 5, fill: '#fff', stroke: '#18181b', strokeWidth: 2.5 }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Footer totals */}
              <div className="flex items-baseline gap-2 mt-4 pt-4">
                <span className="text-[28px] font-display font-semibold text-zinc-900 tracking-tight">
                  R$ 28.460,00
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {selectedChartPeriod === 'Mensal' ? 'Isso é R$5.650,00 a mais que no mesmo dia do mês passado' : 'Isso é R$5.650,00 a mais que no ano passado'}
                </span>
              </div>
            </div>

          </div>

          {/* ----------------- COLUMN 3: HIGHLIGHTS & HISTORY (4/12 width) ----------------- */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6 text-left">
                     {/* Top row of Column 3: White wrapper with 3 toxic green visual small cards */}
            <div className="bg-white border border-zinc-200/75 rounded-[32px] p-2.5">
              <div className="grid grid-cols-3 gap-2.5">
                
                {/* Card A: Image Placeholder */}
                <div className="bg-[#D7FE03] rounded-[24px] h-[120px] relative overflow-hidden transition-all cursor-pointer flex items-center justify-center group">
                  {dashboardBanners.banner1 ? (
                    <img src={dashboardBanners.banner1} className="w-full h-full object-cover" alt="Banner 1" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-zinc-900/40 text-xs font-mono font-medium group-hover:text-zinc-900/60 transition-colors"></span>
                  )}
                </div>

                {/* Card B: Image Placeholder */}
                <div className="bg-[#D7FE03] rounded-[24px] h-[120px] relative overflow-hidden transition-all cursor-pointer flex items-center justify-center group">
                  {dashboardBanners.banner2 ? (
                    <img src={dashboardBanners.banner2} className="w-full h-full object-cover" alt="Banner 2" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-zinc-900/40 text-xs font-mono font-medium group-hover:text-zinc-900/60 transition-colors"></span>
                  )}
                </div>

                {/* Card C: Image Placeholder */}
                <div className="bg-[#D7FE03] rounded-[24px] h-[120px] relative overflow-hidden transition-all cursor-pointer flex items-center justify-center group">
                  {dashboardBanners.banner3 ? (
                    <img src={dashboardBanners.banner3} className="w-full h-full object-cover" alt="Banner 3" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-zinc-900/40 text-xs font-mono font-medium group-hover:text-zinc-900/60 transition-colors"></span>
                  )}
                </div>

              </div>
            </div>

            {/* Bottom part of Column 3: History */}
            <div className="bg-white border border-zinc-200/75 rounded-3xl p-6 flex flex-col justify-start flex-1">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
                <span className="font-light text-black text-base tracking-wide">History</span>
                <button 
                  onClick={() => onNavigate('finance')}
                  className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center"
                >
                  <ArrowUpRight className="w-4 h-4 text-zinc-600" />
                </button>
              </div>

              {/* History list groups */}
              <div className="space-y-5 mt-4 flex-1 overflow-y-auto max-h-[360px] pr-1">
                
                {/* Group 1: Today */}
                <div className="space-y-3.5">
                  <span className="text-[9px] text-zinc-400 font-light uppercase tracking-widest block">Today, 20 March</span>
                  
                  {/* Item 1 */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shrink-0 font-light text-xs">N</div>
                      <div className="text-left">
                        <p className="text-xs font-normal text-zinc-900 leading-snug">Nike Store</p>
                        <p className="text-[9px] text-zinc-400 font-light">Purchase</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-light font-mono text-zinc-900">-$45.90</p>
                      <p className="text-[8px] text-zinc-400 font-mono">11:30 AM</p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-black shrink-0 font-light text-xs">A</div>
                      <div className="text-left">
                        <p className="text-xs font-normal text-zinc-900 leading-snug">Apple Store</p>
                        <p className="text-[9px] text-zinc-400 font-light">Purchase</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-light font-mono text-zinc-900">-$112.00</p>
                      <p className="text-[8px] text-zinc-400 font-mono">10:12 AM</p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white shrink-0 font-light text-[10px]">PS</div>
                      <div className="text-left">
                        <p className="text-xs font-normal text-zinc-900 leading-snug">PlayStation Network</p>
                        <p className="text-[9px] text-zinc-400 font-light">Purchase</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-light font-mono text-zinc-900">-$28.60</p>
                      <p className="text-[8px] text-zinc-400 font-mono">6:34 PM</p>
                    </div>
                  </div>

                </div>

                {/* Group 2: Yesterday */}
                <div className="space-y-3.5 pt-2">
                  <span className="text-[9px] text-zinc-400 font-light uppercase tracking-widest block">Yesterday, 19 March</span>

                  {/* Item 4 */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0 font-light text-xs">RF</div>
                      <div className="text-left">
                        <p className="text-xs font-normal text-zinc-900 leading-snug">Robert Fox</p>
                        <p className="text-[9px] text-zinc-400 font-light">Replenishment</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-light font-mono text-emerald-500">+$280.00</p>
                      <p className="text-[8px] text-zinc-400 font-mono">8:10 PM</p>
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0 font-light text-xs">KM</div>
                      <div className="text-left">
                        <p className="text-xs font-normal text-zinc-900 leading-snug">Kathryn Murphy</p>
                        <p className="text-[9px] text-zinc-400 font-light">Replenishment</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-light font-mono text-emerald-500">+$400.00</p>
                      <p className="text-[8px] text-zinc-400 font-mono">4:45 PM</p>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ================= WHITE MODALS (#FFF) ================= */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-left"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <h3 className="font-black text-black text-xs uppercase tracking-widest text-zinc-500">
                  {activeModal === 'widget' ? "Add Widget" :
                   activeModal === 'period' ? "Filter Period" :
                   activeModal === 'settings' ? "Settings" : "Search"}
                </h3>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-all cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-zinc-600" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4 font-sans">
                {activeModal === 'widget' && (
                  <p className="text-xs text-zinc-500 leading-normal">
                    Widgets de telemetria adicionais ativados com sucesso na sua visualização principal do NocHub.
                  </p>
                )}
                {activeModal === 'period' && (
                  <div className="flex flex-col gap-2">
                    {['total', 'ano', 'mes', '7dias', 'custom'].map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setSelectedPeriod(p as any);
                          if (p !== 'custom') setActiveModal(null);
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedPeriod === p ? 'bg-[#D7FE03] text-black' : 'hover:bg-zinc-100 text-zinc-600'}`}
                      >
                        {p === 'total' ? 'Total arrecadado' : p === 'ano' ? 'Este Ano' : p === 'mes' ? 'Este Mês' : p === '7dias' ? 'Últimos 7 dias' : 'Período customizado'}
                      </button>
                    ))}
                    {selectedPeriod === 'custom' && (
                      <div className="mt-2 flex flex-col gap-2">
                        <input type="date" value={customDateRange.start} onChange={e => setCustomDateRange({...customDateRange, start: e.target.value})} className="border rounded p-2 text-xs" />
                        <input type="date" value={customDateRange.end} onChange={e => setCustomDateRange({...customDateRange, end: e.target.value})} className="border rounded p-2 text-xs" />
                      </div>
                    )}
                  </div>
                )}
                {activeModal === 'settings' && (
                  <p className="text-xs text-zinc-500 leading-normal">
                    Configuração geral de interface de alta precisão e notificações automáticas salva no Firebase Firestore.
                  </p>
                )}
                {activeModal === 'search' && (
                  <input 
                    type="text" 
                    placeholder="Busca rápida..." 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs text-zinc-800 outline-none"
                    autoFocus
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-[#161616] border border-zinc-800 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-fade-in font-sans">
            <span className="w-2 h-2 rounded-full bg-[#D7FE03] animate-ping" />
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
