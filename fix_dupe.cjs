const fs = require('fs');
let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

// The replacement script accidentally created two grids or injected the old grid again.
// Let's find exactly where it duplicated.
// It seems there are two blocks of `Card 1: Custo Google Cloud` inside `Cards de Status do Topo (NOC Hub Widgets)`

const gridStart = '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">';
const parts = content.split(gridStart);

if (parts.length > 1) {
  let c2 = parts[1];
  
  // We need to look for the second occurrence of `{/* Card 1: Custo Google Cloud */}`
  // Let's just remove the first redundant one or just rewrite the entire grid to be safe and clean.
  
  // Actually, I can just replace the whole `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">` up to its closing `</div>` that is before `      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`
  
  const endOfGrid = c2.indexOf('      {/* MAIN CONTENT GRID */}');
  
  let newGrid = `
        {/* Card 1: Custo Google Cloud */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-center min-h-[110px] relative overflow-hidden group select-none">
          <span className="text-zinc-500 text-xs font-medium mb-1.5 block flex items-center justify-between">
            <span>Custo da Infra (GCP)</span>
            {selectedClient?.firebaseProjectId && (
              <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Faturamento</span>
            )}
          </span>
          {(() => {
            const costs = calculateTotalCost();
            const realBillingCost = selectedClient?.gcpBillingCost;
            return (
              <div className="space-y-1.5">
                {realBillingCost !== undefined ? (
                  <div>
                    <div className="text-emerald-600 font-extrabold text-xl font-mono leading-none flex items-baseline gap-1.5">
                      <span>R$ {realBillingCost.toFixed(2)}</span>
                      <span className="text-[10px] text-emerald-500 font-medium bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-sans uppercase">Fatura Real</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1 flex flex-col gap-0.5">
                      <div>
                        <span className="text-zinc-500">Período:</span> {selectedClient?.gcpBillingPeriod || 'Mês atual'}
                      </div>
                      <div>
                        <span className="text-zinc-500">Estimado real-time:</span> <span className="text-zinc-700 font-mono">R$ {costs.currentBRL.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-emerald-600 font-extrabold text-lg sm:text-xl font-mono">
                      R$ {costs.currentBRL.toFixed(4)}
                    </div>
                    {costs.projectedBRL > costs.currentBRL && (
                      <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                        <span className="text-zinc-500">Previsto (Mês):</span>
                        <span className="text-emerald-500 font-medium font-mono">R$ {costs.projectedBRL.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                      <span>(Sem sincronização de faturamento CSV)</span>
                    </div>
                  </div>
                )}
                {!selectedClient?.firebaseProjectId && (
                  <div className="text-[10px] text-zinc-500">
                    Sem Firebase Project ID
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Card 2: Última checagem */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center min-h-[96px] relative overflow-hidden group select-none">
          <span className="text-zinc-400 text-xs font-medium mb-1.5 block">Última checagem</span>
          <div className="text-white font-bold text-lg flex items-center gap-2" title={selectedClient?.lastMetricsUpdate ? new Date(selectedClient.lastMetricsUpdate).toLocaleString('pt-BR') : undefined}>
            <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="truncate">
              {selectedClient?.lastMetricsUpdate ? formatRelativeTime(selectedClient.lastMetricsUpdate) : 'Agora'}
            </span>
          </div>
        </div>

        {/* Card 3: Plano Contratado */}
        <div className="bg-[#D7FE03] border border-transparent rounded-2xl p-5 flex flex-col justify-center min-h-[96px] relative overflow-hidden group select-none">
          <span className="text-black/60 text-xs font-medium mb-1.5 block">Plano Contratado</span>
          <div className="text-black font-bold text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-black" />
            <span className="truncate">{selectedClient?.plan || 'Free'}</span>
          </div>
        </div>

        {/* Card 4: Ambiente Ativo */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-center min-h-[96px] relative overflow-hidden group select-none">
          <span className="text-zinc-500 text-xs font-medium mb-1.5 block">Ambiente Ativo</span>
          <div className="text-[#a1c200] font-bold text-lg truncate">
            {selectedClient?.name}
          </div>
        </div>
      </div>

`;
  
  content = parts[0] + gridStart + newGrid + c2.substring(endOfGrid);
  fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
  console.log("Patched monitor cards successfully and removed dupes!");
}
