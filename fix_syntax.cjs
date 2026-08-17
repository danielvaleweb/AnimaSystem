const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');
content = content.replace('\\n\\n  if (isClientView', '\n\n  if (isClientView');
fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
