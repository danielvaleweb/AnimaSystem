const fs = require('fs');
let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

const importRegex = /import \{ (.*?) \} from 'lucide-react';/;
content = content.replace(importRegex, "import { $1, RefreshCw } from 'lucide-react';");

fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
