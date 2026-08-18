const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');
content = content.replace(
  '<div key={client.id} className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center overflow-hidden z-10" style={{ zIndex: 4 - idx }}>',
  '<div key={client.id} title={client.name} className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center overflow-hidden z-10" style={{ zIndex: 4 - idx }}>'
);
fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
