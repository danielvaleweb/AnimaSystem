const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');

const oldFooter = `        <div className="p-6 border-t border-zinc-200 flex items-center justify-end gap-3 bg-white rounded-b-3xl">
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
}`;

const newFooter = `        </div>
      </div>
      
      <div className="bg-white border-t border-zinc-200 p-6 sticky bottom-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-medium text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="client-form"
            className="px-6 py-2.5 rounded-full text-sm font-semibold bg-accent text-black hover:bg-accent-hover transition-colors cursor-pointer"
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
}`;

content = content.replace(oldFooter, newFooter);
fs.writeFileSync('src/components/clients/ClientModal.tsx', content);
