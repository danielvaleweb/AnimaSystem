const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /<FinanceView \/>/g,
  '<FinanceView onNavigate={handleNavigate} />'
);
content = content.replace(
  /<MonitorView \/>/g,
  '<MonitorView onNavigate={handleNavigate} />'
);
content = content.replace(
  /<AgendaView \/>/g,
  '<AgendaView onNavigate={handleNavigate} />'
);

fs.writeFileSync('src/App.tsx', content);
console.log("App patched.");
