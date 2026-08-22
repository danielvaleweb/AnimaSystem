import fs from 'fs';
let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

const match = `                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Próxima Renovação</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "font-mono font-semibold text-sm",
                      isClientRenewalAlert(client) ? "text-rose-600 font-bold" : "text-zinc-800"
                    )}>
                      {formatClientRenewalDate(client)}
                    </span>
                    {isClientRenewalAlert(client) && (
                      <span 
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold",
                          getClientDaysUntilRenewal(client) <= 0 
                            ? "bg-rose-100 text-rose-700 border border-rose-200" 
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        )}
                      >
                        {getClientDaysUntilRenewal(client) < 0 
                          ? \`Atrasado (\${Math.abs(getClientDaysUntilRenewal(client))}d)\` 
                          : getClientDaysUntilRenewal(client) === 0 
                          ? 'Vence hoje' 
                          : \`Vence em \${getClientDaysUntilRenewal(client)}d\`}
                      </span>
                    )}
                  </div>
                </div>`;
                
content = content.replace(match, '');
fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
