const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

// Back button
content = content.replace(
  /className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-100 transition-colors cursor-pointer"/g,
  'className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer shadow-sm"'
);

// Title color
content = content.replace(
  /className="font-display text-xl sm:text-2xl font-bold text-zinc-100 flex flex-wrap items-center gap-2 sm:gap-3"/g,
  'className="font-display text-xl sm:text-2xl font-bold text-zinc-900 flex flex-wrap items-center gap-2 sm:gap-3"'
);

// "Pro" pill color (let's check if it matches design, the image shows it dark which might be intentional, but let's see. The design has bg dark grey text white for the badge "Pro")
// I will keep it as bg-zinc-800 text-white

fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
console.log("Header patched");
