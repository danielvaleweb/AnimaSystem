const fs = require('fs');

let content = fs.readFileSync('src/components/investments/InvestmentsView.tsx', 'utf8');

const regex = /<div className="space-y-2">\s*<label className="text-\[11px\] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Visual \/ Card Estilo<\/label>[\s\S]*?<\/div>\s*<\/div>/;

content = content.replace(regex, '');

fs.writeFileSync('src/components/investments/InvestmentsView.tsx', content);
