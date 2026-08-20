import React, { useState } from 'react';
import { Plus, Download, RefreshCw, Target, TrendingUp, TrendingDown, ArrowDown, ArrowUp, X, Check, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { InvestmentTransaction } from '../../types';
import { parseCurrencyInput } from '../../utils';
import { useNotification } from '../NotificationContext';

interface WalletCardProps {
  balance: number;
  transactions?: InvestmentTransaction[];
  onAddFunds: () => void;
  onNewTransaction: () => void;
  onRefreshQuotes: () => Promise<void>;
  isRefreshingQuotes?: boolean;
  onExportReport: () => void;
  monthlyGoal: number;
  onUpdateMonthlyGoal: (newGoal: number) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function WalletCard({
  balance = 0,
  transactions = [],
  onAddFunds,
  onNewTransaction,
  onRefreshQuotes,
  isRefreshingQuotes = false,
  onExportReport,
  monthlyGoal = 1000,
  onUpdateMonthlyGoal
}: WalletCardProps) {
  const { showSuccess, showInfo } = useNotification();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState(monthlyGoal.toString());

  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentYear = now.getFullYear();
  const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Calculate this month's investments / aportes
  const thisMonthTransactions = transactions.filter(t => t.date && t.date.startsWith(currentMonthStr));
  
  // Invested this month: Total value of COMPRA (assets) + direct APORTE
  const investedThisMonth = thisMonthTransactions
    .filter(t => ['COMPRA', 'APORTE'].includes(t.type))
    .reduce((acc, t) => acc + (t.grossValue || (t.quantity * t.unitPrice) || 0), 0);

  const goal = monthlyGoal > 0 ? monthlyGoal : 1000;
  const progressPercent = Math.min(100, Math.max(0, (investedThisMonth / goal) * 100));
  const remaining = Math.max(0, goal - investedThisMonth);
  const isGoalAchieved = goal > 0 && investedThisMonth >= goal;

  // Last month comparison
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const investedLastMonth = transactions
    .filter(t => t.date && t.date.startsWith(prevMonthStr) && ['COMPRA', 'APORTE'].includes(t.type))
    .reduce((acc, t) => acc + (t.grossValue || (t.quantity * t.unitPrice) || 0), 0);
  
  const diffFromLastMonth = investedThisMonth - investedLastMonth;

  // Format recent transactions (up to 3)
  const recentTxs = transactions.slice(0, 3);

  // Live calculation for candidate goal inside modal
  const typedGoal = parseCurrencyInput(goalInput);
  const isTypedGoalAchieved = typedGoal > 0 && investedThisMonth >= typedGoal;
  const typedRemaining = Math.max(0, typedGoal - investedThisMonth);
  const typedProgress = typedGoal > 0 ? Math.min(100, (investedThisMonth / typedGoal) * 100) : 0;

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseCurrencyInput(goalInput);
    if (!isNaN(val) && val > 0) {
      onUpdateMonthlyGoal(val);
      setShowGoalModal(false);

      if (investedThisMonth >= val) {
        showSuccess(
          'Meta Atualizada!',
          `Meta de R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} salva! Você já atingiu esta meta este mês 🎉`
        );
      } else {
        const remainingVal = val - investedThisMonth;
        showInfo(
          'Meta Elevada!',
          `Nova meta de R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} salva! Falta R$ ${remainingVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para atingir.`
        );
      }
    }
  };

  const handleQuickAddGoal = (additionalAmount: number) => {
    const current = parseCurrencyInput(goalInput) || monthlyGoal || 1000;
    const nextVal = current + additionalAmount;
    setGoalInput(nextVal.toString());
  };

  return (
    <div className="bg-[#000000] border border-zinc-900 rounded-[28px] p-6 text-white flex flex-col justify-between h-full shadow-2xl relative overflow-visible z-20">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-zinc-400 text-[11px] font-extrabold tracking-widest uppercase">
            NA CARTEIRA
          </span>
          <div className="relative group">
            <button 
              onClick={onAddFunds}
              className="w-8 h-8 rounded-full bg-[#18181b] hover:bg-[#d4ff00] hover:text-black transition-all flex items-center justify-center text-[#d4ff00] shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
            {/* Custom Green Tooltip */}
            <div className="absolute right-0 bottom-full mb-3 hidden group-hover:flex items-center justify-center pointer-events-none z-50">
              <div className="bg-[#d4ff00] text-black font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap border border-black/10">
                Adicionar ou Sacar Saldo (Caixa)
              </div>
            </div>
          </div>
        </div>

        {/* Balance Display (Real Caixa Balance) */}
        <div className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
          R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* Quick Action Buttons with Green Tooltips */}
        <div className="flex items-center gap-3 mb-6">
          {/* Button 1: Comprar / Movimentar */}
          <div className="relative group">
            <button 
              onClick={onNewTransaction}
              className="w-11 h-11 rounded-full bg-[#161618] border border-zinc-800/80 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </button>
            <div className="absolute left-0 bottom-full mb-3 hidden group-hover:flex items-center justify-start pointer-events-none z-50">
              <div className="bg-[#d4ff00] text-black font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap border border-black/10">
                Comprar / Operar Ativo
              </div>
            </div>
          </div>

          {/* Button 2: Baixar Relatório */}
          <div className="relative group">
            <button 
              onClick={onExportReport}
              className="w-11 h-11 rounded-full bg-[#161618] border border-zinc-800/80 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:flex items-center justify-center pointer-events-none z-50">
              <div className="bg-[#d4ff00] text-black font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap border border-black/10">
                Exportar Relatório / Planilha
              </div>
            </div>
          </div>

          {/* Button 3: Atualizar Cotações */}
          <div className="relative group">
            <button 
              onClick={() => onRefreshQuotes()}
              disabled={isRefreshingQuotes}
              className="w-11 h-11 rounded-full bg-[#161618] border border-zinc-800/80 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingQuotes ? 'animate-spin text-[#d4ff00]' : 'group-hover:rotate-180 transition-transform'}`} />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:flex items-center justify-center pointer-events-none z-50">
              <div className="bg-[#d4ff00] text-black font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap border border-black/10">
                Atualizar Cotações em Tempo Real
              </div>
            </div>
          </div>

          {/* Button 4: Definir Meta */}
          <div className="relative group">
            <button 
              onClick={() => {
                setGoalInput(monthlyGoal.toString());
                setShowGoalModal(true);
              }}
              className="w-11 h-11 rounded-full bg-[#161618] border border-zinc-800/80 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-[#d4ff00] transition-all shadow-sm cursor-pointer"
            >
              <Target className="w-4 h-4 text-[#d4ff00]" />
            </button>
            <div className="absolute right-0 bottom-full mb-3 hidden group-hover:flex items-center justify-end pointer-events-none z-50">
              <div className="bg-[#d4ff00] text-black font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap border border-black/10">
                Definir Meta do Mês
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Goal Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-medium">Meta de {currentMonthName}</span>
            <span className="text-[11px] text-zinc-500 font-mono">até {lastDayOfMonth} de {currentMonthName.toLowerCase().substring(0, 3)}.</span>
          </div>

          <div className="w-full h-5 bg-[#121214] rounded-full p-0.5 flex items-center relative overflow-hidden">
            {/* Striped dark pattern on background */}
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, #27272a 6px, #27272a 12px)'
              }}
            />
            {/* Neon lime progress fill */}
            <div 
              className="h-full bg-[#d4ff00] rounded-full relative z-10 flex items-center justify-end pr-1 transition-all duration-500"
              style={{ width: `${Math.max(progressPercent, 4)}%` }}
            >
              <div className="w-1.5 h-1.5 bg-black rounded-full" />
            </div>
          </div>

          {/* Subtext info */}
          <div className="text-[11px] text-zinc-400 mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-white font-bold font-mono">
              R$ {investedThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {remaining > 0 ? (
              <span className="text-zinc-400">
                Falta <strong className="text-zinc-200 font-mono">R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> para a meta de R$ {goal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} ({progressPercent.toFixed(1)}%).
              </span>
            ) : (
              <span className="text-[#d4ff00] font-bold">Meta atingida! Parabéns! 🎉</span>
            )}
            {diffFromLastMonth !== 0 && (
              <span className="text-zinc-500 font-light block w-full mt-0.5">
                {diffFromLastMonth >= 0 
                  ? `Isso é R$ ${diffFromLastMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a mais que o mês anterior.`
                  : `Isso é R$ ${Math.abs(diffFromLastMonth).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a menos que o mês anterior.`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="space-y-2.5">
        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-1">
          Últimas Movimentações
        </div>
        {recentTxs.length > 0 ? (
          recentTxs.map((tx, idx) => {
            const isCredit = ['APORTE', 'VENDA', 'DIVIDENDO', 'JCP', 'RENDIMENTO'].includes(tx.type);
            const formattedDate = tx.date ? new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Recente';
            const value = tx.grossValue || (tx.quantity * tx.unitPrice) || 0;

            return (
              <div 
                key={tx.id || `tx-${idx}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#0c0c0e] border border-zinc-800/50 hover:border-zinc-700/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full bg-[#161618] flex items-center justify-center ${isCredit ? 'text-emerald-400' : 'text-red-500'}`}>
                    {isCredit ? <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" /> : <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-zinc-200 leading-tight">
                      {tx.type === 'APORTE' ? 'Aporte na Carteira' : tx.type === 'COMPRA' ? `Compra ${tx.assetId || 'Ativo'}` : `${tx.type}`}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{formattedDate}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold font-mono ${isCredit ? 'text-white' : 'text-zinc-300'}`}>
                  {isCredit ? '+' : '-'} R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            );
          })
        ) : (
          <div className="p-3 rounded-2xl bg-[#0c0c0e] border border-zinc-800/40 text-center text-xs text-zinc-500">
            Nenhuma movimentação registrada ainda.
          </div>
        )}
      </div>

      {/* Monthly Goal Modal / Tooltip */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#d4ff00]" />
                <h4 className="font-bold text-base">Meta de Investimento</h4>
              </div>
              <button 
                onClick={() => setShowGoalModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-full bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Defina o valor que você planeja aportar ou investir durante o mês de <strong>{currentMonthName}</strong> (até o dia {lastDayOfMonth}).
            </p>

            {/* Current Month Summary Card */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                  Aportado neste Mês ({currentMonthName})
                </span>
                <span className="text-lg font-bold font-mono text-white">
                  R$ {investedThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-[#d4ff00]/10 border border-[#d4ff00]/30 text-[#d4ff00] text-[11px] font-bold font-mono">
                Total Acumulado
              </div>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Valor da Nova Meta (R$)
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Atual: R$ {goal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">R$</span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="Ex: 500, 1000, 2500"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-base font-mono font-bold text-white outline-none focus:border-[#d4ff00] transition-colors"
                  />
                </div>

                {/* Quick Add Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                  <span className="text-[10px] font-semibold text-zinc-500 mr-1">Subir meta:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickAddGoal(100)}
                    className="px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-mono font-medium transition-colors cursor-pointer"
                  >
                    + R$ 100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddGoal(500)}
                    className="px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-mono font-medium transition-colors cursor-pointer"
                  >
                    + R$ 500
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddGoal(1000)}
                    className="px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-mono font-medium transition-colors cursor-pointer"
                  >
                    + R$ 1.000
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseCurrencyInput(goalInput) || monthlyGoal || 500;
                      setGoalInput((current * 2).toString());
                    }}
                    className="px-2 py-1 rounded-lg bg-[#d4ff00]/15 hover:bg-[#d4ff00]/25 text-[#d4ff00] text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Dobrar (2x)
                  </button>
                </div>
              </div>

              {/* Dynamic Status Preview Box */}
              <div className="pt-1">
                {typedGoal > 0 ? (
                  isTypedGoalAchieved ? (
                    <div className="bg-[#112402] border border-[#d4ff00]/40 rounded-2xl p-3 text-white flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#d4ff00] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-[#d4ff00]">
                          Meta já Batida! (100%)
                        </div>
                        <div className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                          Você já aportou <strong className="text-white font-mono">R$ {investedThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, superando esta meta em <strong className="text-[#d4ff00] font-mono">R$ {(investedThisMonth - typedGoal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#18181b] border border-amber-500/30 rounded-2xl p-3 text-white flex items-start gap-3">
                      <Target className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="w-full">
                        <div className="flex items-center justify-between font-bold text-xs text-amber-300">
                          <span>Meta em Andamento</span>
                          <span className="font-mono text-[#d4ff00]">{typedProgress.toFixed(1)}%</span>
                        </div>
                        <div className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                          Ainda faltará <strong className="text-white font-mono">R$ {typedRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> para atingir os R$ {typedGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-[11px] text-zinc-500 text-center py-1">
                    Digite um valor para simular o progresso da meta.
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#c4eb02] text-black text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Target className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Salvar Meta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
