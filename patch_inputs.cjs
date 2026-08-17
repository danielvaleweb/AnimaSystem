const fs = require('fs');

let content = fs.readFileSync('src/components/investments/InvestmentsView.tsx', 'utf8');

const regex = /<div className="grid grid-cols-2 gap-4">\s*<div className="space-y-1\.5">\s*<label className="text-\[11px\] font-extrabold uppercase tracking-widest text-zinc-500">Preço Atual<\/label>[\s\S]*?<\/div>\s*<\/div>/;

content = content.replace(regex, '');

fs.writeFileSync('src/components/investments/InvestmentsView.tsx', content);
