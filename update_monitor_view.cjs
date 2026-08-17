const fs = require('fs');
let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

// Remove bq states
content = content.replace(/  const \[bqProjectId, setBqProjectId\] = useState\(\(\) => localStorage\.getItem\('bqProjectId'\) \|\| ''\);\n/, '');
content = content.replace(/  const \[bqDatasetId, setBqDatasetId\] = useState\(\(\) => localStorage\.getItem\('bqDatasetId'\) \|\| ''\);\n/, '');
content = content.replace(/  const \[bqTableId, setBqTableId\] = useState\(\(\) => localStorage\.getItem\('bqTableId'\) \|\| ''\);\n/, '');
content = content.replace(/  const \[isBqSyncing, setIsBqSyncing\] = useState\(false\);\n/, '');
content = content.replace(/  const \[bqError, setBqError\] = useState<string \| null>\(null\);\n/, '');
content = content.replace(/  const \[bqResult, setBqResult\] = useState<any \| null>\(null\);\n/, '');

// Remove handleBqSync
const handleBqSyncRegex = /  const handleBqSync = async \(\) => \{[\s\S]*?    \/\/\s*Show success state on the modal[\s\S]*?  \};\n/;
content = content.replace(handleBqSyncRegex, '');

// Remove isSyncModalOpen state
content = content.replace(/  const \[isSyncModalOpen, setIsSyncModalOpen\] = useState\(false\);\n/, '');

// Remove the sync button from the top toolbar
const syncButtonHtml = `              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="hidden sm:flex items-center justify-center gap-2 bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 font-semibold py-2.5 px-6 rounded-full transition-colors text-sm cursor-pointer"
              >
                <Zap className="w-4 h-4 text-accent" />
                <span>Sincronizar Faturamento</span>
              </button>`;
content = content.replace(syncButtonHtml, '');

// Remove the modal
const syncModalRegex = /      \{\/\* Sincronizar Faturamento Modal \*\/\}\n      <AnimatePresence>[\s\S]*?      <\/AnimatePresence>\n/;
content = content.replace(syncModalRegex, '');

fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
