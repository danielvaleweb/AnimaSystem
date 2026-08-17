const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

// The dropdown list background and text has active state with text-accent, which is the bright green. Let's make it text-black instead for better readability
content = content.replace(
  /"text-accent font-semibold hover:bg-zinc-50"/g,
  '"text-black font-bold hover:bg-zinc-50"'
);

// We need to check if there are other styling bugs in ClientsView
fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
console.log("ClientsView patched");
