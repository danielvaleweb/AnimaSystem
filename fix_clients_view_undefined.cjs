const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

const replacement = `
      // Clean up undefined values that Firestore rejects
      Object.keys(processedData).forEach(key => {
        if (processedData[key as keyof typeof processedData] === undefined) {
          delete processedData[key as keyof typeof processedData];
        }
      });

      if (editingClient) {
`;

content = content.replace(
  '      if (editingClient) {',
  replacement
);

fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
