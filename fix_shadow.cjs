const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');
content = content.replace(
  'className="flex bg-zinc-800 rounded-xl overflow-hidden shadow-sm h-8 mt-0.5"',
  'className="flex bg-zinc-800 rounded-xl overflow-hidden h-8 mt-0.5"'
);
fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
