import { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, Edit2, Ban, Trash2, CheckCircle2 } from 'lucide-react';
import { ClientData } from '../../types';
import { cn } from '../../utils';
import { ClientModal } from './ClientModal';
import { db, auth } from '../../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';

export function ClientsView({ onClientSelect }: { onClientSelect?: (id: string) => void }) {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData: ClientData[] = [];
      snapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() } as ClientData);
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

  const handleToggleStatus = async (id: string, newStatus: 'active' | 'suspended') => {
    try {
      if (!auth.currentUser) return;
      await updateDoc(doc(db, 'clients', id), {
        status: newStatus,
        ownerId: auth.currentUser.uid,
      });
      setActiveMenuId(null);
    } catch (error) {
      console.error(error);
      alert('Error updating status');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, 'clients', id));
      } catch (error) {
        console.error(error);
        alert('Error deleting client');
      }
    }
    setActiveMenuId(null);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800/50 rounded-[2rem] overflow-hidden">
      
      {/* Toolbar */}
      <div className="p-6 border-b border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative group w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou domínio..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-accent/50 outline-none rounded-full py-2.5 pl-11 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 transition-all"
            />
          </div>
          
          <div className="relative hidden sm:block">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-full py-2.5 pl-4 pr-10 outline-none focus:border-accent/50 transition-all"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="trial">Em Trial</option>
              <option value="suspended">Suspensos</option>
            </select>
            <Filter className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-zinc-950 font-semibold py-2.5 px-6 rounded-full transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Table List */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800/50 text-sm text-zinc-500 bg-zinc-950/20">
              <th className="font-medium p-4 pl-6">Cliente</th>
              <th className="font-medium p-4">Plano</th>
              <th className="font-medium p-4">Mensalidade</th>
              <th className="font-medium p-4">Status</th>
              <th className="font-medium p-4">Firebase ID</th>
              <th className="font-medium p-4 text-right pr-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filteredClients.map((client) => (
              <tr 
                key={client.id} 
                className="hover:bg-zinc-800/20 transition-colors group cursor-pointer"
                onClick={() => onClientSelect && onClientSelect(client.id)}
              >
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-display font-medium text-zinc-300">
                      {client.logoInitials}
                    </div>
                    <div>
                      <h4 className="font-medium text-zinc-200">{client.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-500">{client.domain}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                        <span className="text-xs text-zinc-500">{client.responsible}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex px-2.5 py-1 rounded-md bg-zinc-800 text-xs font-medium text-zinc-300 border border-zinc-700/50">
                    {client.plan}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium text-zinc-300">R$ {client.monthlyValue.toFixed(2)}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Venc. dia {client.dueDate}</div>
                </td>
                <td className="p-4">
                  {client.status === 'active' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                      Ativo
                    </span>
                  )}
                  {client.status === 'trial' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Trial
                    </span>
                  )}
                  {client.status === 'suspended' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      Suspenso
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span className="font-mono text-xs text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                    {client.firebaseProjectId}
                  </span>
                </td>
                <td className="p-4 text-right pr-6 relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === client.id ? null : client.id); }}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Actions Dropdown */}
                  {activeMenuId === client.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)}></div>
                      <div className="absolute right-6 top-14 w-48 bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4 text-zinc-500" />
                          Editar Cliente
                        </button>
                        
                        {client.status === 'active' || client.status === 'trial' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(client.id, 'suspended'); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <Ban className="w-4 h-4" />
                            Suspender
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(client.id, 'active'); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Reativar
                          </button>
                        )}
                        
                        <div className="h-px bg-zinc-800/50 my-1"></div>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 border-t-zinc-800 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
            
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ClientModal 
          client={editingClient} 
          onClose={handleCloseModal} 
          onSave={handleSaveClient} 
        />
      )}
    </div>
  );
}
