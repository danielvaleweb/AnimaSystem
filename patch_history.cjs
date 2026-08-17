const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

const targetSectionRegex = /\{\/\* Bottom Currency sub-cards \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* ----------------- COLUMN 2/;

const replacement = `{/* Bottom History sub-cards */}
            <div className="space-y-2 mt-4">
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
                {transactions.filter(t => t.type === 'entrada' && t.status === 'paid').length === 0 && (
                  <div className="text-center py-4 text-xs text-zinc-500 font-light border border-dashed border-zinc-900 rounded-2xl">
                    Nenhuma entrada recente.
                  </div>
                )}
            </div>
          </div>
          {/* ----------------- COLUMN 2`;

content = content.replace(targetSectionRegex, replacement);

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
