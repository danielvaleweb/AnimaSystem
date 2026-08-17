const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

const oldStart = "{/* Lembretes List */}";
const oldEnd = "{/* Card 3: Clientes recentes */}";

const startIndex = content.indexOf(oldStart);
const endIndex = content.indexOf(oldEnd);

if(startIndex !== -1 && endIndex !== -1) {
    const newContent = `{/* Lembretes List (Slide 1 by 1) */}
                  <div className="flex-1 flex flex-col justify-center overflow-hidden relative min-h-[140px]">
                    {clients.length > 0 ? clients.slice(0, 5).map((client, idx) => {
                      const today = new Date();
                      const dueDate = new Date();
                      dueDate.setDate(client.dueDate || (today.getDate() + idx));
                      
                      const isToday = dueDate.getDate() === today.getDate();
                      const daysLeft = dueDate.getDate() - today.getDate();
                      
                      let statusText = "";
                      let statusColor = "";
                      
                      if (isToday) {
                        statusText = "Vence Hoje";
                        statusColor = "text-red-600 bg-red-50 border-red-100";
                      } else if (daysLeft < 0) {
                        statusText = "Atrasado";
                        statusColor = "text-red-700 bg-red-50 border-red-200";
                      } else {
                        statusText = \`Vence em \${daysLeft} dias\`;
                        statusColor = "text-amber-600 bg-amber-50 border-amber-100";
                      }

                      return (
                        <div 
                          key={client.id} 
                          className={\`absolute inset-0 flex flex-col justify-center p-5 rounded-2xl border border-zinc-100 transition-all duration-500 \${
                            currentReminderIndex === idx ? 'opacity-100 translate-x-0 z-10 bg-zinc-50/80' : 'opacity-0 translate-x-4 -z-10 pointer-events-none'
                          }\`}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-sm font-bold text-zinc-600 shadow-sm shrink-0">
                              {client.logoInitials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-zinc-800 line-clamp-1">{client.name}</span>
                              <span className="text-xs text-zinc-500 mt-0.5">Mensalidade</span>
                            </div>
                          </div>
                          <div className="mt-auto flex justify-between items-center">
                            <span className={\`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full border \${statusColor}\`}>
                              {statusText}
                            </span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-4 text-xs text-zinc-400 h-full flex items-center justify-center">Nenhum lembrete.</div>
                    )}
                  </div>
                  
                  {/* Indicators */}
                  {clients.length > 0 && (
                    <div className="flex justify-center gap-1.5 mt-4">
                      {clients.slice(0, Math.min(clients.length, 5)).map((_, idx) => (
                        <div 
                          key={idx} 
                          className={\`h-1.5 rounded-full transition-all \${currentReminderIndex === idx ? 'w-4 bg-zinc-800' : 'w-1.5 bg-zinc-200'}\`} 
                        />
                      ))}
                    </div>
                  )}
                </div>

                `;
    
    content = content.substring(0, startIndex) + newContent + content.substring(endIndex);
    fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
    console.log("Dashboard Patched successfully!");
} else {
    console.log("Could not find the bounds to patch");
}
