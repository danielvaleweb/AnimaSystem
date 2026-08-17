const fs = require('fs');
let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

const clientDropdownHtml = `
              {/* Custom Client Selector (Anchored Overlay) */}
              <div className="relative w-full sm:w-52">
                <button
                  type="button"
                  onClick={() => {
                    setIsClientDropdownOpen(!isClientDropdownOpen);
                    setIsTimeDropdownOpen(false);
                  }}
                  className="flex items-center justify-between gap-2 bg-white border border-zinc-200 text-zinc-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-300 w-full cursor-pointer text-left select-none"
                >
                  <span className="truncate">{selectedClient?.name || 'Nenhum cliente...'}</span>
                  <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0", isClientDropdownOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isClientDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsClientDropdownOpen(false)}></div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="absolute left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-40 py-1 overflow-hidden p-anchored-overlay-enter-active max-h-60 overflow-y-auto"
                        style={{ transformOrigin: 'top' }}
                      >
                        {clients.length === 0 ? (
                          <div className="px-4 py-2.5 text-sm text-zinc-500 italic">Nenhum cliente...</div>
                        ) : (
                          clients.map(client => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setIsClientDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                                selectedClient?.id === client.id
                                   ? "text-accent font-semibold hover:bg-white/40"
                                   : "text-zinc-700 hover:bg-white"
                              )}
                            >
                              <span className="truncate">{client.name}</span>
                            </button>
                          ))
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>`;

if (!content.includes('Custom Client Selector (Anchored Overlay)')) {
  // Put it before Custom TimeRange Selector
  content = content.replace(
    '              {/* Custom TimeRange Selector (Anchored Overlay) */}',
    clientDropdownHtml + '\\n\\n              {/* Custom TimeRange Selector (Anchored Overlay) */}'
  );
  fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
}
