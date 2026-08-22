import fs from 'fs';
let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

// Remove table header
content = content.replace(
  '                <th className="font-medium p-4">Próxima Renovação</th>\n',
  ''
);

// Remove list view column
const tdMatch = `                <td className="p-4 align-top">
                  {(() => {
                    if (client.status === 'suspended') return <span className="text-sm font-medium font-mono text-zinc-400">Suspenso</span>;
                    if (client.status === 'ended') return <span className="text-sm font-medium font-mono text-zinc-400">Encerrado</span>;
                    if (!client.nextRenewalDate && !client.dueDate) return <span className="text-sm font-medium font-mono text-zinc-400">-</span>;
                    
                    const renewInfo = getClientRenewalInfo(client);
                    return (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn(
                          "text-sm font-medium font-mono",
                          renewInfo.isAutoSuspended 
                            ? "text-rose-700 font-bold" 
                            : renewInfo.isOverdue 
                            ? "text-rose-600 font-bold" 
                            : renewInfo.showWarning 
                            ? "text-amber-600 font-semibold" 
                            : "text-zinc-800"
                        )}>
                          {formatClientRenewalDate(client)}
                        </span>
                        {renewInfo.isAutoSuspended ? (
                          <span 
                            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-600 text-white shadow-xs"
                            title={\`Site suspenso automaticamente (\${renewInfo.overdueDays} dias de atraso)\`}
                          >
                            Bloqueado (8d+)
                          </span>
                        ) : renewInfo.isOverdue ? (
                          <span 
                            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200"
                            title={\`Vencido há \${renewInfo.overdueDays} dias. Tolerância restante: \${renewInfo.toleranceRemaining} dias\`}
                          >
                            Atrasado (\${renewInfo.overdueDays}d)
                          </span>
                        ) : null}
                      </div>
                    );
                  })()}
                </td>`;
content = content.replace(tdMatch, '');

// Remove grid view row
const gridMatch = `                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 text-xs">Próxima renovação</span>
                    {(() => {
                      const renewInfo = getClientRenewalInfo(client);
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className={cn(
                            "font-medium text-xs font-mono",
                            renewInfo.isAutoSuspended 
                              ? "text-rose-700 font-bold" 
                              : renewInfo.isOverdue 
                              ? "text-rose-600 font-bold" 
                              : renewInfo.showWarning 
                              ? "text-amber-600 font-semibold" 
                              : "text-zinc-800"
                          )}>
                            {formatClientRenewalDate(client)}
                          </span>
                          {renewInfo.isAutoSuspended ? (
                            <span 
                              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-600 text-white shadow-xs"
                              title={\`Site suspenso automaticamente (\${renewInfo.overdueDays} dias de atraso)\`}
                            >
                              Bloqueado
                            </span>
                          ) : renewInfo.isOverdue ? (
                            <span 
                              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200"
                              title={\`Vencido há \${renewInfo.overdueDays} dias. Tolerância: \${renewInfo.toleranceRemaining}d\`}
                            >
                              Atrasado
                            </span>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>`;
content = content.replace(gridMatch, '');

fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
