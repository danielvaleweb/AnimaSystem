import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Plus, Wallet, PieChart as PieChartIcon, 
  Activity, Layers, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { InvestmentAsset, InvestmentTransaction } from '../../types';
import { TransactionModal } from './TransactionModal';
import { AssetDetailModal } from './AssetDetailModal';
import { MarketDataService } from '../../services/MarketDataService';
import { WalletCard } from './WalletCard';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f43f5e', '#64748b'];

export function InvestmentsView({ onNavigate }: { onNavigate?: (view: any, id?: string) => void }) {
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [userTransactions, setUserTransactions] = useState<InvestmentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'wallet' | 'asset'>('wallet');
  const [selectedAsset, setSelectedAsset] = useState<InvestmentAsset | null>(null);
  const [timeframe, setTimeframe] = useState<'6M' | '1A' | 'TUDO'>('1A');

  // Monthly Goal state stored in Firestore and localStorage
  const [monthlyGoal, setMonthlyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('investment_monthly_goal');
    return saved ? parseFloat(saved) || 1000 : 1000;
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchGoal = async () => {
      try {
        const userDocRef = doc(db, 'user_settings', auth.currentUser!.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().investmentMonthlyGoal) {
          const g = Number(userDoc.data().investmentMonthlyGoal);
          if (!isNaN(g) && g > 0) {
            setMonthlyGoal(g);
            localStorage.setItem('investment_monthly_goal', g.toString());
          }
        }
      } catch (e) {
        console.error("Error fetching investment goal from firestore:", e);
      }
    };
    fetchGoal();
  }, []);

  const handleUpdateMonthlyGoal = async (newGoal: number) => {
    setMonthlyGoal(newGoal);
    localStorage.setItem('investment_monthly_goal', newGoal.toString());
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'user_settings', auth.currentUser.uid), {
          investmentMonthlyGoal: newGoal,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error("Error saving investment goal to firestore:", e);
      }
    }
  };

  // Listen to Assets
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'investments'),
      where('ownerId', '==', auth.currentUser.uid),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedAssets: InvestmentAsset[] = [];
      snapshot.forEach((doc) => {
        loadedAssets.push({ id: doc.id, ...doc.data() } as InvestmentAsset);
      });
      setAssets(loadedAssets);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Transactions for the real Wallet history and monthly goal
  useEffect(() => {
    if (!auth.currentUser) return;

    const qTx = query(
      collection(db, 'investment_transactions'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(qTx, (snapshot) => {
      const txs: InvestmentTransaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() } as InvestmentTransaction);
      });
      // Sort descending by date
      txs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setUserTransactions(txs);
    });

    return () => unsubscribe();
  }, []);

  // Full Refresh function (Quotes + Dashboard)
  const handleRefreshQuotes = async () => {
    setIsRefreshingQuotes(true);
    try {
      const tickersToUpdate = assets
        .filter(a => a.priceSource === 'API' && a.ticker !== 'CAIXA')
        .map(a => a.ticker);
      
      if (tickersToUpdate.length > 0) {
        await MarketDataService.getQuotes(tickersToUpdate);
      }
    } catch (e) {
      console.error("Error refreshing quotes:", e);
    } finally {
      setIsRefreshingQuotes(false);
    }
  };

  // Export PDF / Spreadsheet Function
  const handleExportReport = () => {
    const now = new Date().toLocaleDateString('pt-BR');
    
    // 1. Download CSV Spreadsheet
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Ticker,Nome,Categoria,Quantidade,Preço Médio (R$),Preço Atual (R$),Total Investido (R$),Posição Atual (R$),Lucro/Prejuízo (R$),Rentabilidade (%)\n";
    
    assets.forEach(a => {
      const priceToUse = a.currentPrice > 0 ? a.currentPrice : a.averagePrice;
      const currentVal = a.quantity * priceToUse;
      const profitVal = currentVal - a.totalInvested;
      const rentPercent = a.totalInvested > 0 ? (profitVal / a.totalInvested) * 100 : 0;

      csvContent += `"${a.ticker}","${a.name}","${a.category}",${a.quantity},"${a.averagePrice.toFixed(2)}","${priceToUse.toFixed(2)}","${a.totalInvested.toFixed(2)}","${currentVal.toFixed(2)}","${profitVal.toFixed(2)}","${rentPercent.toFixed(2)}%"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `meus_investimentos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. Open printable PDF formatted window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório Consolidado de Investimentos - ${now}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 30px; color: #18181b; }
              h1 { margin-bottom: 4px; font-size: 24px; }
              p.meta { color: #71717a; font-size: 13px; margin-top: 0; }
              .kpis { display: flex; gap: 20px; margin: 24px 0; }
              .kpi-card { border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; flex: 1; }
              .kpi-title { font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: bold; }
              .kpi-val { font-size: 20px; font-weight: bold; margin-top: 6px; font-family: monospace; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #f4f4f5; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; color: #71717a; }
              td { padding: 10px; border-bottom: 1px solid #f4f4f5; font-size: 13px; }
              .right { text-align: right; }
              .green { color: #16a34a; font-weight: bold; }
              .red { color: #dc2626; font-weight: bold; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <h1>Relatório Consolidado de Investimentos</h1>
            <p class="meta">Gerado em ${now} • Gestão Patrimonial e Giro de Carteira</p>
            
            <div class="kpis">
              <div class="kpi-card">
                <div class="kpi-title">Patrimônio Total</div>
                <div class="kpi-val">R$ ${currentPatrimony.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Total Investido</div>
                <div class="kpi-val">R$ ${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Saldo na Carteira (Caixa)</div>
                <div class="kpi-val">R$ ${caixaBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-title">Lucro / Prejuízo</div>
                <div class="kpi-val ${profit >= 0 ? 'green' : 'red'}">${profit >= 0 ? '+' : ''}R$ ${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${rentability.toFixed(2)}%)</div>
              </div>
            </div>

            <h3>Composição da Carteira</h3>
            <table>
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th>Categoria</th>
                  <th class="right">Qtd</th>
                  <th class="right">Preço Médio</th>
                  <th class="right">Cotação Atual</th>
                  <th class="right">Total Investido</th>
                  <th class="right">Posição Atual</th>
                  <th class="right">Rentabilidade</th>
                </tr>
              </thead>
              <tbody>
                ${assets.map(a => {
                  const priceToUse = a.currentPrice > 0 ? a.currentPrice : a.averagePrice;
                  const currentVal = a.quantity * priceToUse;
                  const profitVal = currentVal - a.totalInvested;
                  const rentPercent = a.totalInvested > 0 ? (profitVal / a.totalInvested) * 100 : 0;
                  return `
                    <tr>
                      <td><strong>${a.ticker}</strong><br><small style="color:#71717a">${a.name}</small></td>
                      <td>${a.category}</td>
                      <td class="right">${a.quantity}</td>
                      <td class="right">R$ ${a.averagePrice.toFixed(2)}</td>
                      <td class="right">R$ ${priceToUse.toFixed(2)}</td>
                      <td class="right">R$ ${a.totalInvested.toFixed(2)}</td>
                      <td class="right"><strong>R$ ${currentVal.toFixed(2)}</strong></td>
                      <td class="right ${profitVal >= 0 ? 'green' : 'red'}">${profitVal >= 0 ? '+' : ''}${rentPercent.toFixed(2)}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Identify Caixa vs Investment Assets
  const isCaixa = (a: InvestmentAsset) => 
    a.ticker?.toUpperCase() === 'CAIXA' || 
    a.category?.toLowerCase() === 'caixa' || 
    a.name?.toLowerCase().includes('caixa');

  const caixaAsset = assets.find(isCaixa);
  const caixaBalance = caixaAsset ? (caixaAsset.quantity * (caixaAsset.currentPrice > 0 ? caixaAsset.currentPrice : caixaAsset.averagePrice)) : 0;
  
  // Non-caixa assets for the table
  const displayAssets = assets.filter(a => !isCaixa(a));

  // Calculate Summary Metrics
  const totalInvested = assets.reduce((acc, asset) => acc + (asset.totalInvested || 0), 0);
  
  // For current patrimony
  const currentPatrimony = assets.reduce((acc, asset) => {
    const priceToUse = asset.currentPrice > 0 ? asset.currentPrice : asset.averagePrice;
    return acc + ((asset.quantity || 0) * priceToUse);
  }, 0);

  const profit = currentPatrimony - totalInvested;
  const rentability = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  // Real Historical Evolution Calculation
  const evolutionData = React.useMemo(() => {
    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const numPoints = timeframe === '6M' ? 6 : timeframe === '1A' ? 12 : 24;
    const points: { name: string; fullDate: string; value: number }[] = [];

    for (let i = numPoints - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      const cutoffStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      
      const label = timeframe === 'TUDO' 
        ? `${monthLabels[month]}/${String(year).slice(2)}` 
        : monthLabels[month];

      if (userTransactions.length > 0) {
        // Calculate cumulative net cashflows up to this month
        const txsUpToDate = userTransactions.filter(t => t.date && t.date <= cutoffStr);
        let cumulativeBalance = 0;
        
        txsUpToDate.forEach(tx => {
          const val = tx.grossValue || (tx.quantity * tx.unitPrice) || 0;
          if (['APORTE', 'COMPRA', 'BONIFICAÇÃO', 'DIVIDENDOS'].includes(tx.type)) {
            cumulativeBalance += val;
          } else if (['RESGATE', 'TAXA'].includes(tx.type)) {
            cumulativeBalance -= val;
          }
        });

        // Current month reflects exact current real-time patrimony
        let pointValue = cumulativeBalance;
        if (i === 0) {
          pointValue = currentPatrimony > 0 ? currentPatrimony : cumulativeBalance;
        }

        points.push({
          name: label,
          fullDate: `${monthLabels[month]} de ${year}`,
          value: Math.max(0, Math.round(pointValue))
        });
      } else {
        // If no transactions yet, show 0 leading to currentPatrimony
        const val = i === 0 ? currentPatrimony : 0;
        points.push({
          name: label,
          fullDate: `${monthLabels[month]} de ${year}`,
          value: Math.max(0, Math.round(val))
        });
      }
    }

    return points;
  }, [userTransactions, currentPatrimony, timeframe]);

  // Calculate Allocation for Pie Chart
  const allocationMap = new Map<string, number>();
  assets.forEach(asset => {
    const priceToUse = asset.currentPrice > 0 ? asset.currentPrice : asset.averagePrice;
    const value = (asset.quantity || 0) * priceToUse;
    if (value > 0) {
      const categoryName = asset.category || 'Outros';
      const current = allocationMap.get(categoryName) || 0;
      allocationMap.set(categoryName, current + value);
    }
  });

  const allocationData = Array.from(allocationMap.entries())
    .map(([name, value], idx) => ({
      name,
      value: Number(((value / (currentPatrimony || 1)) * 100).toFixed(1)),
      raw: value,
      color: COLORS[idx % COLORS.length]
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col h-full bg-transparent relative space-y-10">
      
      {/* Standard Header with Back Arrow and Title */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-5 text-left">
          <button 
            onClick={() => onNavigate?.('finance')}
            className="w-12 h-12 rounded-full bg-transparent border border-zinc-200/80 flex items-center justify-center text-zinc-500 hover:bg-white hover:text-black transition-all cursor-pointer shrink-0"
            title="Voltar para Financeiro"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="text-[40px] font-normal text-zinc-900 tracking-tight whitespace-nowrap">
              Investimentos
            </h1>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Patrimônio */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 relative overflow-hidden group">
          <span className="text-zinc-500 text-xs font-medium mb-2 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-zinc-400" /> Patrimônio Atual
          </span>
          <div className="text-3xl font-black text-zinc-900 font-mono tracking-tight mt-1 truncate">
            R$ {currentPatrimony.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5 font-medium">
            <span>Posição total em tempo real</span>
          </div>
        </div>

        {/* Card 2: Total Investido */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 relative overflow-hidden group">
          <span className="text-zinc-500 text-xs font-medium mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-400" /> Total Investido (Aportes)
          </span>
          <div className="text-3xl font-black text-zinc-900 font-mono tracking-tight mt-1 truncate">
            R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 font-medium">
            Soma de todos os aportes líquidos
          </div>
        </div>

        {/* Card 3: Lucro / Prejuízo */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 relative overflow-hidden group">
          <span className="text-zinc-500 text-xs font-medium mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-400" /> Lucro / Prejuízo
          </span>
          <div className={`text-3xl font-black font-mono tracking-tight mt-1 truncate ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {profit >= 0 ? '+' : ''}R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 font-medium">
            Crescimento gerado por valorização
          </div>
        </div>

        {/* Card 4: Rentabilidade */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 relative overflow-hidden group">
          <span className="text-zinc-500 text-xs font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-400" /> Rentabilidade Geral
          </span>
          <div className={`text-3xl font-black font-mono tracking-tight mt-1 ${rentability >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {rentability >= 0 ? '+' : ''}{rentability.toFixed(2)}%
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 font-medium">
            Sobre o total investido
          </div>
        </div>
      </div>

      {/* TOP ROW: WALLET CARD (LEFT) & EVOLUÇÃO PATRIMONIAL (RIGHT) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 items-stretch">
        {/* Wallet Card - Card Preto */}
        <div className="xl:col-span-1">
          <WalletCard 
            balance={caixaBalance}
            transactions={userTransactions}
            onAddFunds={() => {
              setModalTab('wallet');
              setIsTransactionModalOpen(true);
            }}
            onNewTransaction={() => {
              setModalTab('asset');
              setIsTransactionModalOpen(true);
            }}
            onRefreshQuotes={handleRefreshQuotes}
            isRefreshingQuotes={isRefreshingQuotes}
            onExportReport={handleExportReport}
            monthlyGoal={monthlyGoal}
            onUpdateMonthlyGoal={handleUpdateMonthlyGoal}
          />
        </div>

        {/* Evolução Patrimonial */}
        <div className="xl:col-span-2 bg-white border border-zinc-200/80 rounded-3xl p-6 flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-black flex items-center gap-2">
              Evolução Patrimonial
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setTimeframe('6M')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  timeframe === '6M' 
                    ? 'bg-black text-white' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                6M
              </button>
              <button 
                onClick={() => setTimeframe('1A')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  timeframe === '1A' 
                    ? 'bg-black text-white' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                1A
              </button>
              <button 
                onClick={() => setTimeframe('TUDO')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  timeframe === 'TUDO' 
                    ? 'bg-black text-white' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Tudo
              </button>
            </div>
          </div>
          <div className="flex-1 w-full relative min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#a1a1aa' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`}
                />
                <ChartTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: '#18181b', fontWeight: 'bold' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Patrimônio']}
                  labelFormatter={(label, payload) => {
                    const item = payload && payload[0] ? (payload[0].payload as any) : null;
                    return item?.fullDate || label;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: MEUS ATIVOS (LEFT) & DISTRIBUIÇÃO (RIGHT) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 items-start">
        {/* ASSETS TABLE (MEUS ATIVOS) */}
        <div className="xl:col-span-2 bg-white border border-zinc-200/80 rounded-3xl overflow-hidden flex flex-col min-h-[350px]">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-bold text-black">Meus Ativos</h3>
            <div className="flex gap-2">
              <span className="text-xs text-zinc-500 font-medium px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                {displayAssets.length} {displayAssets.length === 1 ? 'ativo' : 'ativos'}
              </span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
            </div>
          ) : displayAssets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-zinc-400 p-8">
              <PieChartIcon className="w-8 h-8 mb-3 text-zinc-300" />
              <p className="text-sm font-medium">Nenhum ativo de investimento cadastrado.</p>
              <p className="text-xs font-light mt-1">Adicione saldo à carteira e compre ativos para iniciar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-zinc-50/50">
                    <th className="py-3 px-6 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Ativo</th>
                    <th className="py-3 px-6 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Quantidade</th>
                    <th className="py-3 px-6 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Preço Médio</th>
                    <th className="py-3 px-6 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Preço Atual</th>
                    <th className="py-3 px-6 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 text-right">Saldo Atual</th>
                    <th className="py-3 px-6 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 text-right">Rentabilidade</th>
                  </tr>
                </thead>
                <tbody>
                  {displayAssets.map(asset => {
                    const priceToUse = asset.currentPrice > 0 ? asset.currentPrice : asset.averagePrice;
                    const currentValue = asset.quantity * priceToUse;
                    const assetProfit = currentValue - asset.totalInvested;
                    const assetRentability = asset.totalInvested > 0 ? (assetProfit / asset.totalInvested) * 100 : 0;
                    
                    const colorIndex = (asset.ticker || '').length % COLORS.length;
                    const avatarColor = COLORS[colorIndex];
                    const ticker = asset.ticker || 'N/A';

                    return (
                      <tr 
                        key={asset.id} 
                        onClick={() => setSelectedAsset(asset)}
                        className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm"
                              style={{ backgroundColor: avatarColor }}
                            >
                              {ticker.substring(0, 2)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900 text-sm">{ticker}</span>
                              <span className="text-[11px] text-zinc-500 font-light truncate max-w-[150px]">{asset.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm text-zinc-700">{asset.quantity}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm text-zinc-700">R$ {asset.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-bold text-zinc-900">R$ {priceToUse.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-zinc-400">{asset.priceSource === 'API' ? 'Via Mercado' : 'Calculado/Manual'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-sm font-bold text-zinc-900">R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-zinc-400">Total Inv: R$ {asset.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`flex items-center gap-1 font-bold text-sm ${assetRentability >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {assetRentability >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {assetRentability >= 0 ? '+' : ''}{assetRentability.toFixed(2)}%
                            </span>
                            <span className={`text-[10px] font-mono ${assetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {assetProfit >= 0 ? '+' : ''} R$ {Math.abs(assetProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DISTRIBUIÇÃO PIE CHART */}
        <div className="xl:col-span-1 bg-white border border-zinc-200/80 rounded-3xl p-6 flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-black flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-zinc-400" /> Distribuição
            </h3>
          </div>
          {allocationData.length > 0 ? (
            <div className="flex-1 flex flex-col">
              {/* PIE CHART SVG CONTAINER WITH FIXED EXPLICIT HEIGHT */}
              <div className="w-full h-[220px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      stroke="#ffffff"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      formatter={(value: number) => [`${value}%`, 'Alocação']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] text-zinc-400 font-medium">Total</span>
                  <span className="text-base font-black text-black">100%</span>
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-4 space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                {allocationData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-zinc-700 truncate max-w-[130px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-zinc-900 font-mono">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm font-medium">
              Sem dados de distribuição
            </div>
          )}
        </div>
      </div>

      <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        caixaBalance={caixaBalance}
        initialTab={modalTab}
        onSuccess={() => {
          // Success
        }}
      />

      <AssetDetailModal
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        asset={selectedAsset}
        ownerId={auth.currentUser?.uid || ''}
      />
    </div>
  );
}
