import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ClientData } from '../../types';

interface ClientModalProps {
  client: ClientData | null;
  onClose: () => void;
  onSave: (clientData: ClientData) => void;
}

export function ClientModal({ client, onClose, onSave }: ClientModalProps) {
  const [formData, setFormData] = useState<Partial<ClientData>>({
    name: '',
    responsible: '',
    logoInitials: '',
    domain: '',
    projectName: '',
    plan: 'Starter',
    firebaseProjectId: '',
    firebaseDatabaseName: '(default)',
    firebaseSdkConfig: '',
    monthlyValue: 290,
    dueDate: 5,
    status: 'active'
  });

  useEffect(() => {
    if (client) setFormData(client);
  }, [client]);

  useEffect(() => {
    if (formData.firebaseSdkConfig) {
      const projectIdMatch = formData.firebaseSdkConfig.match(/projectId['"]?\s*:\s*['"]([^'"]+)['"]/);
      if (projectIdMatch && projectIdMatch[1] && !formData.firebaseProjectId) {
        setFormData(prev => ({ ...prev, firebaseProjectId: projectIdMatch[1] }));
      }
    }
  }, [formData.firebaseSdkConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.domain || !formData.firebaseProjectId) return;
    
    // Cast number fields properly
    formData.monthlyValue = Number(formData.monthlyValue) || 0;
    formData.dueDate = Number(formData.dueDate) || 1;

    // Generate initials if not provided
    if (!formData.logoInitials) {
      formData.logoInitials = formData.name.substring(0, 2).toUpperCase();
    }
    
    // Try to parse firebaseSdkConfig
    if (formData.firebaseSdkConfig) {
      try {
        let parsed = null;
        try {
          parsed = JSON.parse(formData.firebaseSdkConfig);
        } catch (e) {
          const match = formData.firebaseSdkConfig.match(/{\s*(?:['"]?apiKey['"]?\s*:[\s\S]+)\s*}/);
          if (match) {
            const getObj = new Function(`return ${match[0]}`);
            parsed = getObj();
          }
        }
        if (parsed && typeof parsed === 'object') {
          formData.parsedFirebaseConfig = parsed;
          if (parsed.projectId && !formData.firebaseProjectId) {
            formData.firebaseProjectId = parsed.projectId;
          }
        }
      } catch (err) {
        console.warn('Could not parse SDK config', err);
      }
    }
    
    onSave(formData as ClientData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="font-display font-bold space-x-2 text-xl">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-auto">
          <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Nome da Empresa *</label>
                <input 
                  required
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 text-sm transition-all"
                  placeholder="Ex: TechFlow Solutions"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Responsável *</label>
                <input 
                  required
                  name="responsible"
                  value={formData.responsible || ''}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 text-sm transition-all"
                  placeholder="Nome do contato principal"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Domínio *</label>
                <input 
                  required
                  name="domain"
                  value={formData.domain || ''}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 text-sm transition-all"
                  placeholder="exemplo.com.br"
                />
              </div>
            </div>

            <hr className="border-zinc-800" />

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg text-zinc-200">Integração Firebase</h3>
              <p className="text-sm text-zinc-400">Configure as credenciais e o projeto do Firebase deste cliente. Ao colar a configuração (JSON ou export const firebaseConfig = {"{...}"}), isso permitirá que você acesse o banco de dados do cliente diretamente da Master. Lembre-se de rodar <code className="bg-zinc-800 px-1 py-0.5 rounded text-accent">npm install firebase</code> no projeto cliente.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Nome do Projeto</label>
                  <input 
                    name="projectName"
                    value={formData.projectName || ''}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 text-sm transition-all"
                    placeholder="Ex: App Cliente"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">ID do Projeto *</label>
                  <input 
                    required
                    name="firebaseProjectId"
                    value={formData.firebaseProjectId || ''}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 text-sm transition-all font-mono"
                    placeholder="meu-projeto-1234"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Nome do Banco de Dados</label>
                  <input 
                    name="firebaseDatabaseName"
                    value={formData.firebaseDatabaseName || ''}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 text-sm transition-all font-mono"
                    placeholder="(default)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Configurações do SDK (JSON ou JS)</label>
                <textarea 
                  name="firebaseSdkConfig"
                  value={formData.firebaseSdkConfig || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, firebaseSdkConfig: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-accent/50 text-sm transition-all font-mono h-32 resize-none"
                  placeholder="Cole aqui a configuração do SDK gerada no Firebase console..."
                />
              </div>
            </div>

            <hr className="border-zinc-800" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Plano</label>
                <select 
                  name="plan"
                  value={formData.plan || 'Starter'}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 text-sm transition-all appearance-none"
                >
                  <option value="Starter">Starter</option>
                  <option value="Pro">Pro</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Mensalidade (R$)</label>
                <input 
                  type="number"
                  name="monthlyValue"
                  value={formData.monthlyValue || ''}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 text-sm transition-all"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Dia de Vencimento</label>
                <input 
                  type="number"
                  name="dueDate"
                  value={formData.dueDate || ''}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-accent/50 text-sm transition-all"
                  min="1"
                  max="31"
                />
              </div>
            </div>

            {client && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex gap-4 mt-6">
                 <div className="space-y-1">
                   <h4 className="text-sm font-medium text-orange-400">Atenção ao alterar o Project ID</h4>
                   <p className="text-xs text-orange-300/80">
                     A modificação do Firebase Project ID deve ser coordenada com o provisionamento no backend para não causar lentidão ou perda de conexão no dashboard do cliente.
                   </p>
                 </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-zinc-800 flex items-center justify-end gap-3 bg-zinc-950/50 rounded-b-3xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="client-form"
            className="px-6 py-2.5 rounded-full text-sm font-semibold bg-accent hover:bg-accent-hover text-zinc-950 transition-colors"
          >
            {client ? 'Salvar Alterações' : 'Criar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}
