const fs = require('fs');

let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

// 1. Cliente / Descrição
content = content.replace(
  '<label className="text-sm font-medium text-zinc-500">Cliente / Descrição</label>',
  '<label className="text-sm font-medium text-zinc-500">{formData.type === \'saida\' ? \'Título da Saída\' : \'Cliente / Descrição\'}</label>'
);

// 2. Hide client search autocomplete for 'saida'
content = content.replace(
  '{isClientSearchFocused && clientsData && clientsData.length > 0 && (',
  '{formData.type !== \'saida\' && isClientSearchFocused && clientsData && clientsData.length > 0 && ('
);

// 3. Status and grid
// Replace the grid start
content = content.replace(
  '<div className="grid grid-cols-2 gap-4">',
  '<div className={`grid gap-4 ${formData.type === \'saida\' ? \'grid-cols-1\' : \'grid-cols-2\'}`}>'
);

// Hide the whole status block if saida
content = content.replace(
  '<div className="space-y-1.5 relative">\n                  <label className="text-sm font-medium text-zinc-500">Status</label>',
  '{formData.type !== \'saida\' && (\n                <div className="space-y-1.5 relative">\n                  <label className="text-sm font-medium text-zinc-500">Status</label>'
);

// Close the conditional block before the next grid
content = content.replace(
  /<\/div>\n\s*<\/div>\n\s*<div className="grid grid-cols-1 gap-4">/,
  '</div>\n                )}\n              </div>\n\n              <div className="grid grid-cols-1 gap-4">'
);

// 4. Hide method of payment
content = content.replace(
  '<div className="space-y-1.5 relative">\n                  <label className="text-sm font-medium text-zinc-500">Método de Recebimento</label>',
  '{formData.type !== \'saida\' && (\n                <div className="space-y-1.5 relative">\n                  <label className="text-sm font-medium text-zinc-500">Método de Recebimento</label>'
);

// Close the conditional block before the submit buttons
content = content.replace(
  /<\/div>\n\s*<\/div>\n\s*<div className="pt-4 flex justify-end gap-3">/,
  '</div>\n                )}\n              </div>\n\n              <div className="pt-4 flex justify-end gap-3">'
);

fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
console.log("FinanceView Patched successfully!");
