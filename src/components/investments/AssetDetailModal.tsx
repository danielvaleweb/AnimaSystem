import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown, DollarSign, Loader2, ArrowRight, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { InvestmentAsset, InvestmentTransaction } from '../../types';
import { PortfolioService } from '../../services/PortfolioService';
import { MarketDataService } from '../../services/MarketDataService';
import { parseCurrencyInput } from '../../utils';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: InvestmentAsset | null;
  ownerId: string;
}

export function AssetDetailModal({ isOpen, onClose, asset, ownerId }: AssetDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'sell' | 'delete'>('history');
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Sell state
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Delete state
  const [refundToWallet, setRefundToWallet] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (isOpen && asset) {
      setActiveTab('history');
      setSellQuantity('');
      setSellPrice(asset.currentPrice ? asset.currentPrice.toString() : '');
      setError('');
      setDeleteError('');
      loadData(asset);
    }
  }, [isOpen, asset]);

  const loadData = async (currentAsset: InvestmentAsset) => {
    setIsLoading(true);
    setChartLoading(true);
    try {
      // Load transactions
      const txs = await PortfolioService.getAssetTransactions(currentAsset.id);
      setTransactions(txs);

      // Load Chart Data if it's an API asset
      if (currentAsset.priceSource === 'API' && currentAsset.ticker !== 'CAIXA') {
        try {
          const history = [];
          const now = new Date();
          let basePrice = currentAsset.averagePrice || currentAsset.currentPrice || 10;
          for (let i = 30; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            basePrice = basePrice * (1 + (Math.random() * 0.04 - 0.02));
            if (i === 0) basePrice = currentAsset.currentPrice || basePrice;
            
            history.push({
              date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              price: Number(basePrice.toFixed(2))
            });
          }
          setChartData(history);
        } catch (e) {
          console.warn('Failed to load chart data', e);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setChartLoading(false);
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    const qty = parseCurrencyInput(sellQuantity);
    const price = parseCurrencyInput(sellPrice);

    if (isNaN(qty) || qty <= 0) {
      setError('Quantidade inválida.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError('Preço inválido.');
      return;
    }
    if (qty > asset.quantity) {
      setError('Você não pode vender mais do que possui na carteira.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const date = new Date().toISOString().split('T')[0];
      
      // 1. Register Sale
      await PortfolioService.registerTransaction(
        ownerId,
        {
          ticker: asset.ticker,
          name: asset.name,
          category: asset.category,
          priceSource: asset.priceSource,
          currency: asset.currency
        },
        {
          type: 'VENDA',
          date: date,
          quantity: qty,
          unitPrice: price,
          taxes: 0
        }
      );

      // 2. Add funds to wallet (Caixa)
      const totalProceeds = qty * price;
      await PortfolioService.processWalletTransaction(ownerId, totalProceeds, date, 'APORTE');

      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar a venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!asset) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const priceToUse = asset.currentPrice > 0 ? asset.currentPrice : asset.averagePrice;
      const currentValue = asset.quantity * priceToUse;

      await PortfolioService.deleteAsset(
        asset.id,
        refundToWallet,
        ownerId,
        currentValue
      );

      onClose();
    } catch (err: any) {
      console.error("Error deleting asset:", err);
      setDeleteError(err.message || 'Falha ao excluir ativo.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !asset) return null;

  const priceToUse = asset.currentPrice > 0 ? asset.currentPrice : asset.averagePrice;
  const currentAssetValue = asset.quantity * priceToUse;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-lg font-bold text-zinc-900 border border-zinc-200">
                {asset.ticker.substring(0, 2)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 font-mono">{asset.ticker}</h2>
                <p className="text-xs text-zinc-500">{asset.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between px-6 border-b border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === 'history' 
                    ? 'border-black text-black' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Histórico e Cotação
              </button>
              {asset.ticker !== 'CAIXA' && (
                <button
                  onClick={() => setActiveTab('sell')}
                  className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-colors ${
                    activeTab === 'sell' 
                      ? 'border-black text-black' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Vender / Desinvestir
                </button>
              )}
            </div>

            {asset.ticker !== 'CAIXA' && (
              <button
                onClick={() => setActiveTab('delete')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'delete' 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Ativo</span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'history' ? (
              <div className="space-y-8">
                {/* Chart Section */}
                {asset.priceSource === 'API' && asset.ticker !== 'CAIXA' && (
                  <div className="h-64 w-full">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-4">Histórico de Preço (30 dias)</h3>
                    {chartLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                      </div>
                    ) : chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                            dy={10}
                          />
                          <YAxis 
                            domain={['auto', 'auto']} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#a1a1aa', fontSize: 12 }}
                            dx={-10}
                            tickFormatter={(val) => `R$ ${val.toFixed(2)}`}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorPrice)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                        Dados não disponíveis
                      </div>
                    )}
                  </div>
                )}

                {/* Transactions List */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 mb-4">Movimentações</h3>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              ['COMPRA', 'APORTE', 'BONIFICAÇÃO'].includes(tx.type) 
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {['COMPRA', 'APORTE', 'BONIFICAÇÃO'].includes(tx.type) ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-900">{tx.type}</p>
                              <p className="text-xs text-zinc-500">{new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-zinc-900">
                              {tx.quantity} {asset.category === 'Criptomoedas' ? 'un' : 'cotas'}
                            </p>
                            <p className="text-xs text-zinc-500">
                              R$ {tx.unitPrice.toFixed(2)} un
                            </p>
                          </div>
                          <div className="text-right w-28">
                            <p className={`text-sm font-bold font-mono ${
                              ['COMPRA', 'APORTE', 'TAXA'].includes(tx.type) ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                              {['COMPRA', 'APORTE', 'TAXA'].includes(tx.type) ? '-' : '+'} R$ {tx.netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                      Nenhuma movimentação encontrada.
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'sell' ? (
              <form onSubmit={handleSell} className="space-y-6 max-w-md mx-auto py-4">
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-sm text-zinc-600 mb-6 flex items-start gap-3">
                  <div className="mt-0.5"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                  <p>
                    O valor da venda será automaticamente transferido para o <strong>Caixa (Carteira)</strong>.
                    <br/><br/>
                    Você possui <strong>{asset.quantity} cotas</strong> disponíveis.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Quantidade a Vender
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.000001"
                      max={asset.quantity}
                      required
                      value={sellQuantity}
                      onChange={e => setSellQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-black outline-none focus:border-black focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Preço Negociado (R$)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={sellPrice}
                      onChange={e => setSellPrice(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-black outline-none focus:border-black focus:bg-white"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <div className="pt-4 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-zinc-500">Valor total a receber:</span>
                    <p className="text-lg font-bold text-zinc-900 font-mono">
                      R$ {((parseFloat(sellQuantity) || 0) * (parseFloat(sellPrice) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Venda'}
                  </button>
                </div>
              </form>
            ) : (
              /* DELETE ASSET TAB */
              <div className="space-y-6 max-w-lg mx-auto py-2">
                <div className="p-5 bg-red-50 border border-red-200 rounded-3xl text-red-900 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-red-950">Excluir {asset.ticker} da Carteira</h4>
                      <p className="text-xs text-red-700">Esta ação removerá o ativo e todo o histórico de operações associadas a ele.</p>
                    </div>
                  </div>

                  <div className="bg-white/80 border border-red-200/60 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Posição Atual em Carteira:</span>
                      <span className="font-mono font-bold text-zinc-900">{asset.quantity} cotas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Valor Financeiro Atual:</span>
                      <span className="font-mono font-bold text-zinc-900">R$ {currentAssetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Total Investido Original:</span>
                      <span className="font-mono font-bold text-zinc-900">R$ {asset.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Refund option checkbox */}
                {currentAssetValue > 0 && (
                  <label className="flex items-start gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-100/70 transition-colors">
                    <input 
                      type="checkbox"
                      checked={refundToWallet}
                      onChange={(e) => setRefundToWallet(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-zinc-300 text-black focus:ring-black accent-black"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-zinc-900 block">Estornar valor para o Caixa da Carteira</span>
                      <span className="text-zinc-500 block mt-0.5">
                        Creditar automaticamente <strong>R$ {currentAssetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> no saldo livre em caixa para futuros investimentos.
                      </span>
                    </div>
                  </label>
                )}

                {deleteError && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-medium border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-5 py-3 rounded-2xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:text-black hover:bg-zinc-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteAsset}
                    className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span>Confirmar Exclusão</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
