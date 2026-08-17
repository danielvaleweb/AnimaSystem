const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

// Add states
content = content.replace(
  'const [showStatusMenu, setShowStatusMenu] = useState(false);',
  `const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState('');`
);

// Modify handleToggleStatus
const oldHandleToggle = `  const handleToggleStatus = async (status: 'active' | 'suspended' | 'ended' | 'developing' | 'trial') => {
    if (!client) return;
    try {
      await updateDoc(doc(db, 'clients', client.id), { status });
      setShowStatusMenu(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status do cliente.');
    }
  };`;

const newHandleToggle = `  const handleToggleStatus = async (status: 'active' | 'suspended' | 'ended' | 'developing' | 'trial') => {
    if (!client) return;
    if (status === 'trial') {
      setIsTrialModalOpen(true);
      setShowStatusMenu(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'clients', client.id), { status, trialEndDate: null });
      setShowStatusMenu(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status do cliente.');
    }
  };

  const handleConfirmTrial = async () => {
    if (!client || !trialEndDate) return;
    try {
      await updateDoc(doc(db, 'clients', client.id), { status: 'trial', trialEndDate });
      setIsTrialModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status para trial.');
    }
  };`;
content = content.replace(oldHandleToggle, newHandleToggle);

// Add modal JSX before final return wrapper closing
const modalJsx = `
      {isTrialModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-2 text-zinc-900">Período de Trial</h3>
            <p className="text-sm text-zinc-500 mb-4">Selecione a data de encerramento do trial (quando deverá mudar para o status ativo).</p>
            <input 
              type="date"
              value={trialEndDate}
              onChange={(e) => setTrialEndDate(e.target.value)}
              className="w-full bg-white border border-zinc-200 text-zinc-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-accent mb-6"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setIsTrialModalOpen(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmTrial}
                disabled={!trialEndDate}
                className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-black font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('    </div>\n  );\n}', modalJsx + '    </div>\n  );\n}');

fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
