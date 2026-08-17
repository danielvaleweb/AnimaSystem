const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

const replacement = `
                {/* Dynamically render top 3 investments */}
                <div className="space-y-2.5 my-4">
                  {investments.length > 0 ? (
                    [...investments].sort((a, b) => b.value - a.value).slice(0, 3).map((inv, index) => (
                      <div 
                        key={inv.id || index}
                        className={\`p-2.5 rounded-2xl flex items-center justify-between border \${
                          inv.logoType === 'black' ? 'bg-[#161616] text-white border-zinc-800' :
                          inv.logoType === 'green' ? 'bg-[#D7FE03] text-black border-[#D7FE03]/85' :
                          'bg-white text-zinc-900 border-zinc-200'
                        }\`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={\`w-8 h-8 rounded-xl flex items-center justify-center font-light text-xs shrink-0 uppercase \${
                            inv.logoType === 'black' ? 'bg-zinc-900 text-[#D7FE03]' :
                            inv.logoType === 'green' ? 'bg-black text-[#D7FE03]' :
                            'bg-zinc-100 text-black'
                          }\`}>
                            {inv.ticker ? inv.ticker.charAt(0) : inv.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-normal text-[11px] truncate leading-tight">{inv.name}</p>
                            <span className={\`text-[8px] font-mono \${
                              inv.logoType === 'black' ? 'text-zinc-400' :
                              inv.logoType === 'green' ? 'text-zinc-800/80' :
                              'text-zinc-500'
                            }\`}>{inv.ticker}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono font-light text-[11px]">R$ {inv.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <span className={\`text-[8px] font-semibold \${
                            inv.changePercent >= 0 ? 
                              (inv.logoType === 'green' ? 'text-zinc-900' : 'text-[#D7FE03]') : 
                              (inv.logoType === 'green' ? 'text-zinc-900 bg-black/10 px-1 rounded' : 'text-rose-500')
                          }\`}>
                            {inv.changePercent > 0 ? '+' : ''}{inv.changePercent}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-zinc-400">
                      Nenhuma alocação registrada.
                    </div>
                  )}
                </div>
`;

content = content.replace(/\{\/\* Overlap Stacked Asset lists exactly like print \*\/\}[\s\S]*?\{\/\* Right Side: ATMs \+ Cashback \*\/\}/, replacement + '              </div>\n              {/* Right Side: ATMs + Cashback */}');

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);

