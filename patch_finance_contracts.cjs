const fs = require('fs');
let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

// Replace the button
content = content.replace(
  /<button \n          onClick=\{\(\) => setIsContractsModalOpen\(true\)\}\n          className="flex items-center justify-center gap-2 px-4 py-2\.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-800 font-medium rounded-xl transition-all w-full sm:w-auto text-sm cursor-pointer"\n        >\n          <FileText className="w-4 h-4" \/>\n          Gerenciar Contratos\n        <\/button>/,
  `<button 
          onClick={() => {
            // Sincronizar logic here
            alert("Sincronização financeira iniciada...");
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all w-full sm:w-auto text-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Sincronizar Financeiro
        </button>`
);

// Note: text-zinc-800 was used on bg-zinc-800, which made it invisible or low contrast. I changed it to text-white.

// Remove state vars for contracts modal
content = content.replace(/  const \[isContractsModalOpen, setIsContractsModalOpen\] = useState\(false\);\n/, '');
content = content.replace(/  const \[openClientPlanDropdownId, setOpenClientPlanDropdownId\] = useState<string \| null>\(null\);\n/, '');

// Remove updateClientField
content = content.replace(/  const updateClientField = async \(clientId: string, data: any\) => \{\n    try \{\n      await updateDoc\(doc\(db, 'clients', clientId\), data\);\n    \} catch \(err\) \{\n      handleFirestoreError\(err, OperationType.UPDATE, `clients\/\$\{clientId\}`\);\n    \}\n  \};\n/, '');

// Remove the modal JSX
const modalStart = '      {/* Modal Nova Transação */}';
const modalRealStart = '      {isContractsModalOpen && (';
const nextModalStart = '      {isModalOpen && (';
const startIndex = content.indexOf(modalRealStart);
const endIndex = content.indexOf(nextModalStart);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

// Add RefreshCw to imports if not there
if (!content.includes('RefreshCw')) {
  content = content.replace('import { Plus, ArrowUpRight, ArrowDownRight, DollarSign, Clock, FileText, X, AlertTriangle, AlertCircle, CheckCircle } from \'lucide-react\';', 
    'import { Plus, ArrowUpRight, ArrowDownRight, DollarSign, Clock, FileText, X, AlertTriangle, AlertCircle, CheckCircle, RefreshCw } from \'lucide-react\';');
}

fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
console.log("Patched FinanceView.tsx");
