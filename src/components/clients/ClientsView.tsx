import { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, Edit2, Ban, Trash2, CheckCircle2, LayoutGrid, List, Rocket, Hand, Power, Code, Clock, ChevronDown, FileText, X, ChevronDown as CD2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientData } from '../../types';
import { cn } from '../../utils';
import { ClientModal } from './ClientModal';
import { ConfirmationModal } from '../ConfirmationModal';
import { db, auth, app } from '../../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';

export function ClientsView({ onClientSelect, onNavigate }: { onClientSelect?: (id: string) => void, onNavigate?: (v: any, id?: string) => void }) {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isContractsModalOpen, setIsContractsModalOpen] = useState(false);
  const [openClientPlanDropdownId, setOpenClientPlanDropdownId] = useState<string | null>(null);
  const handleFirestoreError = (err: any, type: string, ref: string) => { console.error(type, ref, err); };
  const updateClientField = async (clientId: string, data: any) => {
    try {
      await updateDoc(doc(db, 'clients', clientId), data);
    } catch (err) {
      handleFirestoreError(err, 'UPDATE', `clients/${clientId}`);
    }
  };

  
  const getClientGcpCost = (client: ClientData): { cost: number; isReal: boolean } => {
    if (client.gcpBillingCost !== undefined) {
      return { cost: client.gcpBillingCost, isReal: true };
    }
    if (!client.lastGcpMetrics) return { cost: 0, isReal: false };
    
    const metrics = client.lastGcpMetrics;
    const USD_TO_BRL = 5.20;
    
    // Reads
    const readsVal = metrics.reads_billable?.value || metrics.reads_ops?.value || 0;
    const readsAfterFree = Math.max(0, readsVal - 50000);
    const readsCostUSD = (readsAfterFree / 100000) * 0.036;
    
    // Writes
    const writesVal = metrics.writes_billable?.value || metrics.writes_ops?.value || 0;
    const writesAfterFree = Math.max(0, writesVal - 20000);
    const writesCostUSD = (writesAfterFree / 100000) * 0.108;
    
    // Firestore Storage
    const fsStorageGB = (metrics.storageBytes?.value || 0) / 1024 / 1024 / 1024;
    const fsStorageAfterFree = Math.max(0, fsStorageGB - 1);
    const fsStorageCostUSD = fsStorageAfterFree * 0.108;
    
    // Cloud Storage
    const csVal1 = metrics.cloudStorageBytes?.value || 0;
    const csVal2 = metrics.cloudStorageBytesV2?.value || 0;
    const csFinalVal = Math.max(csVal1, csVal2);
    const csStorageGB = csFinalVal / 1024 / 1024 / 1024;
    const csStorageAfterFree = Math.max(0, csStorageGB - 5);
    const csStorageCostUSD = csStorageAfterFree * 0.026;
    
    const totalUSD = readsCostUSD + writesCostUSD + fsStorageCostUSD + csStorageCostUSD;
    return { cost: totalUSD * USD_TO_BRL, isReal: false };
  };

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    const saved = localStorage.getItem('animahub_clients_view_mode');
    return saved === 'grid' || saved === 'list' ? saved : 'list';
  });

  useEffect(() => {
    localStorage.setItem('animahub_clients_view_mode', viewMode);
  }, [viewMode]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData: ClientData[] = [];
      snapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() } as ClientData);
      });
      clientsData.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setClients(clientsData);
    }, (error) => {
      console.error("Error fetching clients:", error);
    });

    return () => unsubscribe();
  }, []);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || 
                          c.domain?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (client?: ClientData) => {
    setEditingClient(client || null);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSaveClient = async (clientData: ClientData) => {
    if (!auth.currentUser) {
      alert("Must be logged in to save clients");
      return;
    }
    
    try {
      const { id, ...dataToSave } = clientData;
      // ensure numeric fields
      const processedData = {
        ...dataToSave,
        monthlyValue: Number(dataToSave.monthlyValue) || 0,
        dueDate: Number(dataToSave.dueDate) || 1,
        ownerId: auth.currentUser.uid,
      };


      // Clean up undefined values that Firestore rejects
      Object.keys(processedData).forEach(key => {
        if (processedData[key as keyof typeof processedData] === undefined) {
          delete processedData[key as keyof typeof processedData];
        }
      });

      if (editingClient) {

        await updateDoc(doc(db, 'clients', id), processedData);
      } else {
        const newId = Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, 'clients', newId), {
          ...processedData,
          createdAt: new Date().toISOString()
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert('Error saving client. Please try again.');
    }
  };


  const handleDelete = async (id: string) => {
    try {
      const client = clients.find(c => c.id === id);
      if (client?.logoUrl) {
        try {
          const { getStorage, ref, deleteObject } = await import('firebase/storage');
          const hubStorage = getStorage(app, 'gs://animahub.firebasestorage.app');
          const fileRef = ref(hubStorage, client.logoUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.warn("Storage logo deletion failed, proceeding with firestore deletion:", storageError);
        }
      }
      await deleteDoc(doc(db, 'clients', id));
      setClientToDelete(null);
    } catch (error) {
      console.error(error);
      alert('Error deleting client');
    }
    setActiveMenuId(null);
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative space-y-14">
      {/* Greeting Row Pattern */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-5 text-left">
          <button 
            onClick={() => onNavigate?.('dashboard')}
            className="w-12 h-12 rounded-full bg-transparent border border-zinc-200/80 flex items-center justify-center text-zinc-500 hover:bg-white hover:text-black transition-all cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="text-[40px] font-normal text-zinc-900 tracking-tight whitespace-nowrap">
              Clientes
            </h1>
          </div>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="p-2 pl-4 border border-zinc-200 bg-white rounded-[2rem] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou domínio..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border border-zinc-200 hover:border-zinc-300 focus:border-zinc-300 outline-none rounded-full py-2 pl-9 pr-4 text-sm text-zinc-800 placeholder:text-zinc-400 transition-all"
            />
          </div>
          
          <div className="relative w-full sm:w-auto shrink-0 z-30">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center justify-between gap-2.5 bg-white border border-zinc-200/80 text-sm text-zinc-800 rounded-full py-2.5 pl-5 pr-8 outline-none focus:border-zinc-300 shadow-sm transition-all select-none cursor-pointer w-full sm:w-auto sm:min-w-[160px] relative"
            >
              <span>
                {filterStatus === 'all' ? 'Todos os Status' :
                 filterStatus === 'active' ? 'Ativos' :
                 filterStatus === 'trial' ? 'Em Trial' : 'Suspensos'}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 absolute right-3.5 top-1/2 -translate-y-1/2", isStatusDropdownOpen && "rotate-180")} />
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
                    className="absolute left-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl z-45 py-1 overflow-hidden w-full sm:min-w-[170px]"
                    style={{ transformOrigin: 'top' }}
                  >
                    {[
                      { val: 'all', label: 'Todos os Status' },
                      { val: 'active', label: 'Ativos' },
                      { val: 'trial', label: 'Em Trial' },
                      { val: 'suspended', label: 'Suspensos' }
                    ].map(item => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => {
                          setFilterStatus(item.val);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer",
                          filterStatus === item.val
                            ? "text-black font-bold hover:bg-zinc-50"
                            : "text-zinc-800 hover:bg-zinc-50"
                        )}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex bg-transparent p-1 rounded-full border border-zinc-200 justify-center sm:justify-start shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-full transition-colors cursor-pointer",
                viewMode === 'list' ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-full transition-colors cursor-pointer",
                viewMode === 'grid' ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto p-1 sm:p-0 sm:pr-1">
          <button 
            onClick={() => setIsContractsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 font-medium py-2 px-4 rounded-full transition-colors text-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-zinc-500" />
            Gerenciar Contratos
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-zinc-950 font-semibold py-2 px-5 rounded-full transition-colors text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Table List / Grid */}
      <div className="flex-1 overflow-auto p-4 sm:p-0">
        {viewMode === 'list' ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 text-sm text-zinc-500 bg-transparent">
                <th className="font-medium p-4 pl-6">Cliente</th>
                <th className="font-medium p-4">Plano</th>
                <th className="font-medium p-4">Mensalidade</th>
                <th className="font-medium p-4">Custo Cloud</th>
                <th className="font-medium p-4">Status</th>
                <th className="font-medium p-4">Firebase ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredClients.map((client) => (
                <tr 
                  key={client.id} 
                  className="hover:bg-zinc-50/50 transition-colors group cursor-pointer"
                  onClick={() => onClientSelect && onClientSelect(client.id)}
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-sm font-display font-medium text-zinc-500 overflow-hidden shrink-0" title={client.name}>
                        {client.logoUrl ? (
                           <img src={client.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                           client.logoInitials
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-800">{client.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-zinc-500 truncate max-w-[120px] sm:max-w-none">{client.domain}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700 shrink-0"></span>
                          <span className="text-xs text-zinc-500 truncate max-w-[100px] sm:max-w-none">{client.responsible}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-zinc-100 text-xs font-medium text-zinc-800 border border-zinc-200/50">
                      {client.plan}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-zinc-800">R$ {client.monthlyValue.toFixed(2)}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Venc. dia {client.dueDate}</div>
                  </td>
                  <td className="p-4">
                    {(() => {
                      const costObj = getClientGcpCost(client);
                      return (
                        <>
                          <div className="text-sm font-medium text-emerald-600 font-mono">
                            R$ {costObj.cost.toFixed(costObj.isReal ? 2 : 4)}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            {costObj.isReal ? 'Fatura Real (CSV)' : client.lastGcpMetrics ? 'Estimado por API' : 'Sem métricas'}
                          </div>
                        </>
                      );
                    })()}
                  </td>
                  <td className="p-4">
                    {client.status === 'active' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent border border-accent text-xs font-semibold text-black">
                        <Rocket className="w-3.5 h-3.5" />
                        Ativo
                      </span>
                    )}
                    {client.status === 'trial' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500 border border-blue-500 text-xs font-semibold text-white">
                        <Clock className="w-3.5 h-3.5" />
                        {client?.trialEndDate ? 'Trial - ' + Math.max(0, Math.ceil((new Date(client.trialEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) + ' dias restantes' : 'Trial'}
                      </span>
                    )}
                    {client.status === 'suspended' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 border border-rose-500 text-xs font-semibold text-white">
                        <Hand className="w-3.5 h-3.5" />
                        Suspenso
                      </span>
                    )}
                    {client.status === 'ended' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500 border border-zinc-500 text-xs font-semibold text-white">
                        <Power className="w-3.5 h-3.5" />
                        Encerrado
                      </span>
                    )}
                    {client.status === 'developing' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500 border border-purple-500 text-xs font-semibold text-white">
                        <Code className="w-3.5 h-3.5" />
                        Em construção
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200 text-zinc-600">
                      {client.firebaseProjectId || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:p-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => onClientSelect && onClientSelect(client.id)}
                className="bg-white border border-zinc-200/75 rounded-3xl p-5 hover:border-zinc-300 shadow-xs transition-colors cursor-pointer group flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-lg font-display font-medium text-zinc-500 overflow-hidden shrink-0" title={client.name}>
                    {client.logoUrl ? (
                        <img src={client.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        client.logoInitials
                    )}
                  </div>
                  <div>
                    {client.status === 'active' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent border border-accent text-[10px] font-semibold text-black">
                        <Rocket className="w-3 h-3" />
                        Ativo
                      </span>
                    )}
                    {client.status === 'trial' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500 border border-blue-500 text-[10px] font-semibold text-white">
                        <Clock className="w-3 h-3" />
                        {client?.trialEndDate ? 'Trial - ' + Math.max(0, Math.ceil((new Date(client.trialEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) + ' dias restantes' : 'Trial'}
                      </span>
                    )}
                    {client.status === 'suspended' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 border border-rose-500 text-[10px] font-semibold text-white">
                        <Hand className="w-3 h-3" />
                        Suspenso
                      </span>
                    )}
                    {client.status === 'ended' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500 border border-zinc-500 text-[10px] font-semibold text-white">
                        <Power className="w-3 h-3" />
                        Encerrado
                      </span>
                    )}
                    {client.status === 'developing' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500 border border-purple-500 text-[10px] font-semibold text-white">
                        <Code className="w-3 h-3" />
                        Em construção
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-semibold text-zinc-800 mb-1">{client.name}</h4>
                <p className="text-xs text-zinc-500 mb-4 line-clamp-1">{client.domain}</p>
                
                <div className="mt-auto space-y-3 pt-4 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 text-xs">Mensalidade</span>
                    <span className="text-zinc-800 font-medium h-4">R$ {client.monthlyValue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 text-xs">Custo Cloud</span>
                    {(() => {
                      const costObj = getClientGcpCost(client);
                      return (
                        <div className="text-right">
                          <span className="text-emerald-600 font-semibold font-mono h-4">
                            R$ {costObj.cost.toFixed(costObj.isReal ? 2 : 4)}
                          </span>
                          <span className="block text-[8px] text-zinc-500 leading-none">
                            {costObj.isReal ? 'Fatura Real' : 'Estimado'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 text-xs">Plano</span>
                    <span className="text-zinc-800 font-medium h-4">{client.plan}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredClients.length === 0 && (
              <div className="col-span-full p-8 text-center text-zinc-500">
                Nenhum cliente encontrado.
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ClientModal 
          client={editingClient} 
          onClose={handleCloseModal} 
          onSave={handleSaveClient} 
        />
      )}

      <ConfirmationModal
        isOpen={clientToDelete !== null}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (clientToDelete) handleDelete(clientToDelete);
        }}
        onCancel={() => setClientToDelete(null)}
      />

      {/* Modal Nova Transação / Contratos */}
      {isContractsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 w-full max-w-4xl shadow-sm flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-xl font-display font-bold">Mensalidades e Planos</h2>
              <button 
                onClick={() => setIsContractsModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {clients.map(c => (
                <div key={c.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 w-full shrink-0 min-w-44">
                    <h3 className="font-semibold text-zinc-800">{c.name}</h3>
                    <p className="text-xs text-zinc-500">{c.domain || c.cnpj || 'Sem info'}</p>
                    {c.status !== 'active' && <span className="inline-block mt-1 text-[10px] uppercase font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded">Inativo</span>}
                  </div>
                  <div className="w-full md:w-auto grid grid-cols-3 gap-3 flex-1">
                    <div className="relative">
                      <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">Plano</label>
                      <button
                        type="button"
                        onClick={() => setOpenClientPlanDropdownId(openClientPlanDropdownId === c.id ? null : c.id)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent flex items-center justify-between gap-1 select-none cursor-pointer text-left"
                      >
                        <span>{c.plan || 'Starter'}</span>
                        <CD2 className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 shrink-0 ${openClientPlanDropdownId === c.id ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {openClientPlanDropdownId === c.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenClientPlanDropdownId(null)}></div>
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                              className="absolute left-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-sm z-40 py-1 overflow-hidden min-w-[130px]"
                              style={{ transformOrigin: 'top left' }}
                            >
                              {['Starter', 'Pro', 'Enterprise'].map(planName => (
                                <button
                                  key={planName}
                                  type="button"
                                  onClick={async () => {
                                    await updateClientField(c.id, { plan: planName });
                                    setOpenClientPlanDropdownId(null);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${(c.plan || 'Starter') === planName ? 'text-accent font-semibold hover:bg-zinc-50' : 'text-zinc-700 hover:bg-zinc-50'}`}
                                >
                                  <span>{planName}</span>
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">Valor Mensal</label>
                      <input 
                        type="number"
                        defaultValue={c.monthlyValue || 0}
                        onBlur={async (e) => await updateClientField(c.id, { monthlyValue: Number(e.target.value) })}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">Vencimento (Dia)</label>
                      <input 
                        type="number"
                        min="1" max="31"
                        defaultValue={c.dueDate || 1}
                        onBlur={async (e) => await updateClientField(c.id, { dueDate: Number(e.target.value) })}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {clients.length === 0 && (
                <div className="text-center text-zinc-500 py-8">Nenhum cliente cadastrado.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
