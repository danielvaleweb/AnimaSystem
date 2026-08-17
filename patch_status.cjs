const fs = require('fs');
let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

const target1 = `  const runDiscovery = async () => {`;
const inject1 = `
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const handleUpdateStatus = async (newStatus: 'active' | 'suspended' | 'ended') => {
    if (!selectedClient) return;
    try {
      await updateDoc(doc(db, 'clients', selectedClient.id), {
        status: newStatus
      });
      setIsStatusDropdownOpen(false);
    } catch (err) {
      console.error("Error updating client status:", err);
      setErrorMsg("Erro ao atualizar status do cliente.");
    }
  };

`;

content = content.replace(target1, inject1 + target1);

const target2 = `{/* Custom Client Selector (Anchored Overlay) */}`;

const inject2 = `
              {/* Status Toggle Dropdown */}
              <div className="relative w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsStatusDropdownOpen(!isStatusDropdownOpen);
                    setIsClientDropdownOpen(false);
                    setIsTimeDropdownOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between gap-2 border text-sm rounded-xl px-4 py-2.5 focus:outline-none w-full sm:w-36 cursor-pointer text-left select-none font-bold",
                    selectedClient?.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    selectedClient?.status === 'suspended' ? "bg-amber-50 text-amber-700 border-amber-200" :
                    selectedClient?.status === 'ended' ? "bg-rose-50 text-rose-700 border-rose-200" :
                    "bg-white border-zinc-200 text-zinc-800"
                  )}
                >
                  <span className="truncate flex items-center gap-2">
                    {selectedClient?.status === 'active' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                    {selectedClient?.status === 'suspended' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                    {selectedClient?.status === 'ended' && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                    {selectedClient?.status === 'active' ? 'Ativo' : 
                     selectedClient?.status === 'suspended' ? 'Suspenso' : 
                     selectedClient?.status === 'ended' ? 'Encerrado' : 'Status'}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 shrink-0", isStatusDropdownOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isStatusDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsStatusDropdownOpen(false)}></div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="absolute left-0 sm:left-auto sm:right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-40 py-1 overflow-hidden w-full sm:min-w-[150px] p-anchored-overlay-enter-active"
                        style={{ transformOrigin: 'top' }}
                      >
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('active')}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium"
                        >
                          <div className="w-2 h-2 rounded-full bg-emerald-500" /> Ativar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('suspended')}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium"
                        >
                          <div className="w-2 h-2 rounded-full bg-amber-500" /> Suspender
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('ended')}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium"
                        >
                          <div className="w-2 h-2 rounded-full bg-rose-500" /> Encerrar
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
`;

content = content.replace(target2, inject2 + '\n              ' + target2);

fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
console.log("Patched status successfully");
