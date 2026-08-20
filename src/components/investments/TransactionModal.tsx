import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Check, Loader2, Save, Wallet, TrendingUp, 
  AlertCircle, ArrowDown, ArrowUp, ArrowRight, DollarSign, Calendar, FileText, ChevronRight, Plus, Minus
} from 'lucide-react';
import { AssetSearchResult, MarketDataService } from '../../services/MarketDataService';
import { PortfolioService } from '../../services/PortfolioService';
import { InvestmentCategory, TransactionType, InvestmentPriceSource } from '../../types';
import { auth } from '../../lib/firebase';
import { parseCurrencyInput } from '../../utils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  caixaBalance?: number;
  initialTab?: 'wallet' | 'asset';
}

const CATEGORIES: InvestmentCategory[] = [
  'Ações', 'FIIs', 'ETFs', 'BDRs', 'Tesouro Direto', 
  'CDB', 'LCI', 'LCA', 'Renda Fixa', 'Criptomoedas', 'Outros'
];

const TX_TYPES: TransactionType[] = [
  'COMPRA', 'VENDA', 'APORTE', 'RESGATE', 'DIVIDENDO', 
  'JCP', 'RENDIMENTO', 'JUROS', 'TAXA', 'BONIFICAÇÃO', 'DESDOBRAMENTO', 'AMORTIZAÇÃO'
];

