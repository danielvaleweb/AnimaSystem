const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

const replacement = `                {/* Dynamically render top 3 investments with overlapping style */}
                <div className="relative my-4 flex flex-col pb-4">
                  {investments.length > 0 ? (
                    [...investments].sort((a, b) => b.value - a.value).slice(0, 3).map((inv, index) => {
                      const periodMult = selectedPeriod === 'ano' ? 12 : selectedPeriod === '7dias' ? 0.25 : 1;
                      const periodSuffix = selectedPeriod === 'ano' ? 'Per year' : selectedPeriod === '7dias' ? 'Per week' : selectedPeriod === 'mes' ? 'Per month' : 'Total';
                      const adjustedChange = inv.changePercent * periodMult;
                      const quantity = (inv.name.length * 0.5 + 1.2).toFixed(4); // Mock quantity for layout
                      const currentPrice = inv.value / parseFloat(quantity); // Mock current price derived from value
                      
                      return (
                      <div 
                        key={inv.id || index}
                        style={{ zIndex: index * 10 }}
                        className={\`p-4 rounded-[28px] flex items-center justify-between border relative shadow-sm \${index > 0 ? '-mt-6' : ''} \${
                          inv.logoType === 'black' ? 'bg-[#0f0f0f] text-white border-zinc-800' :
                          inv.logoType === 'green' ? 'bg-[#D7FE03] text-black border-[#D7FE03]' :
                          'bg-white text-zinc-900 border-zinc-200'
                        }\`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={\`w-10 h-10 rounded-full flex items-center justify-center font-normal text-lg shrink-0 uppercase border \${
                            inv.logoType === 'black' ? 'bg-white text-black border-white' :
                            inv.logoType === 'green' ? 'bg-black text-white border-black' :
                            'bg-black text-white border-black'
                          }\`}>
                            {inv.ticker ? inv.ticker.charAt(0) : inv.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex flex-col gap-1.5">
                            <p className={\`font-normal text-[15px] truncate leading-none \${inv.logoType === 'black' ? 'text-zinc-100' : 'text-zinc-900'}\`}>{inv.name}</p>
                            <span className={\`text-[11px] font-light \${
                              inv.logoType === 'black' ? 'text-zinc-500' :
                              inv.logoType === 'green' ? 'text-[#879901]' :
                              'text-zinc-400'
                            }\`}>{quantity} ativos</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className={\`text-[13px] font-normal tracking-wide \${
                            adjustedChange >= 0 ? 
                              (inv.logoType === 'black' ? 'text-[#D7FE03]' : 'text-zinc-900') : 
                              (inv.logoType === 'black' ? 'text-white' : 'text-zinc-900')
                          }\`}>
                            {adjustedChange > 0 ? '+' : ''}{adjustedChange.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                          </span>
                          <p className={\`text-[11px] font-light \${
                              inv.logoType === 'black' ? 'text-zinc-500' :
                              inv.logoType === 'green' ? 'text-[#879901]' :
                              'text-zinc-400'
                            }\`}>{periodSuffix}</p>
                          <span className={\`text-[9px] font-mono mt-0.5 \${
                              inv.logoType === 'black' ? 'text-zinc-600' :
                              inv.logoType === 'green' ? 'text-[#a1b505]' :
                              'text-zinc-400'
                          }\`}>Preço R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )})
                  ) : (
                    <div className="text-center py-6 text-xs text-zinc-400">
                      Nenhuma alocação registrada.
                    </div>
                  )}
                </div>`;

content = content.replace(/\{\/\* Dynamically render top 3 investments \*\/\}[\s\S]*?\{\/\* Right Side: ATMs \+ Cashback \*\/\}/, replacement + '\n              </div>\n              {/* Right Side: ATMs + Cashback */}');

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);

