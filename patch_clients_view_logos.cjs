const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

// List view: w-10 h-10 rounded-xl
content = content.replace(
  /className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-sm font-display font-medium text-zinc-500 overflow-hidden shrink-0"/g,
  'className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-sm font-display font-medium text-zinc-500 overflow-hidden shrink-0"'
);

// List view img: p-1.5
// We want to replace it with p-2
content = content.replace(
  /className="w-full h-full object-contain p-1\.5"/g,
  'className="w-full h-full object-contain p-2"'
);

// Grid view: w-12 h-12 rounded-xl
content = content.replace(
  /className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-lg font-display font-medium text-zinc-500 overflow-hidden shrink-0"/g,
  'className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-lg font-display font-medium text-zinc-500 overflow-hidden shrink-0"'
);

// The grid view image has already been replaced by the p-1.5 regex above!

fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
console.log("ClientsView logos patched");
