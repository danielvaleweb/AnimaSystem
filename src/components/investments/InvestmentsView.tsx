import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign, Wallet, 
  ArrowUpRight, BarChart3, Loader2, Sparkles, AlertCircle, Save, X 
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useNotification } from '../NotificationContext';

interface Investment {
  id: string;
  name: string;
  ticker: string;
  classe: string;
  corretora: string;
  quantidade: number;
  precoMedio: number;
  precoAtual: number;
  proventos: number;
  value: number; // For sorting and total (current total value)
  valorInvestido: number;
  changePercent: number; // e.g. +4.21 or -1.02
  logoType: 'black' | 'green' | 'white'; // card layout style as seen in print
  ownerId: string;
}

export function InvestmentsView() {
  const { showSuccess, showError } = useNotification();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [classe, setClasse] = useState('');
  const [corretora, setCorretora] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [precoMedio, setPrecoMedio] = useState('');
  const [precoAtual, setPrecoAtual] = useState('');
  const [proventos, setProventos] = useState('');
  const [logoType, setLogoType] = useState<'black' | 'green' | 'white'>('black');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'investments'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Investment));
      setInvestments(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error loading investments:", error);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setTicker('');
    setClasse('');
    setCorretora('');
    setQuantidade('');
    setPrecoMedio('');
    setPrecoAtual('');
    setProventos('');
    setLogoType('black');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inv: Investment) => {
    setEditingId(inv.id);
    setName(inv.name);
    setTicker(inv.ticker || inv.name);
    setClasse(inv.classe || '');
    setCorretora(inv.corretora || '');
    setQuantidade((inv.quantidade || 0).toString());
    setPrecoMedio((inv.precoMedio || 0).toString());
    setPrecoAtual((inv.precoAtual || 0).toString());
    setProventos((inv.proventos || 0).toString());
    setLogoType(inv.logoType);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (!name.trim() || !quantidade || !precoMedio) {
      showError("Campos necessários", "Por favor, preencha Nome, Quantidade e Preço Médio.");
      return;
    }

    setIsSaving(true);
    try {
      const numQuantidade = parseFloat(quantidade) || 0;
      const numPrecoMedio = parseFloat(precoMedio) || 0;
      const numPrecoAtual = parseFloat(precoAtual) || numPrecoMedio; // default to precoMedio if not set
      const numProventos = parseFloat(proventos) || 0;
      
      const calcValorInvestido = numQuantidade * numPrecoMedio;
      const calcValorAtual = numQuantidade * numPrecoAtual;
      
      let calcChange = 0;
      if (calcValorInvestido > 0) {
        calcChange = ((calcValorAtual - calcValorInvestido + numProventos) / calcValorInvestido) * 100;
      }
      
      const payload = {
        name: name.trim().toUpperCase(),
        ticker: name.trim().toUpperCase(), // Keep ticker same as name for backward compatibility
        classe: classe.trim(),
        corretora: corretora.trim(),
        quantidade: numQuantidade,
        precoMedio: numPrecoMedio,
        precoAtual: numPrecoAtual,
        proventos: numProventos,
        valorInvestido: calcValorInvestido,
        value: calcValorAtual, // the current value
        changePercent: calcChange,
        logoType,
        ownerId: auth.currentUser.uid
      };

      if (editingId) {
        await updateDoc(doc(db, 'investments', editingId), payload);
        showSuccess("Investimento atualizado", "Alterações salvas com sucesso!");
      } else {
        await addDoc(collection(db, 'investments'), payload);
        showSuccess("Investimento adicionado", "Nova alocação registrada com sucesso!");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving investment:", err);
      showError("Erro", "Não foi possível salvar os dados do investimento.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este investimento?")) return;
    
    try {
      await deleteDoc(doc(db, 'investments', id));
      showSuccess("Removido", "Investimento excluído com sucesso.");
    } catch (err) {
      console.error(err);
      showError("Erro", "Não foi possível remover o investimento.");
    }
  };

  const totalPortfolio = investments.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-xs uppercase font-bold tracking-widest text-zinc-500">Buscando Carteira...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full" style={{ fontFamily: 'Urbanist, sans-serif' }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-accent" />
            Investimentos
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Gerencie as alocações e rendimentos para alimentar os cards dinâmicos do seu Dashboard.
          </p>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="bg-accent hover:bg-[#c4e602] text-zinc-950 font-black px-5 py-3 rounded-full flex items-center gap-2 text-sm transition-all shadow-md cursor-pointer hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Registrar Alocação
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-accent" />
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total da Carteira</p>
          <h3 className="text-3xl font-black text-black mt-2 font-mono">
            R$ {totalPortfolio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Soma das 3 maiores alocações de destaque</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Melhor Rendimento</p>
          {investments.length > 0 ? (
            (() => {
              const best = [...investments].sort((a,b) => b.changePercent - a.changePercent)[0];
              return (
                <>
                  <h3 className="text-3xl font-black text-emerald-600 mt-2 font-mono">
                    +{best.changePercent.toFixed(2)}%
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">{best.name} ({best.ticker})</p>
                </>
              );
            })()
          ) : (
            <p className="text-xs text-zinc-600 mt-3">Nenhum ativo registrado</p>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500" />
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Ativos Ativos</p>
          <h3 className="text-3xl font-black text-black mt-2 font-mono">
            {investments.length}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Ativos cadastrados no painel</p>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-3xl space-y-4">
          <Sparkles className="w-12 h-12 text-zinc-700 mx-auto animate-pulse" />
          <h3 className="text-zinc-700 font-bold">Nenhum investimento registrado</h3>
          <p className="text-zinc-500 text-xs max-w-sm mx-auto">
            Adicione seus investimentos para que eles apareçam empilhados no design "Lumin" no seu Dashboard.
          </p>
          <button 
            onClick={handleOpenAddModal}
            className="text-accent hover:underline text-xs font-bold uppercase tracking-wider"
          >
            Adicionar Primeiro Ativo
          </button>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 text-xs uppercase font-extrabold tracking-wider">
                  <th className="py-4 px-6">Ativo / Nome</th>
                  <th className="py-4 px-6">Classe / Corretora</th>
                  <th className="py-4 px-6">Valor Atual</th>
                  <th className="py-4 px-6">Rendimento Mensal</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/45 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                          inv.logoType === 'black' ? 'bg-black text-white' : 
                          inv.logoType === 'green' ? 'bg-[#D7FE03] text-black' : 'bg-white text-black'
                        }`}>
                          {inv.name.charAt(0)}
                        </div>
                        <span className="font-bold text-zinc-800">{inv.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-zinc-500 font-mono text-sm">
                      <div className="flex flex-col">
                        <span>{inv.classe || '-'}</span>
                        <span className="text-[10px] text-zinc-400">{inv.corretora || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-zinc-800 font-bold font-mono">
                      <div className="flex flex-col">
                        <span>R$ {(inv.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-zinc-500 font-light">Inv: R$ {(inv.valorInvestido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <span className={`flex items-center gap-1 font-bold text-sm ${inv.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {inv.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {inv.changePercent >= 0 ? '+' : ''}{inv.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenEditModal(inv)}
                          className="p-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-500 hover:text-black transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-red-500/10 text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal / Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md shadow-sm overflow-hidden animate-fade-in text-left">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-white/40">
              <h3 className="font-black text-black text-lg tracking-tight">
                {editingId ? "Editar Investimento" : "Adicionar Alocação"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-500 hover:text-black transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Nome (Ex: TSLA)</label>
                <input 
                  type="text" 
                  placeholder="Ex: TSLA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40 uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Classe</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Ação, FII"
                    value={classe}
                    onChange={(e) => setClasse(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Corretora</label>
                  <input 
                    type="text" 
                    placeholder="Ex: XP, Clear"
                    value={corretora}
                    onChange={(e) => setCorretora(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Quantidade</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="0"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Preço Médio</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="R$ 0,00"
                    value={precoMedio}
                    onChange={(e) => setPrecoMedio(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Val. Investido</label>
                  <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-500 outline-none truncate">
                    R$ {((parseFloat(quantidade)||0) * (parseFloat(precoMedio)||0)).toLocaleString('pt-BR', {minimumFractionDigits:2})}
                  </div>
                </div>
              </div>
              
              

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-200 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-500 font-bold hover:text-black transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-accent hover:bg-[#c4e602] text-zinc-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 animate-pulse"
                >
                  {isSaving ? <Loader2 className="w-3 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Salvar Ativo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
