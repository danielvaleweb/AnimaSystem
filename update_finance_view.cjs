const fs = require('fs');
let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

// 1. Add useNotification import
if (!content.includes("useNotification")) {
  content = content.replace(
    "import { motion, AnimatePresence } from 'motion/react';",
    "import { motion, AnimatePresence } from 'motion/react';\nimport { useNotification } from '../NotificationContext';\nimport { cn } from '../../utils';"
  );
}

// 2. Add hook and state
content = content.replace(
  "export function FinanceView({ onNavigate }: { onNavigate?: (view: any, id?: string) => void }) {",
  `export function FinanceView({ onNavigate }: { onNavigate?: (view: any, id?: string) => void }) {
  const { showSuccess, showError } = useNotification();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    const bqProjectId = localStorage.getItem('bqProjectId');
    const bqDatasetId = localStorage.getItem('bqDatasetId');
    const bqTableId = localStorage.getItem('bqTableId');

    if (!bqProjectId || !bqDatasetId || !bqTableId) {
      showError("Configuração ausente", "Configure a sincronização do BigQuery nas Configurações do sistema.");
      return;
    }

    setIsSyncing(true);
    try {
      const url = \`/api/gcp/billing-sync-bigquery?bqProjectId=\${encodeURIComponent(bqProjectId)}&bqDatasetId=\${encodeURIComponent(bqDatasetId)}&bqTableId=\${encodeURIComponent(bqTableId)}\`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.details || "Falha ao sincronizar com o BigQuery.");
      }

      showSuccess("Sincronização concluída", "Dados financeiros atualizados com sucesso.");
    } catch (err: any) {
      console.error(err);
      showError("Erro na sincronização", err.message || "Erro desconhecido");
    } finally {
      setIsSyncing(false);
    }
  };`
);

// 3. Update the button
const oldButton = `<button 
          onClick={() => {
            // Sincronizar logic here
            alert("Sincronização financeira iniciada...");
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all w-full sm:w-auto text-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Sincronizar Financeiro
        </button>`;

const newButton = `<button 
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all w-full sm:w-auto text-sm cursor-pointer"
        >
          <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          {isSyncing ? "Atualizando..." : "Atualizar dados"}
        </button>`;

content = content.replace(oldButton, newButton);

fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
