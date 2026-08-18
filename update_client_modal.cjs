const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');

// 1. Import motion
if (!content.includes("import { motion }")) {
  content = content.replace("import { ConfirmationModal } from '../ConfirmationModal';", "import { ConfirmationModal } from '../ConfirmationModal';\nimport { motion } from 'motion/react';");
}

// 2. Change the wrapper to full screen with motion
const oldWrapper = `  return (
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

        <div className="p-6 overflow-auto custom-scrollbar">`;

const newWrapper = `  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-zinc-50 flex flex-col overflow-hidden"
    >
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-6">
          <h2 className="font-display font-bold space-x-2 text-2xl text-zinc-900">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] border border-zinc-200 p-8 shadow-sm">`;

content = content.replace(oldWrapper, newWrapper);


// 3. Footer / Button changes
const oldFooter = `        </div>
        
        <div className="p-6 border-t border-zinc-200 flex justify-end gap-3 bg-zinc-50 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="client-form"
            className="px-6 py-2.5 text-sm font-medium bg-accent text-black rounded-xl hover:bg-[#bce600] transition-colors"
          >
            {client ? 'Salvar Alterações' : 'Criar Cliente'}
          </button>
        </div>
      </div>`;

const newFooter = `        </div>
      </div>
      
      <div className="bg-white border-t border-zinc-200 p-6 sticky bottom-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="client-form"
            className="px-6 py-2.5 text-sm font-medium bg-accent text-black rounded-xl hover:bg-[#bce600] transition-colors"
          >
            {client ? 'Salvar Alterações' : 'Criar Cliente'}
          </button>
        </div>
      </div>
    </motion.div>`;

content = content.replace(oldFooter, newFooter);

// 4. Add the Firebase fields before Informações de Cobrança
const oldSection = `            <hr className="border-zinc-200" />

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg text-zinc-800">Informações de Cobrança (Financeiro)</h3>`;

const newSection = `            <hr className="border-zinc-200" />

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg text-zinc-800">Configurações de Banco de Dados (Firebase)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Firebase Project ID</label>
                  <input 
                    name="firebaseProjectId"
                    value={formData.firebaseProjectId || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="Ex: meu-projeto-123"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Nome do Banco de Dados</label>
                  <input 
                    name="firebaseDatabaseName"
                    value={formData.firebaseDatabaseName || '(default)'}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="(default)"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium text-zinc-500 flex items-center justify-between">
                  <span>Firebase SDK Config (Objeto JSON completo ou fragmento)</span>
                </label>
                <textarea 
                  name="firebaseSdkConfig"
                  value={formData.firebaseSdkConfig || ''}
                  onChange={handleChange}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all font-mono h-24"
                  placeholder='{\n  apiKey: "AIza...",\n  authDomain: "...",\n  projectId: "..."\n}'
                />
                <p className="text-xs text-zinc-500">
                  Cole o config. O Project ID será extraído automaticamente.
                </p>
              </div>
            </div>

            <hr className="border-zinc-200" />

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg text-zinc-800">Informações de Cobrança (Financeiro)</h3>`;

content = content.replace(oldSection, newSection);

// Close tags for the newWrapper
content = content.replace(
  `      {showRemoveLogoConfirm && (
        <ConfirmationModal 
          title="Remover Logomarca"
          message="Tem certeza que deseja remover a logomarca do cliente? Esta ação não pode ser desfeita."
          onConfirm={handleRemoveLogo}
          onCancel={() => setShowRemoveLogoConfirm(false)}
        />
      )}
    </div>
  );
}`, 
  `      {showRemoveLogoConfirm && (
        <ConfirmationModal 
          title="Remover Logomarca"
          message="Tem certeza que deseja remover a logomarca do cliente? Esta ação não pode ser desfeita."
          onConfirm={handleRemoveLogo}
          onCancel={() => setShowRemoveLogoConfirm(false)}
        />
      )}
    </motion.div>
  );
}`
);

fs.writeFileSync('src/components/clients/ClientModal.tsx', content);
