const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');
content = content.replace(
  'if (!formData.name || !formData.domain || !formData.firebaseProjectId) return;',
  'if (!formData.name) return;'
);

fs.writeFileSync('src/components/clients/ClientModal.tsx', content);
