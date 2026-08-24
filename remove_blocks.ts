import fs from 'fs';

let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

const dbConfigRegex = /\{\s*selectedClient && \(\s*<div className="bg-white border border-zinc-200\/80 rounded-\[2rem\] p-6 lg:p-8 flex flex-col mt-6">\s*<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">\s*<h3 className="font-display text-lg font-bold flex items-center gap-2 text-black min-w-0">\s*<Server className="w-5 h-5 text-accent shrink-0" \/>\s*<span className="truncate">Configuração do Banco de Dados \(\{selectedClient\.name\}\)<\/span>.*?<\/div>\s*\)\}/s;

const reportRegex = /\{\/\* Relatório Comparativo \(Administrativo\) \*\/\}\s*\{selectedClient && gcpMetrics && !editingFirebase && \(\s*<div className="bg-white border border-zinc-200\/80 rounded-\[2rem\] p-6 lg:p-8 flex flex-col mt-6">\s*<h3 className="font-display text-lg font-bold mb-6 flex items-center gap-2 text-black">\s*<Activity className="w-5 h-5 text-accent" \/>\s*Relatório Comparativo \(Administrativo\)\s*<\/h3>.*?<\/div>\s*\)\}/s;

let newContent = content.replace(dbConfigRegex, '');
newContent = newContent.replace(reportRegex, '');

if (newContent !== content) {
    fs.writeFileSync('src/components/monitor/MonitorView.tsx', newContent);
    console.log("Blocks removed.");
} else {
    console.log("Could not find blocks to remove.");
}

