const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');
content = content.replace(
  'className="w-full h-full object-contain p-3"',
  'className="w-full h-full object-cover"'
);

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
