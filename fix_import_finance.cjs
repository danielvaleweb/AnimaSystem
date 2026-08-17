const fs = require('fs');
let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

// Append import { RefreshCw } from 'lucide-react'; at the top if not present
if (!content.includes("import { RefreshCw }")) {
  content = content.replace("from 'lucide-react';", "RefreshCw } from 'lucide-react';");
}

fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
