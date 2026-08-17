const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Import AgendaView
if (!content.includes("AgendaView")) {
  content = content.replace(
    /import \{ InvestmentsView \} from '\.\/components\/investments\/InvestmentsView';/,
    "import { InvestmentsView } from './components/investments/InvestmentsView';\nimport { AgendaView } from './components/agenda/AgendaView';"
  );
  
  // Add Route
  content = content.replace(
    /<Route path="\/investimentos" element=\{<MainLayout currentView="investments" onNavigate=\{handleNavigate\}><InvestmentsView \/><\/MainLayout>\} \/>/,
    `<Route path="/investimentos" element={<MainLayout currentView="investments" onNavigate={handleNavigate}><InvestmentsView /></MainLayout>} />\n        <Route path="/agenda" element={<MainLayout currentView="agenda" onNavigate={handleNavigate}><AgendaView /></MainLayout>} />`
  );
  
  // Add to handleNavigate
  content = content.replace(
    /v === 'customization' \? 'personalizacao' : v === 'investments' \? 'investimentos' : v\}\`\);/,
    `v === 'customization' ? 'personalizacao' : v === 'investments' ? 'investimentos' : v === 'agenda' ? 'agenda' : v}\`);`
  );
  
  fs.writeFileSync('src/App.tsx', content);
  console.log("App.tsx Patched successfully!");
} else {
  console.log("AgendaView already imported in App.tsx.");
}
