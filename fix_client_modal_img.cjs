const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');

content = content.replace(
  '<img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />',
  '<img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />'
);

fs.writeFileSync('src/components/clients/ClientModal.tsx', content);
