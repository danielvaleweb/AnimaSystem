const fs = require('fs');

let content = fs.readFileSync('src/components/investments/InvestmentsView.tsx', 'utf8');

// Replace dark backgrounds and text colors to match the new light theme
content = content.replace(/bg-black text-white/g, 'bg-white text-black');
content = content.replace(/bg-black text-zinc-400/g, 'bg-white text-zinc-500');
content = content.replace(/bg-zinc-900/g, 'bg-zinc-50');
content = content.replace(/bg-zinc-950/g, 'bg-white');
content = content.replace(/bg-\[\#111\]/g, 'bg-white');

content = content.replace(/text-white/g, 'text-black');
content = content.replace(/text-zinc-400/g, 'text-zinc-500');
content = content.replace(/text-zinc-300/g, 'text-zinc-600');
content = content.replace(/border-zinc-800/g, 'border-zinc-200');

// Fix specific things in the cards overview section:
content = content.replace(/bg-black border border-zinc-800/g, 'bg-white border border-zinc-200');

// For the active table header
content = content.replace(/bg-zinc-900\/50/g, 'bg-zinc-100');

// Make the cards in the overview look better
content = content.replace(/bg-black rounded-3xl/g, 'bg-white rounded-3xl border border-zinc-200 shadow-sm');
content = content.replace(/bg-black border border-zinc-200/g, 'bg-white border border-zinc-200'); // sometimes it was replaced weirdly

// Update the buttons inside the modal "Visual / Card Estilo"
content = content.replace(/{ type: 'black', label: 'Preto', class: 'bg-black text-black' }/g, "{ type: 'black', label: 'Preto', class: 'bg-black text-white' }");
content = content.replace(/ring-offset-black/g, 'ring-offset-white');

fs.writeFileSync('src/components/investments/InvestmentsView.tsx', content);

