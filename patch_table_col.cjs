const fs = require('fs');

let content = fs.readFileSync('src/components/investments/InvestmentsView.tsx', 'utf8');

// Remove header
content = content.replace(/<th className="py-4 px-6">Estilo Visual<\/th>\s*/, '');

// Remove row data
const tdRegex = /<td className="py-4 px-6">\s*<span className=\{\`inline-block px-2\.5 py-1 rounded-full text-\[10px\] font-extrabold uppercase \$\{[\s\S]*?\}\`\}>\s*\{inv\.logoType === 'black' \? 'Escuro' : inv\.logoType === 'green' \? 'Verde Tóxico' : 'Claro'\}\s*<\/span>\s*<\/td>/;
content = content.replace(tdRegex, '');

fs.writeFileSync('src/components/investments/InvestmentsView.tsx', content);
