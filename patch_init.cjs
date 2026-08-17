const fs = require('fs');
let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

content = content.replace(
  /const \[formData, setFormData\] = useState<Partial<TransactionData>>\(\{\n\s*type: 'entrada',/g,
  "const [formData, setFormData] = useState<Partial<TransactionData>>({\n    title: '',\n    clientName: '',\n    type: 'entrada',"
);

fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
console.log("Init patched.");
