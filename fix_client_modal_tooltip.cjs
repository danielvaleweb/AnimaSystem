const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');
content = content.replace(
  '<div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0 border border-zinc-700/50 overflow-hidden">',
  '<div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0 border border-zinc-700/50 overflow-hidden" title={formData.name || \'Logo\'}>'
);
fs.writeFileSync('src/components/clients/ClientModal.tsx', content);
