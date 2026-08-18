const fs = require('fs');

const stateCode = fs.readFileSync('stateCode.txt', 'utf8');

const newJSX = `
  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-zinc-50 flex flex-col"
    >
      {/* Header Fixo */}
      <div className="bg-white border-b border-zinc-200 shrink-0 shadow-sm z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
          <h2 className="font-display font-bold space-x-2 text-2xl text-zinc-900">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Área de Conteúdo Rolável */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <form id="client-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Informações da Empresa */}
            <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm space-y-8">
              <h3 className="font-display font-bold text-xl text-zinc-900 border-b border-zinc-100 pb-4">
                Informações da Empresa
              </h3>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 border border-zinc-100 rounded-2xl bg-zinc-50/50">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-300 flex items-center justify-center bg-white overflow-hidden transition-all group-hover:border-accent group-hover:bg-accent/5">
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
                        className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-medium text-zinc-900">Logo do Cliente</h4>
                    <p className="text-xs text-zinc-500">Recomendado: 256x256px, formato PNG ou JPG.</p>
                    <div className="flex items-center gap-3 mt-2">
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
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Alterar Logo
                      </button>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setShowRemoveLogoConfirm(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Nome da Empresa *</label>
                    <input 
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                      placeholder="Nome do cliente/projeto"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">CNPJ</label>
                    <input 
                      name="cnpj"
                      value={formData.cnpj || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Domínio (sem https://)</label>
                    <input 
                      name="domain"
                      value={formData.domain || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                      placeholder="exemplo.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Site da Empresa</label>
                    <input 
                      name="website"
                      value={formData.website || formData.domain || ''}
                      onChange={(e) => { 
                         handleChange(e); 
                         setFormData(prev => ({ ...prev, domain: e.target.value }));
                      }}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                      placeholder="www.exemplo.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">URL da Logo (ou use upload acima)</label>
                    <input 
                      name="logoUrl"
                      value={formData.logoUrl || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Status</label>
                    <select
                      name="status"
                      value={formData.status || 'active'}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    >
                      <option value="active">Ativo</option>
                      <option value="trial">Trial</option>
                      <option value="developing">Em construção</option>
                      <option value="suspended">Suspenso</option>
                      <option value="ended">Encerrado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Data de Contratação</label>
                    <input 
                      type="date"
                      name="hireDate"
                      value={formData.hireDate || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Data de Encerramento</label>
                    <input 
                      type="date"
                      name="endDate"
                      value={formData.endDate || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-zinc-100">
                  <h4 className="font-medium text-zinc-800 mb-4">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">CEP</label>
                      <input 
                        name="cep"
                        value={formData.cep || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-zinc-700">Rua</label>
                      <input 
                        name="street"
                        value={formData.street || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Número</label>
                      <input 
                        name="number"
                        value={formData.number || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Bairro</label>
                      <input 
                        name="neighborhood"
                        value={formData.neighborhood || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Complemento</label>
                      <input 
                        name="complement"
                        value={formData.complement || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Infos do Contratante */}
            <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm space-y-8">
              <h3 className="font-display font-bold text-xl text-zinc-900 border-b border-zinc-100 pb-4">
                Informações do Contratante (Responsável)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Nome do Responsável *</label>
                  <input 
                    name="responsible"
                    value={formData.responsible || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="Nome completo do contato"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">CPF</label>
                  <input 
                    name="cpf"
                    value={formData.cpf || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">E-mail do Responsável</label>
                  <input 
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Telefone / WhatsApp</label>
                  <input 
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="(00) 90000-0000"
                  />
                </div>
              </div>
            </div>

            {/* 3. Infos do Banco de Dados (Firebase) */}
            <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm space-y-8">
              <h3 className="font-display font-bold text-xl text-zinc-900 border-b border-zinc-100 pb-4">
                Configurações de Banco de Dados (Firebase)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Firebase Project ID</label>
                  <input 
                    name="firebaseProjectId"
                    value={formData.firebaseProjectId || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="exemplo-projeto-123"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Nome do Banco de Dados</label>
                  <input 
                    name="firebaseDatabaseName"
                    value={formData.firebaseDatabaseName || '(default)'}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="(default)"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-zinc-700 flex justify-between">
                    <span>Firebase SDK Config (Objeto de configuração)</span>
                  </label>
                  <textarea 
                    name="firebaseSdkConfig"
                    value={formData.firebaseSdkConfig || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-4 outline-none focus:border-accent text-zinc-900 text-sm transition-all font-mono h-32"
                    placeholder={\`const firebaseConfig = {\\n  apiKey: "AIza...",\\n  authDomain: "...",\\n  projectId: "..."\\n};\`}
                  />
                  <p className="text-xs text-zinc-500">Cole a configuração para extrair o ID do projeto automaticamente.</p>
                </div>
              </div>
            </div>

            {/* 4. Infos Financeiro */}
            <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm space-y-8">
              <h3 className="font-display font-bold text-xl text-zinc-900 border-b border-zinc-100 pb-4">
                Informações de Cobrança (Financeiro)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Plano Contratado</label>
                  <select
                    name="plan"
                    value={formData.plan || 'Starter'}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Nenhum">Nenhum (Sem contrato ativo)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Valor Mensal (R$)</label>
                  <input 
                    type="number"
                    name="monthlyValue"
                    value={formData.monthlyValue !== undefined ? formData.monthlyValue : 290}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="290"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Dia do Vencimento</label>
                  <input 
                    type="number"
                    name="dueDate"
                    value={formData.dueDate !== undefined ? formData.dueDate : 5}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="5"
                    min="1"
                    max="31"
                  />
                </div>
              </div>
            </div>
            
            {client && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-4">
                 <div className="space-y-1">
                   <h4 className="text-sm font-semibold text-emerald-800">Editando Cliente Existente</h4>
                   <p className="text-sm text-emerald-700">
                     Certifique-se de salvar suas alterações através do botão inferior antes de sair da página.
                   </p>
                 </div>
              </div>
            )}
            
            {/* Espaço extra no final para garantir rolagem completa antes do footer fixo */}
            <div className="h-8"></div>
          </form>
        </div>
      </div>

      {/* Footer Fixo */}
      <div className="bg-white border-t border-zinc-200 p-6 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-20">
        <div className="max-w-6xl mx-auto flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-full text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="client-form"
            className="px-8 py-3 rounded-full text-sm font-bold bg-accent text-black hover:bg-[#bce600] transition-colors cursor-pointer shadow-sm hover:shadow"
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
    </motion.div>
  );
}
`;

fs.writeFileSync('src/components/clients/ClientModal.tsx', stateCode + newJSX);
