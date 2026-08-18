const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

const oldTitleStr = `              <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="truncate max-w-[150px] sm:max-w-none">{client.name}</span>

                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 border border-zinc-700 text-white">
                  {client.plan}
                </span>
              </h2>`;

const newTitleStr = `              <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 flex flex-wrap items-center gap-2 sm:gap-3">
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

content = content.replace(oldTitleStr, newTitleStr);

const oldStatusMenuStr = `          {/* Status Badge (Read Only) */}
          <div className="relative">
              <div 
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-1.5",
                  client.status === 'active' ? "bg-accent border-accent text-black font-semibold" :
                  client.status === 'trial' ? "bg-blue-500 border-blue-500 text-white font-semibold" :
                  client.status === 'ended' ? "bg-zinc-500 border-zinc-500 text-white font-semibold" :
                  client.status === 'developing' ? "bg-purple-500 border-purple-500 text-white font-semibold" :
                  "bg-rose-500 border-rose-500 text-white font-semibold"
                )}
              >
                {client.status === 'active' ? (
                  <><Rocket className="w-3.5 h-3.5" />Ativo</>
                ) : client.status === 'trial' ? (
                  <><Clock className="w-3.5 h-3.5" />{client?.trialEndDate ? 'Trial - ' + Math.max(0, Math.ceil((new Date(client.trialEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) + ' dias restantes' : 'Trial'}</>
                ) : client.status === 'ended' ? (
                  <><Power className="w-3.5 h-3.5" />Encerrado</>
                ) : client.status === 'developing' ? (
                  <><Code className="w-3.5 h-3.5" />Em construção</>
                ) : (
                  <><Hand className="w-3.5 h-3.5" />Suspenso</>
                )}
              </div>
          </div>`;

content = content.replace(oldStatusMenuStr, "");

fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
