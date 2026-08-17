const fs = require('fs');
let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

content = content.replace("} RefreshCw } from 'lucide-react';", ", RefreshCw } from 'lucide-react';");

fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
