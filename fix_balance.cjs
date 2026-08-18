const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

// Update calculateTotalBalance
const calcOld = `    const filtered = transactions.filter(t => {
      if (t.type !== 'entrada' || t.status !== 'paid') return false;
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });

    const sum = filtered.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    // Fallback se n tiver transacoes e for total, mostra um valor bonito ou 0
    return sum > 0 ? sum : 0;`;

const calcNew = `    const filtered = transactions.filter(t => {
      if (t.status !== 'paid') return false;
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });

    const sum = filtered.reduce((acc, t) => {
      const amt = Number(t.amount) || 0;
      return t.type === 'saida' ? acc - amt : acc + amt;
    }, 0);
    return sum;`;

content = content.replace(calcOld, calcNew);

// Update transaction list in dashboard
const listOld = `            <div className="space-y-2 mt-4">
              {transactions
                .filter(t => t.type === 'entrada' && t.status === 'paid')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3)
                .map((trx) => (
                  <div key={trx.id} className="flex justify-between items-center bg-zinc-950 border border-zinc-900 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-[#D7FE03] font-mono shrink-0">
                        +
                      </span>
                      <div className="flex flex-col text-left min-w-0">
                         <span className="text-xs font-light text-zinc-300 truncate w-full">{trx.clientName || 'Entrada'}</span>
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
            </div>`;

const listNew = `            <div className="space-y-2 mt-4">
              {transactions
                .filter(t => t.status === 'paid')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3)
                .map((trx) => (
                  <div key={trx.id} className="flex justify-between items-center bg-zinc-950 border border-zinc-900 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className={\`w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold font-mono shrink-0 \${trx.type === 'saida' ? 'text-rose-500' : 'text-[#D7FE03]'}\`}>
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
            </div>`;

content = content.replace(listOld, listNew);

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
