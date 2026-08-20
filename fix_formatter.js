const fs = require('fs');
let code = fs.readFileSync('src/components/investments/InvestmentsView.tsx', 'utf8');
code = code.replace(/formatter=\{\(value\) =>/g, 'formatter={(value: any) =>');
fs.writeFileSync('src/components/investments/InvestmentsView.tsx', code);
console.log("Formatter fixed");
