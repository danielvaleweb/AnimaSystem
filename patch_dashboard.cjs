const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

// Replace ATMs with Lembretes
const oldAtmStart = "{/* Card 2: ATMs on the map */}";
const oldAtmEnd = "{/* Card 3: Clientes recentes */}";

const startIndex = content.indexOf(oldAtmStart);
const endIndex = content.indexOf(oldAtmEnd);

if(startIndex !== -1 && endIndex !== -1) {
    const newContent = `{/* Card 2: Lembretes (Agenda) */}
                <div 
                  onClick={() => onNavigate('agenda')}
                  className="bg-white border border-zinc-200/75 rounded-3xl p-5 flex flex-col justify-between cursor-pointer hover:border-zinc-300 transition-all flex-1"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="font-light text-black text-sm tracking-wide block">Lembretes</span>
                      <span className="text-[10px] text-zinc-400 font-light">Agenda de Vencimentos</span>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600" />
                    </button>
                  </div>
                  
                  {/* Lembretes List */}
                  <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                    {clients.slice(0, 3).map((client, idx) => {
                      const today = new Date();
                      const dueDate = new Date();
                      dueDate.setDate(client.dueDate || (today.getDate() + idx));
                      
                      const isToday = dueDate.getDate() === today.getDate();
                      const daysLeft = dueDate.getDate() - today.getDate();
                      
                      let statusText = "";
                      let statusColor = "";
                      
                      if (isToday) {
                        statusText = "Vence Hoje";
                        statusColor = "text-red-500 bg-red-50 border-red-100";
                      } else if (daysLeft < 0) {
                        statusText = "Atrasado";
                        statusColor = "text-red-700 bg-red-50 border-red-200";
                      } else {
                        statusText = \`Vence em \${daysLeft} dias\`;
                        statusColor = "text-amber-600 bg-amber-50 border-amber-100";
                      }

                      return (
                        <div key={client.id} className="flex items-center justify-between p-3 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-200/50 flex items-center justify-center text-xs font-bold text-zinc-600">
                              {client.logoInitials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-zinc-800">{client.name}</span>
                              <span className="text-[10px] text-zinc-500">Mensalidade</span>
                            </div>
                          </div>
                          <span className={\`text-[9px] font-bold uppercase px-2 py-1 rounded-full border \${statusColor}\`}>
                            {statusText}
                          </span>
                        </div>
                      );
                    })}
                    {clients.length === 0 && (
                      <div className="text-center py-4 text-xs text-zinc-400">Nenhum lembrete para hoje.</div>
                    )}
                  </div>
                </div>

                `;
    
    content = content.substring(0, startIndex) + newContent + content.substring(endIndex);
    fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
    console.log("Dashboard Patched successfully!");
} else {
    console.log("Could not find the bounds to patch");
}
