const fs = require('fs');
let content = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

// Add the new tab to state type
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'geral' | 'integracao'>('integracao');",
  "const [activeTab, setActiveTab] = useState<'geral' | 'integracao' | 'sincronizacao'>('integracao');"
);

// Add BQ state variables
const stateVars = `  const [bqProjectId, setBqProjectId] = useState('');
  const [bqDatasetId, setBqDatasetId] = useState('');
  const [bqTableId, setBqTableId] = useState('');
`;
content = content.replace("  const [heroImage, setHeroImage] = useState<string>('');", "  const [heroImage, setHeroImage] = useState<string>('');\n" + stateVars);

// Add to handleSaveSettings
content = content.replace(
  "await setDoc(docRef, { heroImage }, { merge: true });",
  "await setDoc(docRef, { heroImage, bqProjectId, bqDatasetId, bqTableId }, { merge: true });\n      localStorage.setItem('bqProjectId', bqProjectId);\n      localStorage.setItem('bqDatasetId', bqDatasetId);\n      localStorage.setItem('bqTableId', bqTableId);"
);

// Add to initial load
const effectLoader = `  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.heroImage) setHeroImage(data.heroImage);
          if (data.bqProjectId) setBqProjectId(data.bqProjectId);
          if (data.bqDatasetId) setBqDatasetId(data.bqDatasetId);
          if (data.bqTableId) setBqTableId(data.bqTableId);
        } else {
          setBqProjectId(localStorage.getItem('bqProjectId') || '');
          setBqDatasetId(localStorage.getItem('bqDatasetId') || '');
          setBqTableId(localStorage.getItem('bqTableId') || '');
        }
      } catch (err) {}
    };
    loadSettings();
  }, []);`;
content = content.replace("  const handleSaveSettings = async () => {", effectLoader + "\n\n  const handleSaveSettings = async () => {");

// Import getDoc if missing
if (!content.includes('getDoc')) {
  content = content.replace("doc, deleteDoc, updateDoc } from 'firebase/firestore';", "doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';");
}
if (!content.includes('Database')) {
  content = content.replace("Settings2, Bell, Download, Search,", "Settings2, Bell, Download, Search, Database,")
}

// Add the tab button
const syncTabButton = `          <button 
            onClick={() => setActiveTab('sincronizacao')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer",
              activeTab === 'sincronizacao' 
                ? "bg-white text-accent border border-zinc-200/80" 
                : "text-zinc-500 hover:text-zinc-800 hover:bg-white/50 border border-transparent"
            )}
          >
            <Database className="w-4 h-4" />
            Sincronização Fin.
          </button>`;

content = content.replace("        </div>\n\n        {/* Content Area */}", syncTabButton + "\n        </div>\n\n        {/* Content Area */}");

// Add the tab content
const syncTabContent = `
          {activeTab === 'sincronizacao' && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h3 className="font-display text-2xl font-bold mb-2 text-zinc-900">Sincronização Financeira</h3>
                <p className="text-zinc-500 text-sm">Configure os dados do Google Cloud BigQuery para realizar a sincronização automática de faturamento dos projetos dos seus clientes.</p>
              </div>

              <div className="bg-[#fdfee5] border border-accent/20 rounded-xl p-5 mb-6">
                <h4 className="flex items-center gap-2 font-bold text-black mb-3">
                  <Database className="w-4 h-4 text-accent" />
                  Sincronizar Faturamento Google Cloud
                </h4>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  O faturamento real do Google Cloud é consolidado de forma programática exportando o <b>Billing Export</b> para uma tabela do <b>Google BigQuery</b>.<br /><br />
                  O AnimaSystem usa a mesma chave de Service Account configurada para consultar a tabela de faturamento em tempo real, calcular o total mensal de cada projeto e atualizar no Firestore automaticamente!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">BIGQUERY PROJECT ID</label>
                  <input
                    type="text"
                    value={bqProjectId}
                    onChange={(e) => setBqProjectId(e.target.value)}
                    placeholder="animahub"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">DATASET ID</label>
                  <input
                    type="text"
                    value={bqDatasetId}
                    onChange={(e) => setBqDatasetId(e.target.value)}
                    placeholder="faturamento_clientes"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">TABLE ID / EXPORT NAME</label>
                  <input
                    type="text"
                    value={bqTableId}
                    onChange={(e) => setBqTableId(e.target.value)}
                    placeholder="gcp_billing_export_v1"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="bg-accent hover:bg-[#c4e602] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </div>
          )}
`;

content = content.replace("          {activeTab === 'geral' && (", syncTabContent + "\n          {activeTab === 'geral' && (");

fs.writeFileSync('src/components/settings/SettingsView.tsx', content);
