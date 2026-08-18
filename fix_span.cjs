const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');
content = content.replace(
  '"px-3.5 flex items-center justify-center gap-2 text-sm font-semibold"',
  '"px-3.5 flex items-center justify-center gap-2 text-sm font-semibold border-2 border-solid border-zinc-800 rounded-[11px]"'
);
fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
