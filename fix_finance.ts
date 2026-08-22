import fs from 'fs';
let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

const isSyncingMatch = `  const [isSyncing, setIsSyncing] = useState(false);
  
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
  };`;

content = content.replace(isSyncingMatch, '');

const buttonMatch = `        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all w-full sm:w-auto text-sm cursor-pointer"
        >
          <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          {isSyncing ? "Atualizando..." : "Atualizar dados"}
        </button>`;

content = content.replace(buttonMatch, '');

fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
