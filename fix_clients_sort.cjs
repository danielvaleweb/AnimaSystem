const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');
content = content.replace(
  'setClients(clientsData);',
  `clientsData.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setClients(clientsData);`
);

fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
