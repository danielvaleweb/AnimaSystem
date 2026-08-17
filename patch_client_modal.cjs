const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');

// Fix close button hover
content = content.replace(
  /className="p-2 rounded-full hover:bg-zinc-800 text-zinc-500 transition-colors"/g,
  'className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors"'
);

// Fix logo upload section background
content = content.replace(
  /className="flex items-center gap-4 bg-zinc-900\/50 p-4 rounded-xl border border-zinc-200\/80"/g,
  'className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200/80"'
);

// Fix generic inputs
content = content.replace(
  /className="w-full bg-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent\/50 text-sm transition-all"/g,
  'className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"'
);

// Fix number inputs that had text-zinc-800 already
content = content.replace(
  /className="w-full bg-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent\/50 text-sm transition-all text-zinc-800"/g,
  'className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"'
);

fs.writeFileSync('src/components/clients/ClientModal.tsx', content);
console.log("Patched");
