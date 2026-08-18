const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

// List view
content = content.replace(
  '<div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-sm font-display font-medium text-zinc-500 overflow-hidden shrink-0">',
  '<div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-sm font-display font-medium text-zinc-500 overflow-hidden shrink-0" title={client.name}>'
);

// Grid view
content = content.replace(
  '<div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-lg font-display font-medium text-zinc-500 overflow-hidden shrink-0">',
  '<div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-lg font-display font-medium text-zinc-500 overflow-hidden shrink-0" title={client.name}>'
);

fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
