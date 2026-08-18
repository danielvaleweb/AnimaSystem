const fs = require('fs');

let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');
content = content.replace(
  'const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientData));\n      setClients(data);',
  `const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientData));
      data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setClients(data);`
);

fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
