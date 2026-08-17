const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

const modalHtml = `
      {/* Modal Nova Transação / Contratos */}
      {isContractsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 w-full max-w-4xl shadow-sm flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-xl font-display font-bold">Mensalidades e Planos</h2>
              <button 
                onClick={() => setIsContractsModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {clients.map(c => (
                <div key={c.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 w-full shrink-0 min-w-44">
                    <h3 className="font-semibold text-zinc-800">{c.name}</h3>
                    <p className="text-xs text-zinc-500">{c.domain || c.cnpj || 'Sem info'}</p>
                    {c.status !== 'active' && <span className="inline-block mt-1 text-[10px] uppercase font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded">Inativo</span>}
                  </div>
                  <div className="w-full md:w-auto grid grid-cols-3 gap-3 flex-1">
                    <div className="relative">
                      <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">Plano</label>
                      <button
                        type="button"
                        onClick={() => setOpenClientPlanDropdownId(openClientPlanDropdownId === c.id ? null : c.id)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent flex items-center justify-between gap-1 select-none cursor-pointer text-left"
                      >
                        <span>{c.plan || 'Starter'}</span>
                        <CD2 className={\`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 shrink-0 \${openClientPlanDropdownId === c.id ? 'rotate-180' : ''}\`} />
                      </button>
                      <AnimatePresence>
                        {openClientPlanDropdownId === c.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenClientPlanDropdownId(null)}></div>
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                              className="absolute left-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-40 py-1 overflow-hidden min-w-[130px]"
                              style={{ transformOrigin: 'top left' }}
                            >
                              {['Starter', 'Pro', 'Enterprise'].map(planName => (
                                <button
                                  key={planName}
                                  type="button"
                                  onClick={async () => {
                                    await updateClientField(c.id, { plan: planName });
                                    setOpenClientPlanDropdownId(null);
                                  }}
                                  className={\`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer \${(c.plan || 'Starter') === planName ? 'text-accent font-semibold hover:bg-zinc-50' : 'text-zinc-700 hover:bg-zinc-50'}\`}
                                >
                                  <span>{planName}</span>
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">Valor Mensal</label>
                      <input 
                        type="number"
                        defaultValue={c.monthlyValue || 0}
                        onBlur={async (e) => await updateClientField(c.id, { monthlyValue: Number(e.target.value) })}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">Vencimento (Dia)</label>
                      <input 
                        type="number"
                        min="1" max="31"
                        defaultValue={c.dueDate || 1}
                        onBlur={async (e) => await updateClientField(c.id, { dueDate: Number(e.target.value) })}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {clients.length === 0 && (
                <div className="text-center text-zinc-500 py-8">Nenhum cliente cadastrado.</div>
              )}
            </div>
          </div>
        </div>
      )}
`;

content = content.replace("    </div>\n  );\n}", modalHtml + "\n    </div>\n  );\n}");

fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
