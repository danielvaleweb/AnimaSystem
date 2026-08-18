const fs = require('fs');

let content = fs.readFileSync('src/components/agenda/AgendaView.tsx', 'utf8');
content = content.replace(
  'setClients(snap.docs.map(d => ({id: d.id, ...d.data()} as ClientData)));',
  `const data = snap.docs.map(d => ({id: d.id, ...d.data()} as ClientData));
      data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setClients(data);`
);

fs.writeFileSync('src/components/agenda/AgendaView.tsx', content);
