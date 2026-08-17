const fs = require('fs');

let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

// Update list view
content = content.replace(
  /<p className="font-medium text-zinc-800">\{trx\.clientName\}<\/p>\n\s*<p className="text-xs text-zinc-500 font-mono mt-0\.5">\{trx\.id\?\.substring\(0,8\)\}<\/p>/,
  '<p className="font-medium text-zinc-800">{trx.title || trx.clientName || \'Sem Título\'}</p>\n                     <p className="text-xs text-zinc-500 mt-0.5 font-mono">{trx.title && trx.clientName ? trx.clientName : trx.id?.substring(0,8)}</p>'
);

// Form changes
// Replace the current Client / Descrição section with the new dual inputs
const oldClientInputSection = `
              <div className="space-y-1.5 relative">
                <label className="text-sm font-medium text-zinc-500">{formData.type === 'saida' ? 'Título da Saída' : 'Cliente / Descrição'}</label>
                <input 
                  type="text"
                  required
                  value={formData.clientName || ''}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                  onFocus={() => setIsClientSearchFocused(true)}
                  onBlur={() => {
                    // Short timeout to allow click events on dropdown to register before blur closes it
                    setTimeout(() => setIsClientSearchFocused(false), 200);
                  }}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                  placeholder="Nome do cliente ou despesa..."
                  autoComplete="off"
                />

                {formData.type !== 'saida' && isClientSearchFocused && clientsData && clientsData.length > 0 && (
                  (() => {
                    const filteredClients = clientsData.filter(client => 
                      client.name.toLowerCase().includes((formData.clientName || '').toLowerCase())
                    );
                    if (filteredClients.length === 0) return null;
                    return (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-50 py-1 max-h-48 overflow-y-auto">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200/80 mb-1">
                          Selecionar Cliente Ativo
                        </div>
                        {filteredClients.map(client => (
                          <button
                            key={client.id}
                            type="button"
                            onMouseDown={() => {
                              setFormData({
                                ...formData,
                                clientName: client.name,
                                // If amount is unset or empty, autofill with monthlyValue
                                amount: formData.amount ? formData.amount : client.monthlyValue
                              });
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:text-accent hover:bg-white transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>{client.name}</span>
                            <span className="text-xs font-medium text-zinc-400">R$ {Number(client.monthlyValue || 0).toFixed(2)}/mês</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
`;

const newClientInputSection = `
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-500">{formData.type === 'entrada' ? 'Título da Entrada' : 'Título da Saída'}</label>
                  <input 
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                    placeholder={formData.type === 'entrada' ? "Ex: Mensalidade, Desenvolvimento, etc..." : "Ex: Conta de Luz, Marketing, etc..."}
                  />
                </div>

                {formData.type === 'entrada' && (
                  <div className="space-y-1.5 relative">
                    <label className="text-sm font-medium text-zinc-500 flex items-center justify-between">
                      <span>Cliente Relacionado</span>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Opcional</span>
                    </label>
                    <input 
                      type="text"
                      value={formData.clientName || ''}
                      onChange={e => setFormData({...formData, clientName: e.target.value})}
                      onFocus={() => setIsClientSearchFocused(true)}
                      onBlur={() => {
                        // Short timeout to allow click events on dropdown to register before blur closes it
                        setTimeout(() => setIsClientSearchFocused(false), 200);
                      }}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
                      placeholder="Buscar cliente para abater na mensalidade..."
                      autoComplete="off"
                    />

                    {isClientSearchFocused && clientsData && clientsData.length > 0 && (
                      (() => {
                        const filteredClients = clientsData.filter(client => 
                          client.name.toLowerCase().includes((formData.clientName || '').toLowerCase())
                        );
                        if (filteredClients.length === 0) return null;
                        return (
                          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-50 py-1 max-h-48 overflow-y-auto">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200/80 mb-1">
                              Selecionar Cliente Ativo
                            </div>
                            {filteredClients.map(client => (
                              <button
                                key={client.id}
                                type="button"
                                onMouseDown={() => {
                                  setFormData({
                                    ...formData,
                                    clientName: client.name,
                                    // If title is unset, fill it
                                    title: formData.title ? formData.title : "Mensalidade",
                                    // If amount is unset or empty, autofill with monthlyValue
                                    amount: formData.amount ? formData.amount : client.monthlyValue
                                  });
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:text-accent hover:bg-white transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span>{client.name}</span>
                                <span className="text-xs font-medium text-zinc-400">R$ {Number(client.monthlyValue || 0).toFixed(2)}/mês</span>
                              </button>
                            ))}
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>
`;

content = content.replace(oldClientInputSection, newClientInputSection);

fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
console.log("Form patched.");
