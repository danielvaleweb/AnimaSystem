const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

const oldTitleStr = `              <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="truncate max-w-[150px] sm:max-w-none mr-2">{client.name}</span>

                <div className="flex bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 h-[26px]">
                  <span className="px-2.5 py-[3px] text-xs font-medium text-white bg-zinc-800 flex items-center">
                    {client.plan}
                  </span>
                  <span className={cn(
                    "px-2.5 py-[3px] text-xs font-semibold flex items-center gap-1.5 border-l border-zinc-700",
                    client.status === 'active' ? "bg-accent text-black" :
                    client.status === 'trial' ? "bg-blue-500 text-white" :
                    client.status === 'ended' ? "bg-zinc-500 text-white" :
                    client.status === 'developing' ? "bg-purple-500 text-white" :
                    "bg-rose-500 text-white"
                  )}>
                    {client.status === 'active' ? (
                      <><Rocket className="w-3 h-3" />Ativo</>
                    ) : client.status === 'trial' ? (
                      <><Clock className="w-3 h-3" />{client?.trialEndDate ? 'Trial (' + Math.max(0, Math.ceil((new Date(client.trialEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) + 'd)' : 'Trial'}</>
                    ) : client.status === 'ended' ? (
                      <><Power className="w-3 h-3" />Encerrado</>
                    ) : client.status === 'developing' ? (
                      <><Code className="w-3 h-3" />Em construção</>
                    ) : (
                      <><Hand className="w-3 h-3" />Suspenso</>
                    )}
                  </span>
                </div>
              </h2>`;

const newTitleStr = `              <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="truncate max-w-[150px] sm:max-w-none mr-2">{client.name}</span>

                <div className="flex bg-zinc-800 rounded-xl overflow-hidden shadow-sm h-8 mt-0.5">
                  <span className="px-3.5 flex items-center justify-center text-sm font-medium text-white bg-zinc-800">
                    {client.plan}
                  </span>
                  <span className={cn(
                    "px-3.5 flex items-center justify-center gap-2 text-sm font-semibold",
                    client.status === 'active' ? "bg-accent text-black" :
                    client.status === 'trial' ? "bg-blue-500 text-white" :
                    client.status === 'ended' ? "bg-zinc-500 text-white" :
                    client.status === 'developing' ? "bg-purple-500 text-white" :
                    "bg-rose-500 text-white"
                  )}>
                    {client.status === 'active' ? (
                      <><motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}><Rocket className="w-4 h-4" /></motion.div>Ativo</>
                    ) : client.status === 'trial' ? (
                      <><Clock className="w-4 h-4" />{client?.trialEndDate ? 'Trial (' + Math.max(0, Math.ceil((new Date(client.trialEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) + 'd)' : 'Trial'}</>
                    ) : client.status === 'ended' ? (
                      <><Power className="w-4 h-4" />Encerrado</>
                    ) : client.status === 'developing' ? (
                      <><Code className="w-4 h-4" />Em construção</>
                    ) : (
                      <><Hand className="w-4 h-4" />Suspenso</>
                    )}
                  </span>
                </div>
              </h2>`;

content = content.replace(oldTitleStr, newTitleStr);
fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
