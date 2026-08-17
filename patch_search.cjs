const fs = require('fs');
let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

content = content.replace(
  'const matchesSearch = trx.clientName?.toLowerCase().includes(search.toLowerCase());',
  'const matchesSearch = trx.clientName?.toLowerCase().includes(search.toLowerCase()) || trx.title?.toLowerCase().includes(search.toLowerCase());'
);

// We should also replace the overdue modal to display the title:
// `<h4 className="font-bold text-zinc-900">{t.clientName || 'Cliente sem nome'}</h4>`
content = content.replace(
  /<h4 className="font-bold text-zinc-900">\{t\.clientName \|\| 'Cliente sem nome'\}<\/h4>/g,
  '<h4 className="font-bold text-zinc-900">{t.title || t.clientName || \'Cliente sem nome\'}</h4>\n                            {t.title && t.clientName && <p className="text-xs text-zinc-500 font-medium">{t.clientName}</p>}'
);


fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
console.log("Search & overdue modal patched.");
