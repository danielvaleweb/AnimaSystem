const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

const oldStr = `                          {clients.slice(0, 4).map((client, idx) => (
                            <div key={client.id} title={client.name} className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center overflow-hidden z-10" style={{ zIndex: 4 - idx }}>
                              {client.logoUrl ? (
                                <img src={client.logoUrl} alt={client.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                              ) : (
                                <span className="text-xl font-bold text-zinc-500">{client.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                          ))}
                          {clients.length > 4 && (
                            <div className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-500 z-0">
                              +{clients.length - 4}
                            </div>
                          )}`;

const newStr = `                          {clients.slice(0, 4).map((client, idx) => (
                            <div key={client.id} title={client.name} className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center overflow-hidden relative" style={{ zIndex: idx }}>
                              {client.logoUrl ? (
                                <img src={client.logoUrl} alt={client.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                              ) : (
                                <span className="text-xl font-bold text-zinc-500">{client.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                          ))}
                          {clients.length > 4 && (
                            <div className="w-16 h-16 rounded-full bg-black border-2 border-white flex items-center justify-center text-lg font-bold text-white relative" style={{ zIndex: 4 }}>
                              +{clients.length - 4}
                            </div>
                          )}`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
