const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

content = content.replace(
  '<img src={client.logoUrl} alt="Logo" className="w-full h-full object-contain" />',
  '<img src={client.logoUrl} alt="Logo" className="w-full h-full object-cover" />'
);

fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
