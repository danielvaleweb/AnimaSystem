import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Loader2, Image as ImageIcon, Trash2, Building2, User, Database, DollarSign } from 'lucide-react';
import { ClientData } from '../../types';
import { ref, uploadBytesResumable, getDownloadURL, getStorage, deleteObject } from 'firebase/storage';
import { app, db } from '../../lib/firebase';
import { ConfirmationModal } from '../ConfirmationModal';
import { motion } from 'motion/react';

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

  // Lock body scroll and prevent double scrollbars while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const modalContent = (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed inset-0 z-[100] w-full h-[100dvh] bg-[#F5F5F8] flex flex-col overflow-hidden select-auto font-sans"
    >
      {/* 1. Header Fixo Superior */}
      <header className="bg-white border-b border-zinc-200 shrink-0 z-30 shadow-xs">
        <div className="w-full px-6 sm:px-10 xl:px-16 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-zinc-900">
              {client ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            {client?.name && (
              <span className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200">
                {client.name}
              </span>
            )}
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* 2. Área de Conteúdo com Rolagem Única */}
      <main className="flex-1 overflow-y-auto custom-scrollbar w-full relative z-10">
        <div className="w-full px-6 sm:px-10 xl:px-16 py-8">
          <form id="client-form" onSubmit={handleSubmit} className="w-full space-y-8 pb-8">
            
            {/* PARTE 1: Informações da Empresa */}
            <section className="bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 shadow-xs space-y-8">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-900">
                    Informações da Empresa
                  </h3>
                  <p className="text-xs text-zinc-500">Dados cadastrais, links e endereço da empresa</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Logo Upload Box */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 sm:p-6 border border-zinc-200/80 rounded-2xl bg-zinc-50/70">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-300 flex items-center justify-center bg-white overflow-hidden transition-all group-hover:border-accent group-hover:bg-accent/5 shadow-xs">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                      ) : formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-zinc-300" />
                      )}
                    </div>
                    {formData.logoUrl && !uploading && (
                      <button
                        type="button"
                        onClick={() => setShowRemoveLogoConfirm(true)}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Remover Logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-semibold text-zinc-900">Logo do Cliente</h4>
                    <p className="text-xs text-zinc-500">Recomendado: 256x256px, formato PNG ou JPG com fundo transparente ou sólido.</p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-4 h-4" />
                        Alterar Logo
                      </button>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setShowRemoveLogoConfirm(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid de Campos da Empresa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Nome da Empresa *</label>
                    <input 
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                      placeholder="Ex: Tudo Novo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">CNPJ</label>
                    <input 
                      name="cnpj"
                      value={formData.cnpj || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Domínio (sem https://)</label>
                    <input 
                      name="domain"
                      value={formData.domain || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                      placeholder="tudonovojf.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Site da Empresa</label>
                    <input 
                      name="website"
                      value={formData.website || formData.domain || ''}
                      onChange={(e) => { 
                         handleChange(e); 
                         setFormData(prev => ({ ...prev, domain: e.target.value }));
                      }}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                      placeholder="tudonovojf.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">URL da Logo (ou use upload acima)</label>
                    <input 
                      name="logoUrl"
                      value={formData.logoUrl || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                      placeholder="https://firebasestorage.googleapis.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Status</label>
                    <select
                      name="status"
                      value={formData.status || 'active'}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="active">Ativo</option>
                      <option value="trial">Trial</option>
                      <option value="developing">Em construção</option>
                      <option value="suspended">Suspenso</option>
                      <option value="ended">Encerrado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Data de Contratação</label>
                    <input 
                      type="date"
                      name="hireDate"
                      value={formData.hireDate || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Data de Encerramento</label>
                    <input 
                      type="date"
                      name="endDate"
                      value={formData.endDate || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Bloco de Endereço */}
                <div className="pt-6 border-t border-zinc-100 space-y-4">
                  <h4 className="font-semibold text-zinc-800 text-sm">Endereço da Empresa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-600">CEP</label>
                      <input 
                        name="cep"
                        value={formData.cep || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-zinc-600">Rua / Logradouro</label>
                      <input 
                        name="street"
                        value={formData.street || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-600">Número</label>
                      <input 
                        name="number"
                        value={formData.number || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                        placeholder="123"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-600">Bairro</label>
                      <input 
                        name="neighborhood"
                        value={formData.neighborhood || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                        placeholder="Centro"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-600">Complemento</label>
                      <input 
                        name="complement"
                        value={formData.complement || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                        placeholder="Sala 101, Bloco A"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PARTE 2: Informações do Contratante */}
            <section className="bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 shadow-xs space-y-8">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-900">
                    Informações do Contratante
                  </h3>
                  <p className="text-xs text-zinc-500">Dados do responsável direto e contatos</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Nome do Responsável *</label>
                  <input 
                    name="responsible"
                    value={formData.responsible || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="Nome completo do contato principal"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">CPF</label>
                  <input 
                    name="cpf"
                    value={formData.cpf || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">E-mail do Responsável</label>
                  <input 
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Telefone / WhatsApp</label>
                  <input 
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="(00) 90000-0000"
                  />
                </div>
              </div>
            </section>

            {/* PARTE 3: Informações do Banco de Dados (Firebase) */}
            <section className="bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 shadow-xs space-y-8">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-900">
                    Informações do Banco de Dados (Firebase)
                  </h3>
                  <p className="text-xs text-zinc-500">Configuração de banco de dados e monitoramento em tempo real</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Firebase Project ID</label>
                  <input 
                    name="firebaseProjectId"
                    value={formData.firebaseProjectId || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs font-mono"
                    placeholder="exemplo-projeto-123"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Nome do Banco de Dados</label>
                  <input 
                    name="firebaseDatabaseName"
                    value={formData.firebaseDatabaseName || '(default)'}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs font-mono"
                    placeholder="(default)"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-zinc-700 flex justify-between items-center">
                    <span>Firebase SDK Config (Objeto de configuração)</span>
                    <span className="text-xs text-zinc-400 font-normal">Preenche o Project ID automaticamente</span>
                  </label>
                  <textarea 
                    name="firebaseSdkConfig"
                    value={formData.firebaseSdkConfig || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-4 outline-none focus:border-accent text-zinc-900 text-xs sm:text-sm transition-all font-mono h-32 leading-relaxed shadow-2xs"
                    placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "projeto.firebaseapp.com",\n  projectId: "meu-projeto"\n};`}
                  />
                </div>
              </div>
            </section>

            {/* PARTE 4: Informações do Financeiro */}
            <section className="bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 shadow-xs space-y-8">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-900">
                    Informações do Financeiro
                  </h3>
                  <p className="text-xs text-zinc-500">Planos, mensalidade e dia de vencimento</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Plano Contratado</label>
                  <select
                    name="plan"
                    value={formData.plan || 'Starter'}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Profissional">Profissional</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Nenhum">Nenhum (Sem contrato ativo)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Valor Mensal (R$)</label>
                  <input 
                    type="number"
                    name="monthlyValue"
                    value={formData.monthlyValue !== undefined ? formData.monthlyValue : 290}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="290"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Dia do Vencimento</label>
                  <input 
                    type="number"
                    name="dueDate"
                    value={formData.dueDate !== undefined ? formData.dueDate : 5}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="5"
                    min="1"
                    max="31"
                  />
                </div>
              </div>
            </section>
            
            {client && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-3">
                 <div className="space-y-1">
                   <h4 className="text-sm font-bold text-emerald-800">Modo de Edição</h4>
                   <p className="text-xs text-emerald-700">
                     Ao terminar as alterações, clique no botão "Salvar Alterações" no rodapé fixo para gravar os novos dados.
                   </p>
                 </div>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* 3. Rodapé Fixo na Base da Janela */}
      <footer className="bg-white border-t border-zinc-200 py-4 px-6 sm:px-10 xl:px-16 shrink-0 z-30 w-full shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="w-full flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="client-form"
            className="px-8 py-2.5 rounded-full text-sm font-bold bg-accent text-black hover:bg-accent-hover transition-colors cursor-pointer shadow-xs hover:shadow-sm"
          >
            {client ? 'Salvar Alterações' : 'Criar Cliente'}
          </button>
        </div>
      </footer>

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
    </motion.div>
  );

  return createPortal(modalContent, document.body);
}
