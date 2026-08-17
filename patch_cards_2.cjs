const fs = require('fs');
let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

const gridStart = '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">';
const parts = content.split(gridStart);

if (parts.length > 1) {
  let c2 = parts[1];
  
  // Card 2: Última Checagem
  c2 = c2.replace(
    /\{\/\* Card 2: Última Checagem \*\/\}\s*<div className="bg-white border border-zinc-200\/80 rounded-2xl p-5/g,
    '{/* Card 2: Última Checagem */}\n        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5'
  );
  c2 = c2.replace(
    /<span className="text-zinc-500 text-xs font-medium mb-1.5 block">Última checagem<\/span>/g,
    '<span className="text-zinc-400 text-xs font-medium mb-1.5 block">Última checagem</span>'
  );
  c2 = c2.replace(
    /<div className="text-zinc-900 font-bold text-lg flex items-center gap-2">/g,
    '<div className="text-white font-bold text-lg flex items-center gap-2">'
  );
  
  // Card 3: Plano Contratado
  c2 = c2.replace(
    /\{\/\* Card 3: Plano Contratado \*\/\}\s*<div className="bg-white border border-zinc-200\/80 rounded-2xl p-5/g,
    '{/* Card 3: Plano Contratado */}\n        <div className="bg-[#D7FE03] border border-transparent rounded-2xl p-5'
  );
  c2 = c2.replace(
    /<span className="text-zinc-500 text-xs font-medium mb-1.5 block">Plano Contratado<\/span>/g,
    '<span className="text-black/60 text-xs font-medium mb-1.5 block">Plano Contratado</span>'
  );
  
  // Need to replace the `text-zinc-900` inside Card 3 div
  const card3Start = '{/* Card 3: Plano Contratado */}';
  const card4Start = '{/* Card 4: Ambiente Ativo */}';
  
  let card3Block = c2.substring(c2.indexOf(card3Start), c2.indexOf(card4Start));
  card3Block = card3Block.replace(/text-zinc-900/g, 'text-black');
  card3Block = card3Block.replace(/text-\[\#D7FE03\]/g, 'text-black');
  card3Block = card3Block.replace(/text-emerald-500/g, 'text-black');
  
  c2 = c2.substring(0, c2.indexOf(card3Start)) + card3Block + c2.substring(c2.indexOf(card4Start));

  // Card 4: Ambiente Ativo (White)
  let card4Block = c2.substring(c2.indexOf(card4Start), c2.indexOf('</div>\n      </div>', c2.indexOf(card4Start)));
  card4Block = card4Block.replace(/text-\[\#D7FE03\]/g, 'text-[#a3ca00]'); // Make it readable
  c2 = c2.substring(0, c2.indexOf(card4Start)) + card4Block + c2.substring(c2.indexOf('</div>\n      </div>', c2.indexOf(card4Start)));
  
  content = parts[0] + gridStart + c2;
  fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
  console.log("Patched monitor cards successfully!");
}
