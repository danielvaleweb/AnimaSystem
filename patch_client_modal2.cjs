const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');

// Fix the "Alterar Logo" / "Fazer Upload" button
content = content.replace(
  /className="flex items-center gap-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-800 px-3 py-1.5 rounded-lg transition-colors border border-zinc-700\/50 disabled:opacity-50"/g,
  'className="flex items-center gap-2 text-xs bg-white hover:bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-lg transition-colors border border-zinc-200 disabled:opacity-50"'
);

// Fix the Cancel button
content = content.replace(
  /className="px-6 py-2.5 rounded-full text-sm font-medium text-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"/g,
  'className="px-6 py-2.5 rounded-full text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors cursor-pointer"'
);

// Also check the "Remover" button
content = content.replace(
  /text-red-400 px-3 py-1.5 rounded-lg transition-colors border border-red-500\/20/g,
  'text-red-600 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20'
);

fs.writeFileSync('src/components/clients/ClientModal.tsx', content);
console.log("Patched 2");
