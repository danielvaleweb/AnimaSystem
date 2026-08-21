import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Copy, Check, ExternalLink, 
  Eye, Zap, AlertTriangle, Globe, X, Settings, Phone
} from 'lucide-react';
import { ClientData } from '../../types';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface ClientGuardModalProps {
  client: ClientData;
  onClose: () => void;
  onStatusChanged?: (newStatus: 'active' | 'suspended') => void;
}

export function ClientGuardModal({ client, onClose, onStatusChanged }: ClientGuardModalProps) {
  const [currentStatus, setCurrentStatus] = useState<'active' | 'suspended'>(
    client.status === 'suspended' ? 'suspended' : 'active'
  );
  const [saving, setSaving] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-p5xzmtslhtg7gruyoqvdo4-373656924597.us-west2.run.app';
  const dynamicScriptTag = `<script src="${currentOrigin}/api/guard.js?client=${client.id}"></script>`;

  const standaloneScript = `<script>
(function(){
  var cId = "${client.id}";
  var origin = "${currentOrigin}";
  var s = document.createElement("script");
  s.src = origin + "/api/guard.js?client=" + encodeURIComponent(cId);
  s.async = true;
  document.head.appendChild(s);
})();
</script>`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleToggleStatus = async (newStatus: 'active' | 'suspended') => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'clients', client.id), {
        status: newStatus
      });
      setCurrentStatus(newStatus);
      if (onStatusChanged) onStatusChanged(newStatus);
    } catch (e) {
      console.error("Erro ao atualizar status do cliente:", e);
      alert("Não foi possível atualizar o status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans text-left">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200 overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${currentStatus === 'suspended' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {currentStatus === 'suspended' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                Proteção & Bloqueio Remoto (Guard)
              </h2>
              <p className="text-xs text-zinc-500">
                Cliente: <span className="font-semibold text-zinc-700">{client.name}</span>
                {client.domain && <span className="ml-1 text-zinc-400">({client.domain})</span>}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* Status Switcher Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
            currentStatus === 'suspended'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div>
              <div className="flex items-center gap-2 font-bold text-sm">
                {currentStatus === 'suspended' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                    Status Atual: SITE SUSPENSO (BLOQUEADO)
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Status Atual: SITE ATIVO (LIBERADO)
                  </>
                )}
              </div>
              <p className="text-xs mt-1 opacity-80">
                {currentStatus === 'suspended'
                  ? 'A tela branca de aviso com o logo AnimaSystem e carinha triste está ativa no site do cliente.'
                  : 'O site do cliente funciona normalmente sem nenhuma interrupção.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentStatus === 'suspended' ? (
                <button
                  disabled={saving}
                  onClick={() => handleToggleStatus('active')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {saving ? 'Liberando...' : 'Reativar Site (Desbloquear)'}
                </button>
              ) : (
                <button
                  disabled={saving}
                  onClick={() => handleToggleStatus('suspended')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  {saving ? 'Suspendendo...' : 'Suspender Site Agora'}
                </button>
              )}
            </div>
          </div>

          {/* Action to preview */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-700">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900">Pré-visualizar Tela de Suspensão</h4>
                <p className="text-[11px] text-zinc-500">Veja exatamente o que aparece na tela do cliente quando ele estiver suspenso.</p>
              </div>
            </div>
            <button
              onClick={() => setShowLivePreview(true)}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Testar Visual
            </button>
          </div>

          {/* How to configure on AntiGravity / Site */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-600" />
                Como instalar no site do cliente (AntiGravity / HTML / WordPress / React)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Basta colar a tag de script abaixo no <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono text-[11px]">&lt;head&gt;</code> ou no <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono text-[11px]">index.html</code> do site do cliente:
              </p>
            </div>

            {/* Tag Principal Recomendada */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-700">
                <span>Tag Recomendada (Faixa de Vencimento + Bloqueio Automático):</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Automático &amp; Inteligente</span>
              </div>
              <div className="relative bg-zinc-950 text-zinc-200 p-3.5 rounded-xl font-mono text-xs overflow-x-auto border border-zinc-800 flex items-center justify-between group">
                <code className="text-emerald-400 select-all whitespace-pre-wrap">{dynamicScriptTag}</code>
                <button
                  onClick={() => handleCopy(dynamicScriptTag, 'tag')}
                  className="ml-3 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-sans flex items-center gap-1.5 transition-all shrink-0 cursor-pointer self-start"
                >
                  {copiedType === 'tag' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'tag' ? 'Copiado!' : 'Copiar Tag'}</span>
                </button>
              </div>
            </div>

            {/* Snippet Standalone Direct Firestore (Universal & 100% Online) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-700">
                <span>Script Assíncrono para AntiGravity:</span>
                <span className="text-[10px] text-zinc-400">Compatibilidade Total</span>
              </div>
              <div className="relative bg-zinc-950 text-zinc-200 p-3.5 rounded-xl font-mono text-xs overflow-x-auto border border-zinc-800 flex items-center justify-between group max-h-36">
                <code className="text-zinc-300 select-all whitespace-pre-wrap">{standaloneScript}</code>
                <button
                  onClick={() => handleCopy(standaloneScript, 'standalone')}
                  className="ml-3 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-sans flex items-center gap-1.5 transition-all shrink-0 cursor-pointer self-start"
                >
                  {copiedType === 'standalone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'standalone' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* AntiGravity step-by-step instructions */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Regras Automáticas de Vencimento e Suspensão:
            </h5>
            <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside">
              <li><strong>7 dias antes do vencimento:</strong> Uma faixa vermelha é exibida no topo do site com o texto <em>"Faltam X dias para o vencimento"</em> e o botão <strong>"Pague agora"</strong>.</li>
              <li><strong>No dia do vencimento:</strong> A faixa avisa <em>"Seu plano vence hoje!"</em> com link direto de pagamento.</li>
              <li><strong>Atraso de 1 a 7 dias (Tolerância):</strong> A faixa passa a exibir: <em>"Seu plano venceu há X dias. Evite a suspensão do seu serviço! (Restam Y dias de tolerância)"</em>.</li>
              <li><strong>No 8º dia de atraso:</strong> O site entra em <strong>tela cheia de Manutenção Preventiva</strong> com botão direto de suporte no WhatsApp (+55 24 98100-0306), de forma discreta e profissional.</li>
              <li><strong>Reativação Imediata:</strong> Assim que o cliente pagar a renovação (PIX, Boleto ou Cartão), o sistema prorroga a data e o site é desbloqueado no mesmo instante!</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </motion.div>

      {/* Full Live Preview Modal */}
      <AnimatePresence>
        {showLivePreview && (
          <div className="fixed inset-0 z-60 bg-[#050505] flex flex-col items-center justify-center p-6 text-center font-sans overflow-hidden">
            {/* Ambient Moving Green Glows - 5% Opacity */}
            <motion.div 
              animate={{ 
                x: [0, 140, -90, 0],
                y: [0, -90, 120, 0],
                scale: [1, 1.25, 0.9, 1]
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-[10%] -left-[10%] w-[800px] h-[800px] rounded-full bg-[#D7FE03]/5 blur-[90px] pointer-events-none"
            />
            <motion.div 
              animate={{ 
                x: [0, -130, 100, 0],
                y: [0, 100, -80, 0],
                scale: [1, 1.3, 0.88, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-[15%] -right-[10%] w-[850px] h-[850px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none"
            />

            {/* Close preview button */}
            <button
              onClick={() => setShowLivePreview(false)}
              className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md border border-white/10 z-20"
            >
              <X className="w-4 h-4" />
              Fechar Pré-visualização
            </button>

            <div className="relative z-10 max-w-[500px] w-full flex flex-col items-center gap-5">
              {/* Brand Logo AnimaSystem with Lightning Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                <div className="w-6 h-6 rounded-full bg-[#D7FE03] flex items-center justify-center shadow-[0_0_12px_rgba(215,254,3,0.5)]">
                  <Zap className="w-3.5 h-3.5 text-black fill-black" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-white">
                  <span className="text-zinc-400 font-normal">Anima</span>System
                </span>
              </div>

              {/* 3 Connected Industrial Gears Cluster in Neon Green (#D7FE03) identical to print */}
              <div className="w-[106px] h-[100px] relative text-[#D7FE03] drop-shadow-[0_0_22px_rgba(215,254,3,0.6)] my-1">
                {/* Large Gear (Top-Left) - 12 teeth */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                  className="w-[62px] h-[62px] absolute top-0 left-[6px] origin-center"
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <path fill="currentColor" fillRule="evenodd" d="M 86.00 50.00 A 36 36 0 0 1 85.87 53.01 L 97.41 57.51 A 48 48 0 0 1 94.81 67.20 L 82.57 65.33 A 36 36 0 0 1 81.18 68.00 A 36 36 0 0 1 79.56 70.55 L 87.30 80.21 A 48 48 0 0 1 80.21 87.30 L 70.55 79.56 A 36 36 0 0 1 68.00 81.18 A 36 36 0 0 1 65.33 82.57 L 67.20 94.81 A 48 48 0 0 1 57.51 97.41 L 53.01 85.87 A 36 36 0 0 1 50.00 86.00 A 36 36 0 0 1 46.99 85.87 L 42.49 97.41 A 48 48 0 0 1 32.80 94.81 L 34.67 82.57 A 36 36 0 0 1 32.00 81.18 A 36 36 0 0 1 29.45 79.56 L 19.79 87.30 A 48 48 0 0 1 12.70 80.21 L 20.44 70.55 A 36 36 0 0 1 18.82 68.00 A 36 36 0 0 1 17.43 65.33 L 5.19 67.20 A 48 48 0 0 1 2.59 57.51 L 14.13 53.01 A 36 36 0 0 1 14.00 50.00 A 36 36 0 0 1 14.13 46.99 L 2.59 42.49 A 48 48 0 0 1 5.19 32.80 L 17.43 34.67 A 36 36 0 0 1 18.82 32.00 A 36 36 0 0 1 20.44 29.45 L 12.70 19.79 A 48 48 0 0 1 19.79 12.70 L 29.45 20.44 A 36 36 0 0 1 32.00 18.82 A 36 36 0 0 1 34.67 17.43 L 32.80 5.19 A 48 48 0 0 1 42.49 2.59 L 46.99 14.13 A 36 36 0 0 1 50.00 14.00 A 36 36 0 0 1 53.01 14.13 L 57.51 2.59 A 48 48 0 0 1 67.20 5.19 L 65.33 17.43 A 36 36 0 0 1 68.00 18.82 A 36 36 0 0 1 70.55 20.44 L 80.21 12.70 A 48 48 0 0 1 87.30 19.79 L 79.56 29.45 A 36 36 0 0 1 81.18 32.00 A 36 36 0 0 1 82.57 34.67 L 94.81 32.80 A 48 48 0 0 1 97.41 42.49 L 85.87 46.99 A 36 36 0 0 1 86.00 50.00 Z M 50 29 A 21 21 0 1 0 50 71 A 21 21 0 1 0 50 29 Z" />
                  </svg>
                </motion.div>

                {/* Medium Gear (Bottom-Right) - 10 teeth */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6.75, repeat: Infinity, ease: "linear" }}
                  className="w-[45px] h-[45px] absolute bottom-[6px] right-[4px] origin-center"
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <path fill="currentColor" fillRule="evenodd" d="M 84.00 50.00 A 34 34 0 0 1 83.83 53.41 L 97.15 58.99 A 48 48 0 0 1 93.43 70.44 L 79.37 67.12 A 34 34 0 0 1 77.51 69.98 A 34 34 0 0 1 75.36 72.64 L 82.86 84.99 A 48 48 0 0 1 73.12 92.06 L 63.70 81.12 A 34 34 0 0 1 60.51 82.34 A 34 34 0 0 1 57.21 83.23 L 56.02 97.62 A 48 48 0 0 1 43.98 97.62 L 42.79 83.23 A 34 34 0 0 1 39.49 82.34 A 34 34 0 0 1 36.30 81.12 L 26.88 92.06 A 48 48 0 0 1 17.14 84.99 L 24.64 72.64 A 34 34 0 0 1 22.49 69.98 A 34 34 0 0 1 20.63 67.12 L 6.57 70.44 A 48 48 0 0 1 2.85 58.99 L 16.17 53.41 A 34 34 0 0 1 16.00 50.00 A 34 34 0 0 1 16.17 46.59 L 2.85 41.01 A 48 48 0 0 1 6.57 29.56 L 20.63 32.88 A 34 34 0 0 1 22.49 30.02 A 34 34 0 0 1 24.64 27.36 L 17.14 15.01 A 48 48 0 0 1 26.88 7.94 L 36.30 18.88 A 34 34 0 0 1 39.49 17.66 A 34 34 0 0 1 42.79 16.77 L 43.98 2.38 A 48 48 0 0 1 56.02 2.38 L 57.21 16.77 A 34 34 0 0 1 60.51 17.66 A 34 34 0 0 1 63.70 18.88 L 73.12 7.94 A 48 48 0 0 1 82.86 15.01 L 75.36 27.36 A 34 34 0 0 1 77.51 30.02 A 34 34 0 0 1 79.37 32.88 L 93.43 29.56 A 48 48 0 0 1 97.15 41.01 L 83.83 46.59 A 34 34 0 0 1 84.00 50.00 Z M 50 31 A 19 19 0 1 0 50 69 A 19 19 0 1 0 50 31 Z" />
                  </svg>
                </motion.div>

                {/* Small Gear (Bottom-Left) - 8 teeth */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5.4, repeat: Infinity, ease: "linear" }}
                  className="w-[37px] h-[37px] absolute bottom-0 left-[18px] origin-center"
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <path fill="currentColor" fillRule="evenodd" d="M 82.00 50.00 A 32 32 0 0 1 81.75 54.01 L 96.67 61.21 A 48 48 0 0 1 90.93 75.08 L 75.28 69.61 A 32 32 0 0 1 72.63 72.63 A 32 32 0 0 1 69.61 75.28 L 75.08 90.93 A 48 48 0 0 1 61.21 96.67 L 54.01 81.75 A 32 32 0 0 1 50.00 82.00 A 32 32 0 0 1 45.99 81.75 L 38.79 96.67 A 48 48 0 0 1 24.92 90.93 L 30.39 75.28 A 32 32 0 0 1 27.37 72.63 A 32 32 0 0 1 24.72 69.61 L 9.07 75.08 A 48 48 0 0 1 3.33 61.21 L 18.25 54.01 A 32 32 0 0 1 18.00 50.00 A 32 32 0 0 1 18.25 45.99 L 3.33 38.79 A 48 48 0 0 1 9.07 24.92 L 24.72 30.39 A 32 32 0 0 1 27.37 27.37 A 32 32 0 0 1 30.39 24.72 L 24.92 9.07 A 48 48 0 0 1 38.79 3.33 L 45.99 18.25 A 32 32 0 0 1 50.00 18.00 A 32 32 0 0 1 54.01 18.25 L 61.21 3.33 A 48 48 0 0 1 75.08 9.07 L 69.61 24.72 A 32 32 0 0 1 72.63 27.37 A 32 32 0 0 1 75.28 30.39 L 90.93 24.92 A 48 48 0 0 1 96.67 38.79 L 81.75 45.99 A 32 32 0 0 1 82.00 50.00 Z M 50 33 A 17 17 0 1 0 50 67 A 17 17 0 1 0 50 33 Z" />
                  </svg>
                </motion.div>
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Site em Manutenção
              </h1>

              <p className="text-xs text-zinc-400 max-w-md -mt-1 leading-relaxed">
                Este site encontra-se temporariamente em manutenção preventiva para atualização de recursos e estabilidade dos serviços.
              </p>

              {/* Action Button */}
              <button 
                onClick={() => alert("Exemplo de clique do cliente: Abre WhatsApp direto com o suporte (+55 24 98100-0306).")}
                className="mt-1 inline-flex items-center justify-center gap-2.5 bg-[#D7FE03] hover:bg-[#e5ff33] text-black font-bold text-sm px-8 py-3.5 rounded-full transition-all shadow-[0_4px_20px_rgba(215,254,3,0.35),0_0_35px_rgba(215,254,3,0.2)] hover:shadow-[0_6px_28px_rgba(215,254,3,0.55),0_0_45px_rgba(215,254,3,0.4)] hover:-translate-y-0.5 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-black fill-black" />
                <span>Falar com o Suporte</span>
              </button>

              {/* Footer text */}
              <div className="mt-4 text-[11px] text-zinc-500 uppercase tracking-wider">
                AnimaSystem • Sistemas personalizados para seu negócio!
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
