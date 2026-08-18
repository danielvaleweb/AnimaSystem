const fs = require('fs');

let content = fs.readFileSync('src/types.ts', 'utf8');
content = content.replace(
  '  gcpBillingLastSync?: string;\n}',
  '  gcpBillingLastSync?: string;\n  createdAt?: string;\n}'
);

fs.writeFileSync('src/types.ts', content);
