const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

// List view
content = content.replace(
  '<img src={client.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />',
  '<img src={client.logoUrl} alt="Logo" className="w-full h-full object-cover" />'
);

// Grid view
content = content.replace(
  '<img src={client.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />',
  '<img src={client.logoUrl} alt="Logo" className="w-full h-full object-cover" />'
);

fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
