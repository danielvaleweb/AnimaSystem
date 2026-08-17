const fs = require('fs');

let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

content = content.replace(
  /setFormData\(\{\n\s*type: 'entrada',/g,
  "setFormData({\n      title: '',\n      clientName: '',\n      type: 'entrada',"
);

fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
console.log("Reset patched.");