export function TransactionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  caixaBalance = 0, 
  initialTab = 'wallet' 
}: TransactionModalProps) {
  const [modalMode, setModalMode] = useState<'wallet' | 'asset'>(initialTab);
  const [step, setStep] = useState<1 | 2>(1); // 1: Asset Selection, 2: Transaction Details
  
  // Wallet Direct Deposit / Withdraw State
  const [walletOperation, setWalletOperation] = useState<'APORTE' | 'RESGATE'>('APORTE');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDate, setWalletDate] = useState(new Date().toISOString().split('T')[0]);
  const [walletNote, setWalletNote] = useState('Depósito na Carteira');

  // Asset Form State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AssetSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InvestmentCategory>('Ações');
  const [priceSource, setPriceSource] = useState<InvestmentPriceSource>('API');

  // Transaction Form State
  const [txType, setTxType] = useState<TransactionType>('COMPRA');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [taxes, setTaxes] = useState('0');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setModalMode(initialTab);
      setStep(1);
      setWalletOperation('APORTE');
      setWalletAmount('');
      setWalletDate(new Date().toISOString().split('T')[0]);
      setWalletNote('Depósito na Carteira');
      setSearchQuery('');
      setTicker('');
      setName('');
      setCategory('Ações');
      setTxType('COMPRA');
      setDate(new Date().toISOString().split('T')[0]);
      setQuantity('');
      setUnitPrice('');
      setTaxes('0');
      setError('');
    }
  }, [isOpen, initialTab]);

  const handleSwitchWalletOperation = (op: 'APORTE' | 'RESGATE') => {
    setWalletOperation(op);
    setError('');
    if (op === 'APORTE') {
      setWalletNote('Depósito na Carteira');
    } else {
      setWalletNote('Saque / Retirada da Carteira');
    }
  };

  // Handle Search Debounce
  useEffect(() => {
    if (searchQuery.length >= 2 && searchQuery !== ticker) {
      setIsSearching(true);
      setShowDropdown(true);
      
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await MarketDataService.searchAssets(searchQuery);
          setSearchResults(results);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      }, 500);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
    
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, ticker]);

  const handleSelectAsset = async (asset: AssetSearchResult) => {
    const assetStock = asset.stock || '';
    const assetName = asset.name || '';
    
    setTicker(assetStock);
    setName(assetName);
    setSearchQuery(assetStock);
    setShowDropdown(false);
    setPriceSource('API');
    
    // Auto-detect category based on common patterns
    if (assetStock.endsWith('11')) setCategory('FIIs');
    else if (assetStock.endsWith('34') || assetStock.endsWith('39')) setCategory('BDRs');
    else setCategory('Ações');

    // Auto-fetch current price
    try {
      if (assetStock) {
        const quotes = await MarketDataService.getQuotes([assetStock]);
        if (quotes[assetStock]) {
          setUnitPrice(quotes[assetStock].price.toString());
        }
      }
    } catch (e) {
      console.warn("Could not fetch initial quote", e);
    }
  };

  const handleManualNext = () => {
    if (!ticker.trim()) {
      setError('Informe o código (ticker) do ativo.');
      return;
    }
    if (!name.trim()) {
      setError('Informe o nome do ativo.');
      return;
    }
    setError('');
    setStep(2);
  };

  // Handle Direct Wallet Deposit or Withdrawal
  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!auth.currentUser) {
      setError('Usuário não autenticado.');
      return;
    }

    const amount = parseCurrencyInput(walletAmount);
    if (isNaN(amount) || amount <= 0) {
      setError(walletOperation === 'APORTE' ? 'Informe um valor de aporte válido.' : 'Informe um valor de saque válido.');
      return;
    }

    if (walletOperation === 'RESGATE' && amount > (caixaBalance + 0.0001)) {
      setError(`Saldo insuficiente para saque. Saldo atual em carteira: R$ ${caixaBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Valor solicitado: R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await PortfolioService.processWalletTransaction(auth.currentUser.uid, amount, walletDate, walletOperation);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao processar movimentação na carteira.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Asset Transaction
  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!auth.currentUser) {
      setError('Usuário não autenticado.');
      return;
    }

    const q = parseCurrencyInput(quantity);
    const p = parseCurrencyInput(unitPrice);
    const t = parseCurrencyInput(taxes || '0');

    if (isNaN(q) || q <= 0) {
      setError('Quantidade inválida.');
      return;
    }
    if (isNaN(p) || p < 0) {
      setError('Preço unitário inválido.');
      return;
    }
    if (isNaN(t) || t < 0) {
      setError('Taxas inválidas.');
      return;
    }

    const totalCost = (q * p) + t;

    // CHECK WALLET BALANCE FOR ASSET PURCHASES
    if (txType === 'COMPRA' && ticker.toUpperCase() !== 'CAIXA') {
      if (caixaBalance < totalCost) {
        setError(`Saldo insuficiente na carteira (Saldo atual: R$ ${caixaBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Total necessário: R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Adicione saldo à sua carteira antes de realizar a compra.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Register Asset Transaction
      await PortfolioService.registerTransaction(
        auth.currentUser.uid,
        {
          ticker: ticker.toUpperCase(),
          name,
          category,
          priceSource
        },
        {
          type: txType,
          date,
          quantity: q,
          unitPrice: p,
          taxes: t
        }
      );

      // 2. Automate Wallet Giro (Caixa balance flow):
      if (ticker.toUpperCase() !== 'CAIXA') {
        if (txType === 'COMPRA') {
          // Deduct from Caixa
          await PortfolioService.processWalletTransaction(auth.currentUser.uid, totalCost, date, 'RESGATE');
        } else if (txType === 'VENDA') {
          // Add proceeds to Caixa
          const totalProceeds = Math.max(0, (q * p) - t);
          await PortfolioService.processWalletTransaction(auth.currentUser.uid, totalProceeds, date, 'APORTE');
        } else if (['DIVIDENDO', 'JCP', 'RENDIMENTO'].includes(txType)) {
          // Add dividend to Caixa
          const totalDividend = q * p;
          await PortfolioService.processWalletTransaction(auth.currentUser.uid, totalDividend, date, 'APORTE');
        }
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar movimentação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          {/* Backdrop click dismiss */}
          <div 
            className="absolute inset-0 z-0" 
            onClick={onClose}
          />

          {/* Bottom Sheet Drawer - Slides Up from Bottom occupying screen and aligned to Navbar width */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="relative z-10 w-full h-[92vh] sm:h-[88vh] bg-white rounded-t-[36px] sm:rounded-t-[44px] shadow-2xl flex flex-col overflow-hidden border-t border-x border-zinc-200"
          >
            {/* Top Drag Indicator Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-12 h-1.5 bg-zinc-300 rounded-full cursor-grab" onClick={onClose} />
            </div>

            {/* Header Aligned to Navbar Width */}
            <div className="w-full border-b border-zinc-100 bg-white shrink-0">
              <div className="w-full px-6 sm:px-10 xl:px-16 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-[#d4ff00] shadow-md">
                    {modalMode === 'wallet' ? <Wallet className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                      {modalMode === 'wallet' 
                        ? (walletOperation === 'APORTE' ? 'Aporte de Saldo na Carteira' : 'Saque / Retirada da Carteira')
                        : 'Nova Operação de Ativo'
                      }
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">
                      Saldo disponível para investimentos: <strong className="text-zinc-900 font-mono text-sm">R$ {caixaBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Mode Tab Pills in Header */}
                  <div className="hidden sm:flex items-center bg-zinc-100 p-1.5 rounded-2xl gap-1 border border-zinc-200/60">
                    <button
                      type="button"
                      onClick={() => { setModalMode('wallet'); setError(''); }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        modalMode === 'wallet'
                          ? 'bg-black text-white shadow-sm'
                          : 'text-zinc-600 hover:text-black hover:bg-zinc-200/50'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5 text-[#d4ff00]" />
                      <span>Saldo em Carteira (Caixa)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setModalMode('asset'); setError(''); }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        modalMode === 'asset'
                          ? 'bg-black text-white shadow-sm'
                          : 'text-zinc-600 hover:text-black hover:bg-zinc-200/50'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Comprar / Movimentar Ativo</span>
                    </button>
                  </div>

                  <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-black transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile Mode Tab Pills */}
              <div className="sm:hidden flex border-t border-zinc-100 bg-zinc-50 p-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setModalMode('wallet'); setError(''); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    modalMode === 'wallet'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 text-[#d4ff00]" />
                  <span>Saldo Caixa</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setModalMode('asset'); setError(''); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    modalMode === 'asset'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Operar Ativo</span>
                </button>
              </div>
            </div>

            {/* Content Body - Perfectly Aligned to Navbar Width (px-6 sm:px-10 xl:px-16) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fafafa]">
              <div className="w-full px-6 sm:px-10 xl:px-16 py-8">
                {modalMode === 'wallet' ? (
                  /* DIRECT WALLET DEPOSIT & WITHDRAW FORM */
                  <form onSubmit={handleWalletSubmit} className="w-full space-y-6 max-w-4xl mx-auto">
                    {/* Operation Type Switcher: Aporte vs Saque */}
                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-200/80 rounded-2xl border border-zinc-300/60">
                      <button
                        type="button"
                        onClick={() => handleSwitchWalletOperation('APORTE')}
                        className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all ${
                          walletOperation === 'APORTE'
                            ? 'bg-black text-white shadow-lg'
                            : 'text-zinc-600 hover:text-black hover:bg-zinc-100/60'
                        }`}
                      >
                        <ArrowDown className={`w-4 h-4 ${walletOperation === 'APORTE' ? 'text-[#d4ff00]' : 'text-emerald-500'}`} />
                        <span>Adicionar Saldo (Aporte)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSwitchWalletOperation('RESGATE')}
                        className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all ${
                          walletOperation === 'RESGATE'
                            ? 'bg-black text-white shadow-lg'
                            : 'text-zinc-600 hover:text-black hover:bg-zinc-100/60'
                        }`}
                      >
                        <ArrowUp className={`w-4 h-4 ${walletOperation === 'RESGATE' ? 'text-red-400' : 'text-red-500'}`} />
                        <span>Tirar Saldo (Saque / Resgate)</span>
                      </button>
                    </div>

                    {/* Top Callout Card */}
                    <div className="bg-[#000000] border border-zinc-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#161618] border border-zinc-800 flex items-center justify-center shrink-0">
                          {walletOperation === 'APORTE' ? (
                            <ArrowDown className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <ArrowUp className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">
                            {walletOperation === 'APORTE' 
                              ? 'Adicionar Saldo à sua Carteira' 
                              : 'Retirar / Sacar Saldo da Carteira'
                            }
                          </h4>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {walletOperation === 'APORTE'
                              ? 'O valor depositado ficará registrado como saldo líquido em caixa para compra de ações, fundos imobiliários e gestão de aportes.'
                              : 'O valor sacado será debitado do saldo livre em caixa para transferências externas ou despesas pessoais.'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl text-right shrink-0">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Saldo Atual em Caixa</span>
                        <span className="text-lg font-bold font-mono text-white">R$ {caixaBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Grid Form Fields */}
                    <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">
                            {walletOperation === 'APORTE' ? 'Valor do Aporte (R$)' : 'Valor do Saque / Retirada (R$)'}
                          </label>
                          {walletOperation === 'RESGATE' && (
                            <button
                              type="button"
                              onClick={() => setWalletAmount(caixaBalance > 0 ? caixaBalance.toString() : '')}
                              className="text-[11px] font-bold text-zinc-500 hover:text-black underline cursor-pointer"
                            >
                              Sacar todo o saldo (R$ {caixaBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-400">R$</span>
                          <input 
                            type="number"
                            step="any"
                            min="0.01"
                            required
                            placeholder="0,00"
                            value={walletAmount}
                            onChange={(e) => setWalletAmount(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-16 pr-6 py-4 text-2xl font-mono font-bold text-black outline-none focus:border-black focus:bg-white transition-all shadow-inner"
                          />
                        </div>

                        {/* Balance projection simulation */}
                        {parseCurrencyInput(walletAmount) > 0 && (
                          <div className="pt-2 px-1 flex items-center justify-between text-xs font-semibold">
                            <span className="text-zinc-500">Saldo projetado após {walletOperation === 'APORTE' ? 'o aporte' : 'o saque'}:</span>
                            <span className={`font-mono font-bold ${
                              walletOperation === 'RESGATE' && (parseCurrencyInput(walletAmount) > (caixaBalance + 0.0001))
                                ? 'text-red-600'
                                : 'text-zinc-900'
                            }`}>
                              R$ {(
                                walletOperation === 'APORTE'
                                  ? caixaBalance + parseCurrencyInput(walletAmount)
                                  : Math.max(0, caixaBalance - parseCurrencyInput(walletAmount))
                              ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">Data da Operação</label>
                          <div className="relative">
                            <input 
                              type="date" 
                              value={walletDate}
                              onChange={(e) => setWalletDate(e.target.value)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-black outline-none focus:border-black focus:bg-white transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">Origem / Destino / Descrição</label>
                          <input 
                            type="text" 
                            value={walletNote}
                            onChange={(e) => setWalletNote(e.target.value)}
                            placeholder={walletOperation === 'APORTE' ? "Ex: Salário mensal, TED, Pix, Rendimentos" : "Ex: Transferência conta corrente, Pix, Despesas"}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3.5 text-sm text-black outline-none focus:border-black focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-200 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-4">
                      <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3.5 rounded-2xl border border-zinc-200 text-sm text-zinc-600 font-bold hover:text-black hover:bg-zinc-100 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-black hover:bg-zinc-800 text-white font-black px-8 py-3.5 rounded-2xl text-sm flex items-center gap-2.5 transition-all shadow-xl disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : walletOperation === 'APORTE' ? (
                          <Save className="w-4 h-4 text-[#d4ff00]" />
                        ) : (
                          <ArrowUp className="w-4 h-4 text-red-400" />
                        )}
                        <span>
                          {walletOperation === 'APORTE' ? 'Confirmar Aporte no Caixa' : 'Confirmar Saque do Caixa'}
                        </span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ASSET OPERATION MULTI-STEP FORM */
                  <div className="w-full max-w-5xl mx-auto space-y-6">
                    {step === 1 ? (
                      <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-black">Passo 1: Selecionar o Ativo</h3>
                          <p className="text-xs text-zinc-500">Busque pela cotação do ativo na bolsa (B3) ou cadastre manualmente.</p>
                        </div>

                        {/* Search Input with Auto-complete */}
                        <div className="relative">
                          <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 mb-2 block">
                            Buscar Código (Ticker) ou Nome
                          </label>
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input 
                              type="text" 
                              placeholder="Ex: PETR4, VALE3, MXRF11, HGLG11, IVVB11, BTC..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onFocus={() => {
                                if (searchResults.length > 0) setShowDropdown(true);
                              }}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-10 py-3.5 text-base text-black outline-none focus:border-black focus:bg-white transition-all shadow-inner"
                            />
                            {isSearching && (
                              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 animate-spin" />
                            )}
                          </div>

                          {/* Search Dropdown Results */}
                          <AnimatePresence>
                            {showDropdown && searchResults.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto z-50 divide-y divide-zinc-100"
                              >
                                {searchResults.map((result, idx) => (
                                  <div 
                                    key={result.stock || `search-result-${idx}`}
                                    onClick={() => handleSelectAsset(result)}
                                    className="flex items-center gap-4 p-4 hover:bg-zinc-50 cursor-pointer transition-colors"
                                  >
                                    {result.logo ? (
                                      <img src={result.logo} alt={result.stock || 'Logo'} className="w-10 h-10 rounded-full object-cover border border-zinc-100 shadow-sm" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">{(result.stock || '??').substring(0,2)}</div>
                                    )}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-zinc-900 font-mono">{result.stock || 'Desconhecido'}</span>
                                      </div>
                                      <span className="text-xs text-zinc-500 block truncate">{result.name || 'Sem nome'}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Direct Manual Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-zinc-100">
                          <div className="space-y-2">
                            <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">Ticker / Código</label>
                            <input 
                              type="text" 
                              value={ticker}
                              onChange={(e) => setTicker(e.target.value.toUpperCase())}
                              placeholder="Ex: PETR4"
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm text-black outline-none focus:border-black focus:bg-white uppercase font-mono font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">Fonte de Cotação</label>
                            <select 
                              value={priceSource}
                              onChange={(e) => setPriceSource(e.target.value as InvestmentPriceSource)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm text-black outline-none focus:border-black focus:bg-white font-medium"
                            >
                              <option value="API">API Automática (Cotação em tempo real)</option>
                              <option value="MANUAL">Cotação Manual</option>
                              <option value="CALCULATED">Renda Fixa / Calculada</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">Nome do Ativo</label>
                          <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Petróleo Brasileiro S.A. Petrobras"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm text-black outline-none focus:border-black focus:bg-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">Categoria do Ativo</label>
                          <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                                  category === cat 
                                    ? 'bg-black border-black text-white shadow-sm' 
                                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        {error && (
                          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-200 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                            <span>{error}</span>
                          </div>
                        )}

                        <div className="pt-4 flex justify-end gap-4 border-t border-zinc-100">
                          <button 
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3.5 rounded-2xl border border-zinc-200 text-sm text-zinc-600 font-bold hover:text-black hover:bg-zinc-100 transition-all"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="button"
                            onClick={handleManualNext}
                            className="bg-black hover:bg-zinc-800 text-white font-bold px-8 py-3.5 rounded-2xl text-sm flex items-center gap-2 transition-all shadow-xl"
                          >
                            <span>Avançar para Detalhes</span>
                            <ArrowRight className="w-4 h-4 text-[#d4ff00]" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* STEP 2: TRANSACTION DETAILS FORM */
                      <form onSubmit={handleAssetSubmit} className="space-y-6">
                        {/* Selected Asset Banner */}
                        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center font-mono font-black text-sm text-zinc-900 border border-zinc-200">
                              {ticker.substring(0, 2)}
                            </div>
                            <div>
                              <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider block">{category}</span>
                              <h4 className="font-bold text-zinc-900 font-mono text-base">{ticker} — {name}</h4>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setStep(1)}
                            className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 transition-colors"
                          >
                            Trocar Ativo
                          </button>
                        </div>

                        {/* Transaction Inputs Card */}
                        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">Tipo de Operação</label>
                              <select 
                                value={txType}
                                onChange={(e) => setTxType(e.target.value as TransactionType)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3.5 text-sm text-black outline-none focus:border-black focus:bg-white font-bold"
                              >
                                {TX_TYPES.filter(t => t !== 'APORTE' && t !== 'RESGATE').map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">Data da Operação</label>
                              <input 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-black outline-none focus:border-black focus:bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">Quantidade</label>
                              <input 
                                type="number" 
                                step="any"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold text-black outline-none focus:border-black focus:bg-white"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">Preço Unitário (R$)</label>
                              <input 
                                type="number" 
                                step="any"
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(e.target.value)}
                                placeholder="R$ 0,00"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold text-black outline-none focus:border-black focus:bg-white"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 block">Taxas / Emolumentos (R$)</label>
                              <input 
                                type="number" 
                                step="any"
                                value={taxes}
                                onChange={(e) => setTaxes(e.target.value)}
                                placeholder="R$ 0,00"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold text-black outline-none focus:border-black focus:bg-white"
                              />
                            </div>
                          </div>

                          {/* Impact & Giro Calculation Box */}
                          {(() => {
                            const q = parseFloat(quantity.replace(',', '.')) || 0;
                            const p = parseFloat(unitPrice.replace(',', '.')) || 0;
                            const t = parseFloat(taxes.replace(',', '.') || '0') || 0;
                            const total = (q * p) + t;
                            const isInsufficient = txType === 'COMPRA' && total > caixaBalance;

                            return (
                              <div className={`p-6 rounded-3xl text-white shadow-xl ${isInsufficient ? 'bg-red-950 border border-red-800' : 'bg-[#000000] border border-zinc-800'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div>
                                    <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Total Calculado da Operação</span>
                                    <div className="font-mono font-black text-2xl sm:text-3xl mt-1">
                                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[11px] text-zinc-400 block">Saldo Atual em Carteira</span>
                                    <span className="font-mono font-bold text-base text-zinc-300">R$ {caixaBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                </div>

                                {txType === 'COMPRA' && (
                                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
                                    <span className="text-zinc-400">Impacto no Caixa da Carteira:</span>
                                    <span className={isInsufficient ? 'text-red-400 font-bold font-mono text-sm' : 'text-[#d4ff00] font-bold font-mono text-sm'}>
                                      {isInsufficient ? 'Saldo Insuficiente na Carteira!' : `- R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </span>
                                  </div>
                                )}
                                {txType === 'VENDA' && (
                                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
                                    <span className="text-zinc-400">Impacto no Caixa da Carteira:</span>
                                    <span className="text-emerald-400 font-bold font-mono text-sm">
                                      + R$ {Math.max(0, (q * p) - t).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Creditado)
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-200 flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                              <span>{error}</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Submit Action */}
                        <div className="pt-2 flex items-center justify-end gap-4">
                          <button 
                            type="button"
                            onClick={() => setStep(1)}
                            className="px-6 py-3.5 rounded-2xl border border-zinc-200 text-sm text-zinc-600 font-bold hover:text-black hover:bg-zinc-100 transition-all"
                          >
                            Voltar ao Passo 1
                          </button>
                          <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-black hover:bg-zinc-800 text-white font-black px-8 py-3.5 rounded-2xl text-sm flex items-center gap-2.5 transition-all shadow-xl disabled:opacity-50"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#d4ff00]" />}
                            <span>Confirmar Operação</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
