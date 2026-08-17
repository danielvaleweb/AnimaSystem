const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

// 1. Update interface
content = content.replace(
  /interface Investment \{[\s\S]*?logoType: 'black' \| 'green' \| 'white';\n\}/,
  `interface Investment {
  id: string;
  name: string;
  ticker: string;
  classe?: string;
  corretora?: string;
  quantidade?: number;
  precoMedio?: number;
  precoAtual?: number;
  proventos?: number;
  value: number; // Current Total Value
  valorInvestido?: number;
  changePercent: number;
  logoType: 'black' | 'green' | 'white';
}`
);

// 2. Update rendering calculations
const renderRegex = /const adjustedChange = inv\.changePercent \* periodMult;[\s\S]*?const quantity = \(inv\.name\.length \* 0\.5 \+ 1\.2\)\.toFixed\(4\); \/\/ Mock quantity for layout[\s\S]*?const currentPrice = inv\.value \/ parseFloat\(quantity\); \/\/ Mock current price derived from value/;

const renderReplacement = `const adjustedChange = inv.changePercent * periodMult;
                      const quantity = (inv.quantidade || 0).toFixed(4); 
                      const currentPrice = inv.precoAtual || inv.precoMedio || 0;`;

content = content.replace(renderRegex, renderReplacement);

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);

