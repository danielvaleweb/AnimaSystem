import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, Database,
  FileText, MoreVertical, Edit2, Ban, Trash2, CheckCircle,
  Rocket, Power, Code, Hand, Clock
} from 'lucide-react';
import { ClientData } from '../../types';
import { cn } from '../../utils';
import { db, auth, app } from '../../lib/firebase';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { ClientModal } from './ClientModal';

interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
}

type TabType = 'resumo';

export function ClientDetailView({ clientId, onBack }: ClientDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('resumo');
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'clients', clientId), (docSnap) => {
      if (docSnap.exists() && docSnap.data().ownerId === auth.currentUser?.uid) {
        setClient({ id: docSnap.id, ...docSnap.data() } as ClientData);
      } else {
        setClient(null);
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId]);

  const handleToggleStatus = async (status: 'active' | 'suspended' | 'ended' | 'developing' | 'trial') => {
    if (!client) return;
    try {
      await updateDoc(doc(db, 'clients', client.id), { status });
      setShowStatusMenu(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status do cliente.');
    }
  };

  const handleDelete = async () => {
    if (!client) return;
    if (confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      try {
        if (client.logoUrl) {
          const { getStorage, ref, deleteObject } = await import('firebase/storage');
          const hubStorage = getStorage(app, 'gs://animahub.firebasestorage.app');
          const fileRef = ref(hubStorage, client.logoUrl);
          await deleteObject(fileRef).catch(e => console.error("Error deleting logo", e));
        }
        await deleteDoc(doc(db, 'clients', client.id));
        onBack();
      } catch (e) {
        console.error(e);
        alert('Erro ao excluir cliente.');
      }
    }
  };

  const handleSaveClient = async (data: ClientData) => {
    if (!client) return;
    try {
      const { id, ...updateData } = data;
      await updateDoc(doc(db, 'clients', client.id), updateData as any);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar cliente.');
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'resumo', label: 'Resumo', icon: FileText },
  ];

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Carregando dados do cliente...</div>;
  }

  if (!client) {
    return <div className="p-8 text-center text-zinc-500">Cliente não encontrado ou sem permissão.</div>;
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header Profile Info */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-700 flex items-center justify-center text-2xl font-display font-medium text-zinc-300 overflow-hidden p-1.5">
              {client.logoUrl ? (
                <img src={client.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                client.logoInitials
              )}
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-100 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="truncate max-w-[150px] sm:max-w-none">{client.name}</span>

                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
                  {client.plan}
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-[11px] sm:text-sm text-zinc-400">
                <span className="truncate max-w-[120px] sm:max-w-none">{client.domain || client.website}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                <span className="truncate max-w-[120px] sm:max-w-none">ID: {client.firebaseProjectId || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions Menu */}
        <div className="flex items-center gap-2">
          
          {/* Status Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-1.5 transition-colors cursor-pointer",
                client.status === 'active' ? "bg-accent/10 border-accent/20 text-accent hover:bg-accent/20" :
                client.status === 'trial' ? "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20" :
                client.status === 'ended' ? "bg-zinc-500/10 border-zinc-500/20 text-zinc-400 hover:bg-zinc-500/20" :
                client.status === 'developing' ? "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20" :
                "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
              )}
            >
              {client.status === 'active' ? (
                <><Rocket className="w-3.5 h-3.5" />Ativo</>
              ) : client.status === 'trial' ? (
                <><Clock className="w-3.5 h-3.5" />Trial</>
              ) : client.status === 'ended' ? (
                <><Power className="w-3.5 h-3.5" />Encerrado</>
              ) : client.status === 'developing' ? (
                <><Code className="w-3.5 h-3.5" />Em construção</>
              ) : (
                <><Hand className="w-3.5 h-3.5" />Suspenso</>
              )}
            </button>

            {showStatusMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)}></div>
                <div className="absolute right-0 top-10 w-44 bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                  <button onClick={() => handleToggleStatus('active')} className="w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-zinc-800 flex items-center gap-3">
                    <Rocket className="w-4 h-4" /> Ativo
                  </button>
                  <button onClick={() => handleToggleStatus('trial')} className="w-full text-left px-4 py-2.5 text-sm text-blue-400 hover:bg-zinc-800 flex items-center gap-3">
                    <Clock className="w-4 h-4" /> Trial
                  </button>
                  <button onClick={() => handleToggleStatus('suspended')} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-zinc-800 flex items-center gap-3">
                    <Hand className="w-4 h-4" /> Suspenso
                  </button>
                  <button onClick={() => handleToggleStatus('ended')} className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800 flex items-center gap-3">
                    <Power className="w-4 h-4" /> Encerrado
                  </button>
                  <button onClick={() => handleToggleStatus('developing')} className="w-full text-left px-4 py-2.5 text-sm text-purple-400 hover:bg-zinc-800 flex items-center gap-3">
                    <Code className="w-4 h-4" /> Em construção
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-12 w-48 bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                <button 
                  onClick={() => { setShowMenu(false); setIsEditing(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4 text-zinc-500" />
                  Editar Cliente
                </button>
                
                <div className="h-px bg-zinc-800/50 my-1"></div>
                
                <button 
                  onClick={() => { setShowMenu(false); handleDelete(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>

      {isEditing && (
        <ClientModal 
          client={client}
          onClose={() => setIsEditing(false)}
          onSave={handleSaveClient}
        />
      )}

      {/* Navigation Tabs */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-1.5 flex overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-zinc-800 text-zinc-100" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-accent" : "text-zinc-500")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'resumo' && (
          <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2rem] p-6 lg:p-10 space-y-12">
            
            {/* Informações da Empresa */}
            <div>
              <h3 className="text-lg font-display font-medium text-zinc-100 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" /> Informações da Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Nome da Empresa</span>
                  <span className="text-zinc-200">{client.name || '---'}</span>
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">CNPJ</span>
                  <span className="text-zinc-200">{client.cnpj || '---'}</span>
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Site da empresa</span>
                  {(client.website || client.domain) ? (
                    <a 
                      href={((client.website || client.domain) || '').startsWith('http') ? (client.website || client.domain) : `https://${client.website || client.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent hover:underline break-words"
                    >
                      {client.website || client.domain}
                    </a>
                  ) : (
                    <span className="text-zinc-200">---</span>
                  )}
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Data da contratação</span>
                  <span className="text-zinc-200">{client.hireDate ? new Date(client.hireDate).toLocaleDateString() : '---'}</span>
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Data do encerramento</span>
                  <span className="text-zinc-200">{client.endDate ? new Date(client.endDate).toLocaleDateString() : '---'}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-zinc-800/50 w-full" />

            {/* Informações do Responsável */}
            <div>
              <h3 className="text-lg font-display font-medium text-zinc-100 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" /> Informações do Responsável
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Nome do responsável</span>
                  <span className="text-zinc-200">{client.responsible || '---'}</span>
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">CPF</span>
                  <span className="text-zinc-200">{client.cpf || '---'}</span>
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Telefone</span>
                  <span className="text-zinc-200">{client.phone || '---'}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-zinc-800/50 w-full" />

            {/* Endereço */}
            <div>
              <h3 className="text-lg font-display font-medium text-zinc-100 mb-6 flex items-center gap-2">
                <Database className="w-5 h-5 text-accent" /> Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">CEP</span>
                  <span className="text-zinc-200">{client.cep || '---'}</span>
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                  <span className="block text-sm text-zinc-500 mb-1">Rua</span>
                  <span className="text-zinc-200">{client.street || '---'}</span>
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Número</span>
                  <span className="text-zinc-200">{client.number || '---'}</span>
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Bairro</span>
                  <span className="text-zinc-200">{client.neighborhood || '---'}</span>
                </div>
                <div>
                  <span className="block text-sm text-zinc-500 mb-1">Complemento</span>
                  <span className="text-zinc-200">{client.complement || '---'}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
