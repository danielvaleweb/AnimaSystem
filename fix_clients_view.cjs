const fs = require('fs');

let clContent = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

function formatTrialText(clientVarName) {
  return `${clientVarName}?.trialEndDate ? 'Trial - ' + Math.max(0, Math.ceil((new Date(${clientVarName}.trialEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) + ' dias restantes' : 'Trial'`;
}

// Find lines containing the broken literal and replace them
clContent = clContent.replace(
  /\{`Trial\$\{[^}]+\}[^}]+\}`\}/g,
  `{${formatTrialText('client')}}`
);

fs.writeFileSync('src/components/clients/ClientsView.tsx', clContent);
