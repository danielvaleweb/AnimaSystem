import fs from 'fs';

// 1. Fix NocHubDashboard.tsx
let dashboard = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');
dashboard = dashboard.replace(
  'const daysLeft = renewInfo.daysUntilRenewal;',
  'const daysLeft = renewInfo.days;'
);
fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', dashboard);

// 2. Fix ClientsView.tsx - remove the <td> between Mensalidade and Custo Cloud
let clientsView = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');
const lines = clientsView.split('\n');
let newLines = [];
let skip = false;
let divs = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<td className="p-4">')) {
    if (lines[i+1] && lines[i+1].includes('{(() => {') && lines[i+2] && lines[i+2].includes('const renewInfo = getClientRenewalInfo(client);')) {
      skip = true;
      divs = 1;
      continue;
    }
  }
  
  if (skip) {
    if (lines[i].includes('<td')) divs++;
    if (lines[i].includes('</td')) divs--;
    
    if (divs === 0) {
      skip = false;
    }
    continue;
  }
  
  newLines.push(lines[i]);
}
fs.writeFileSync('src/components/clients/ClientsView.tsx', newLines.join('\n'));

