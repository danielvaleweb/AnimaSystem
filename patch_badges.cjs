const fs = require('fs');

function formatTrialText(clientVarName) {
  return `Trial\${${clientVarName}?.trialEndDate ? \` - \${Math.max(0, Math.ceil((new Date(${clientVarName}.trialEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} dias restantes\` : ''}`;
}

// 1. ClientDetailView.tsx
let cdContent = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');
cdContent = cdContent.replace(
  '<><Clock className="w-3.5 h-3.5" />Trial</>',
  `<><Clock className="w-3.5 h-3.5" />{${formatTrialText('client')}}</>`
);
fs.writeFileSync('src/components/clients/ClientDetailView.tsx', cdContent);

// 2. MonitorView.tsx
let mContent = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');
mContent = mContent.replace(
  "{selectedClient?.status === 'trial' && <><Clock className=\"w-4 h-4\" /> Trial</>}",
  `{selectedClient?.status === 'trial' && <><Clock className="w-4 h-4" /> {${formatTrialText('selectedClient')}}</>}`
);
fs.writeFileSync('src/components/monitor/MonitorView.tsx', mContent);

// 3. ClientsView.tsx
let clContent = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');
// For list view:
clContent = clContent.replace(
  '<Clock className="w-3 h-3" />\n                        Trial',
  `<Clock className="w-3 h-3" />\n                        {${formatTrialText('client')}}`
);
// For grid view:
clContent = clContent.replace(
  '<Clock className="w-3.5 h-3.5" />\n                        Trial',
  `<Clock className="w-3.5 h-3.5" />\n                        {${formatTrialText('client')}}`
);

fs.writeFileSync('src/components/clients/ClientsView.tsx', clContent);
