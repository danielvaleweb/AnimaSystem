import { useState, useEffect, FormEvent } from 'react';
import { 
  UserCheck, ShieldCheck, Mail, Plus, Trash2, 
  Search, Shield, Users, Clock, AlertTriangle, Check
} from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNotification } from './NotificationContext';
import { cn } from '../utils';
import { ConfirmationModal } from './ConfirmationModal';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export function CollaboratorAuthView() {
  const { showSuccess, showError } = useNotification();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collaboratorToDelete, setCollaboratorToDelete] = useState<Collaborator | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Suporte');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load collaborators in real-time
  useEffect(() => {
    const q = query(collection(db, 'authorized_collaborators'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Collaborator[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Collaborator);
      });
      setCollaborators(list);
      setLoading(false);
    }, (error) => {
      console.error("Error loading collaborators:", error);
      showError("Erro", "Não foi possível carregar os colaboradores autorizados.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddCollaborator = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    // Check duplicate email client-side
    const exists = collaborators.some(c => c.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) {
      showError("E-mail Duplicado", "Este e-mail de colaborador já está autorizado!");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'authorized_collaborators'), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        department,
        status: 'active',
        createdAt: new Date().toISOString()
      });

      showSuccess("Colaborador Autorizado", `${name} foi adicionado à lista de acessos permitidos.`);
      setName('');
      setEmail('');
      setDepartment('Suporte');
    } catch (error) {
      console.error("Error adding collaborator:", error);
      showError("Falha ao salvar", "Ocorreu um erro ao autorizar o e-mail.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (colab: Collaborator) => {
    try {
      const docRef = doc(db, 'authorized_collaborators', colab.id);
      const newStatus = colab.status === 'active' ? 'inactive' : 'active';
      await updateDoc(docRef, { status: newStatus });
      showSuccess("Status Atualizado", `O status de ${colab.name} foi alterado para ${newStatus === 'active' ? 'Ativo' : 'Inativo'}.`);
    } catch (error) {
      console.error("Error updating status:", error);
      showError("Erro", "Não foi possível alterar o status do colaborador.");
    }
  };

  const handleDeleteCollaborator = async (colab: Collaborator) => {
    try {
      await deleteDoc(doc(db, 'authorized_collaborators', colab.id));
      showSuccess("Autorização Revogada", `O e-mail ${colab.email} não tem mais acesso de colaborador.`);
      setCollaboratorToDelete(null);
    } catch (error) {
      console.error("Error deleting collaborator:", error);
      showError("Erro", "Não foi possível revogar o acesso do colaborador.");
    }
  };

  const filteredCollaborators = collaborators.filter(colab => {
    const q = searchQuery.toLowerCase();
    return colab.name.toLowerCase().includes(q) || 
           colab.email.toLowerCase().includes(q) || 
           colab.department.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-zinc-100">Autorizar Login Colaborador</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Gerencie as contas do Google Workspace autorizadas a acessar o painel administrativo da AnimaSystem.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Column */}
        <div className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-[2rem] p-6 lg:p-8 space-y-6">
          <div>
            <h3 className="font-display text-lg font-bold text-zinc-100">Autorizar Novo E-mail</h3>
            <p className="text-zinc-500 text-xs mt-1">Insira os dados do colaborador para liberar seu acesso imediatamente via login Google.</p>
          </div>

          <form onSubmit={handleAddCollaborator} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome Completo</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-2.5 text-sm text-zinc-800 outline-none focus:border-accent/50 transition-all font-light placeholder:text-zinc-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">E-mail Corporativo (Google)</label>
              <div className="relative flex items-center bg-white border border-zinc-200/80 rounded-xl px-4">
                <Mail className="w-4 h-4 text-zinc-600 shrink-0 mr-3" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colaborador@animasystem.com"
                  className="w-full bg-transparent border-none py-2.5 text-sm text-zinc-800 outline-none font-light placeholder:text-zinc-700 focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Departamento / Área</label>
              <select 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-2.5 text-sm text-zinc-800 outline-none focus:border-accent/50 transition-all font-light"
              >
                <option value="Diretoria">Diretoria</option>
                <option value="Suporte">Suporte / NOC</option>
                <option value="Desenvolvimento">Desenvolvimento</option>
                <option value="Comercial">Comercial</option>
                <option value="Financeiro">Financeiro</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D7FE03] hover:bg-[#c4e602] disabled:opacity-50 text-black font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(215,254,3,0.1)] flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? "Salvando..." : "Autorizar Acesso"}
            </button>
          </form>

          <div className="bg-white border border-zinc-200/80 rounded-xl p-4 flex gap-3 text-xs text-zinc-500 font-light">
            <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <span>Qualquer colaborador com este e-mail poderá autenticar usando o botão "Acessar com Google Workspace" na Home.</span>
          </div>
        </div>

        {/* Right Table Column */}
        <div className="lg:col-span-8 bg-white border border-zinc-200/80 rounded-[2rem] p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-zinc-100">Colaboradores Credenciados</h3>
              <p className="text-zinc-500 text-xs mt-1">Todos os endereços de e-mail atualmente autorizados a entrar no sistema.</p>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2.5 bg-white border border-zinc-200 rounded-xl px-3.5 py-2 w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-500 shrink-0" />
              <input 
                type="text"
                placeholder="Buscar colaborador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-zinc-800 outline-none w-full placeholder:text-zinc-600 focus:ring-0"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Buscando autorizações...</p>
            </div>
          ) : filteredCollaborators.length === 0 ? (
            <div className="border border-dashed border-zinc-200 rounded-2xl py-12 text-center text-zinc-500 text-sm space-y-2">
              <Users className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="font-medium">Nenhum colaborador encontrado.</p>
              <p className="text-xs text-zinc-600">Altere sua busca ou autorize um novo colaborador ao lado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                    <th className="px-5 py-4">Colaborador</th>
                    <th className="px-5 py-4">Departamento</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 bg-white/30">
                  {filteredCollaborators.map((colab) => (
                    <tr key={colab.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-sm text-zinc-100">{colab.name}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{colab.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-zinc-700 font-medium px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-300/50">
                          {colab.department}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleStatus(colab)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                            colab.status === 'active' 
                              ? "bg-accent border-accent text-black font-semibold hover:bg-[#bbf000]" 
                              : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-600"
                          )}
                        >
                          {colab.status === 'active' ? "Ativo" : "Inativo"}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setCollaboratorToDelete(colab)}
                          className="p-2 hover:bg-zinc-100 rounded-lg text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                          title="Revogar Acesso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={collaboratorToDelete !== null}
        title="Revogar Acesso de Colaborador"
        message={`Tem certeza de que deseja remover a autorização de acesso para ${collaboratorToDelete?.name}? Ele(a) perderá o acesso imediatamente.`}
        confirmText="Revogar Acesso"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (collaboratorToDelete) handleDeleteCollaborator(collaboratorToDelete);
        }}
        onCancel={() => setCollaboratorToDelete(null)}
      />
    </div>
  );
}
