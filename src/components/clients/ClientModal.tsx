import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { ClientData } from '../../types';
import { ref, uploadBytesResumable, getDownloadURL, getStorage, deleteObject } from 'firebase/storage';
import { app, db } from '../../lib/firebase';
import { ConfirmationModal } from '../ConfirmationModal';

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
  const [uploading, setUploading] = useState(false);
  const [showRemoveLogoConfirm, setShowRemoveLogoConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!formData.name) {
      alert("Por favor, preencha o Nome da Empresa.");
      return;
    }
    if (!formData.responsible) {
      alert("Por favor, preencha o Nome do Responsável.");
      return;
    }
    
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const hubStorage = getStorage(app, 'gs://animahub.firebasestorage.app');
      const storageRef = ref(hubStorage, `clientes/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => reject(error),
          () => resolve()
        );
      });

      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, logoUrl: url }));
    } catch (err: any) {
      console.error('Failed to upload logo', err);
      alert(`Erro ao fazer upload da imagem: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!formData.logoUrl) return;
    
    try {
      setUploading(true);
      const hubStorage = getStorage(app, 'gs://animahub.firebasestorage.app');
      const fileRef = ref(hubStorage, formData.logoUrl);
      await deleteObject(fileRef).catch(e => console.error("Logo delete error:", e));
      
      setFormData(prev => ({ ...prev, logoUrl: '' }));
      
      // Immediately save to Firestore to keep it in sync since we deleted from Storage
      if (client?.id) {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'clients', client.id), {
          logoUrl: ''
        });
      }
    } catch (err) {
      console.error('Failed to remove logo', err);
    } finally {
      setUploading(false);
      setShowRemoveLogoConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <h2 className="font-display font-bold space-x-2 text-xl">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-auto custom-scrollbar">
          <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg text-zinc-800">Informações da Empresa</h3>
              
              {/* Logo Upload Section */}
              <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0 border border-zinc-700/50 overflow-hidden">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : formData.logoInitials ? (
                    <span className="text-zinc-500 font-bold text-xl">{formData.logoInitials}</span>
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-500" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-800 mb-1">Logo do Cliente</h4>
                  <p className="text-xs text-zinc-500 mb-3">Recomendado: 256x256px, formato PNG ou JPG.</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 text-xs bg-white hover:bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-lg transition-colors border border-zinc-200 disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploading ? 'Enviando...' : (formData.logoUrl ? 'Alterar Logo' : 'Fazer Upload')}
                    </button>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setShowRemoveLogoConfirm(true)}
                        disabled={uploading}
                        className="flex items-center gap-2 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-600 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Nome da Empresa *</label>
                  <input 
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="Ex: TechFlow Solutions"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Domínio</label>
                  <input 
                    name="domain"
                    value={formData.domain || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="Ex: techflow.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">URL da Logo (ou use upload acima)</label>
                  <input 
                    name="logoUrl"
                    value={formData.logoUrl || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">CNPJ</label>
                  <input 
                    name="cnpj"
                    value={formData.cnpj || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Site da Empresa</label>
                  <input 
                    name="website"
                    value={formData.website || formData.domain || ''}
                    onChange={(e) => {
                       handleChange(e);
                       setFormData(prev => ({ ...prev, domain: e.target.value }));
                    }}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="www.exemplo.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Data de Contratação</label>
                  <input 
                    type="date"
                    name="hireDate"
                    value={formData.hireDate || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Data de Encerramento</label>
                  <input 
                    type="date"
                    name="endDate"
                    value={formData.endDate || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <hr className="border-zinc-200" />

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg text-zinc-800">Informações de Cobrança (Financeiro)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Plano Contratado</label>
                  <select
                    name="plan"
                    value={formData.plan || 'Starter'}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Nenhum">Nenhum (Sem contrato ativo)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Valor Mensal (R$)</label>
                  <input 
                    type="number"
                    name="monthlyValue"
                    value={formData.monthlyValue !== undefined ? formData.monthlyValue : 290}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="Ex: 290"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Dia do Vencimento</label>
                  <input 
                    type="number"
                    name="dueDate"
                    value={formData.dueDate !== undefined ? formData.dueDate : 5}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="Ex: 5"
                    min="1"
                    max="31"
                  />
                </div>
              </div>
            </div>

            <hr className="border-zinc-200" />

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg text-zinc-800">Informações do Responsável</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Nome do Responsável *</label>
                  <input 
                    name="responsible"
                    value={formData.responsible || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="Nome do contato principal"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">CPF</label>
                  <input 
                    name="cpf"
                    value={formData.cpf || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">E-mail do Responsável</label>
                  <input 
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="exemplo@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Telefone</label>
                  <input 
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            <hr className="border-zinc-200" />

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg text-zinc-800">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">CEP</label>
                  <input 
                    name="cep"
                    value={formData.cep || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-zinc-500">Rua</label>
                  <input 
                    name="street"
                    value={formData.street || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Número</label>
                  <input 
                    name="number"
                    value={formData.number || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Bairro</label>
                  <input 
                    name="neighborhood"
                    value={formData.neighborhood || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Complemento</label>
                  <input 
                    name="complement"
                    value={formData.complement || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <hr className="border-zinc-200" />

            {client && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex gap-4 mt-6">
                 <div className="space-y-1">
                   <h4 className="text-sm font-medium text-orange-400">Dados do Cliente Atualizados</h4>
                   <p className="text-xs text-orange-300/80">
                     Lembre-se: As configurações de Firebase (Banco de Dados) foram movidas para a aba Monitoramento e os dados financeiros para a aba Financeiro.
                   </p>
                 </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-zinc-200 flex items-center justify-end gap-3 bg-white rounded-b-3xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="client-form"
            className="px-6 py-2.5 rounded-full text-sm font-semibold bg-accent hover:bg-accent-hover text-black transition-colors"
          >
            {client ? 'Salvar Alterações' : 'Criar Cliente'}
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showRemoveLogoConfirm}
        title="Remover Logo"
        message="Deseja realmente remover a logo do cliente? Esta alteração será salva de imediato."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleRemoveLogo}
        onCancel={() => setShowRemoveLogoConfirm(false)}
      />
    </div>
  );
}
