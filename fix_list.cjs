const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

const oldStr = `              {transactions
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
                ))}`;

const newStr = `              {transactions
                .filter(t => t.status === 'paid')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3)
                .map((trx) => (
                  <div key={trx.id} className="flex justify-between items-center bg-zinc-950 border border-zinc-900 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className={"w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold font-mono shrink-0 " + (trx.type === 'saida' ? 'text-rose-500' : 'text-[#D7FE03]')}>
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
                ))}`;

content = content.replace(oldStr, newStr);

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
