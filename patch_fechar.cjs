const fs = require('fs');

let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

content = content.replace(
  /className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-black rounded-xl font-semibold text-sm transition-colors cursor-pointer"/,
  'className="px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 rounded-xl font-semibold text-sm transition-colors cursor-pointer"'
);

fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
console.log("Patched Fechar Painel");
