const fs = require('fs');

let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

// 1. Header text
content = content.replace(
  /<h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-100 leading-tight">Monitoramento de Consumo \(NOC\)<\/h2>/g,
  '<h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">Monitoramento de Consumo (NOC)</h2>'
);

// 2. The 4 Top Cards (KPIs)
// bg-[#101112] border border-zinc-200/80 rounded-2xl p-5 ...
content = content.replace(
  /bg-\[\#101112\]/g,
  'bg-white'
);

// The title in Card 1 is text-zinc-500, then realBillingCost is text-emerald-600.
// But some texts inside these cards might be text-zinc-100 or zinc-400 that need changing to zinc-900/zinc-800.
content = content.replace(
  /text-zinc-100/g,
  'text-zinc-900'
);

// 3. Badges "Isento ate..."
content = content.replace(
  /bg-zinc-800 text-zinc-500/g,
  'bg-zinc-100 text-zinc-600'
);

// 4. Buttons
// "Atualizar" button is `bg-accent text-zinc-900`. User wants "botões verde com texto preto".
// It is already `bg-accent` (green) and `text-zinc-900`. 
// "Sincronizar Faturamento (CSV)" is `bg-white text-zinc-800`. Should it be green too? 
// The user said "botões verde com texto preto". Let's make "Sincronizar Faturamento" green as well, or at least check if it needs to be.
// Wait, the user said "mude o design para que fique como branco e o texto preto botões verde com texto preto".
// Maybe I'll change the "Sincronizar Faturamento (CSV)" button to be green.

content = content.replace(
  /<button type="button" onClick=\{() => setIsCsvModalOpen\(true\)\} className="flex items-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800/g,
  '<button type="button" onClick={() => setIsCsvModalOpen(true)} className="flex items-center gap-2 bg-accent hover:bg-accent-hover border border-accent text-zinc-900'
);

// Debug buttons (Descobrir Métricas Firestore / Modo Debug OFF)
content = content.replace(
  /bg-blue-500\/20 text-blue-400 hover:bg-blue-500\/30/g,
  'bg-blue-50 text-blue-600 hover:bg-blue-100'
);
content = content.replace(
  /bg-zinc-800 text-zinc-400 hover:bg-zinc-700/g,
  'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
);
content = content.replace(
  /bg-accent\/20 text-accent hover:bg-accent\/30/g,
  'bg-accent/20 text-zinc-900 hover:bg-accent/30'
);

// Write to file
fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
console.log("Visuals fixed.");
