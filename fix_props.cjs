const fs = require('fs');

let cContent = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');
cContent = cContent.replace(
  'export function ClientsView({ onClientSelect }: { onClientSelect?: (id: string) => void }) {',
  'export function ClientsView({ onClientSelect, onNavigate }: { onClientSelect?: (id: string) => void, onNavigate?: (v: any, id?: string) => void }) {'
);
fs.writeFileSync('src/components/clients/ClientsView.tsx', cContent);

let mContent = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');
mContent = mContent.replace(
  'export function MonitorView() {',
  'export function MonitorView({ onNavigate }: { onNavigate?: (v: any, id?: string) => void }) {'
);
fs.writeFileSync('src/components/monitor/MonitorView.tsx', mContent);

let fContent = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');
fContent = fContent.replace(/import \{ cn \} from '..\/..\/utils';\n/g, ''); // Fix duplicate cn import
fContent = `import { cn } from '../../utils';\n` + fContent;
fs.writeFileSync('src/components/finance/FinanceView.tsx', fContent);

