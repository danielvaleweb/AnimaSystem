const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');
content = content.replace(
  'className="w-16 h-16 rounded-2xl bg-white border border-zinc-300 flex items-center justify-center text-2xl font-display font-medium text-zinc-700 overflow-hidden p-1.5"',
  'className="w-16 h-16 rounded-2xl bg-white border border-zinc-300 flex items-center justify-center text-2xl font-display font-medium text-zinc-700 overflow-hidden" title={client.name}'
);
fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
