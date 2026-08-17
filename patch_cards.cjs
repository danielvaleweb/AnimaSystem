const fs = require('fs');
let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

// The grid div is `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">`
// Let's find it.
const gridStart = '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">';
const parts = content.split(gridStart);

if (parts.length > 1) {
  // We need to change Card 2, 3, and 4 slightly.
  // We can do standard string replacements inside parts[1].
  
  // Card 2: Última checagem
  let c2 = parts[1];
  
  // Card 2 replacement
  c2 = c2.replace(
    /\{\/\* Card 2: Última checagem \*\/\}\s*<div className="bg-white border border-zinc-200\/80 rounded-2xl p-5/g,
    '{/* Card 2: Última checagem */}\n        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5'
  );
  // Change text colors for Card 2
  // <span className="text-zinc-500 text-xs font-medium mb-1.5 block">Última checagem</span>
  c2 = c2.replace(
    /<span className="text-zinc-500 text-xs font-medium mb-1.5 block">Última checagem<\/span>/g,
    '<span className="text-zinc-400 text-xs font-medium mb-1.5 block">Última checagem</span>'
  );
  // <div className="text-zinc-900 font-bold text-lg flex items-center gap-2">
  c2 = c2.replace(
    /<div className="text-zinc-900 font-bold text-lg flex items-center gap-2">/g,
    '<div className="text-white font-bold text-lg flex items-center gap-2">'
  );
  
  // Card 3: Plano Contratado
  c2 = c2.replace(
    /\{\/\* Card 3: Plano Contratado \*\/\}\s*<div className="bg-white border border-zinc-200\/80 rounded-2xl p-5/g,
    '{/* Card 3: Plano Contratado */}\n        <div className="bg-[#D7FE03] border border-transparent rounded-2xl p-5'
  );
  // <span className="text-zinc-500 text-xs font-medium mb-1.5 block">Plano Contratado</span>
  c2 = c2.replace(
    /<span className="text-zinc-500 text-xs font-medium mb-1.5 block">Plano Contratado<\/span>/g,
    '<span className="text-black/60 text-xs font-medium mb-1.5 block">Plano Contratado</span>'
  );
  // <div className="text-zinc-900 font-bold text-lg flex items-center gap-2">
  c2 = c2.replace(
    /\{\/\* Card 3: Plano Contratado \*\/\}[\s\S]*?<div className="text-zinc-900 font-bold text-lg flex items-center gap-2">/,
    match => match.replace('text-zinc-900', 'text-black')
  );
  // The icon color in Card 3
  c2 = c2.replace(
    /<Zap className="w-5 h-5 text-\[\#D7FE03\]" \/>/g,
    '<Zap className="w-5 h-5 text-black" />'
  );

  // Card 4: Ambiente Ativo
  // It is already white. But the text is green.
  // <div className="text-[#D7FE03] font-bold text-lg truncate">
  c2 = c2.replace(
    /<div className="text-\[\#D7FE03\] font-bold text-lg truncate">/g,
    '<div className="text-[#a1c200] font-bold text-lg truncate">' // Make it slightly darker so it's readable on white? The prompt says "verde", #D7FE03 might be hard to read on white, but let's keep it if they want. Actually let's use text-[#bbf000] or something similar but visible. Let's just use text-[#c0e600]. Wait, let's look at the print.
  );
  
  content = parts[0] + gridStart + c2;
  fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
  console.log("Patched monitor cards!");
}
