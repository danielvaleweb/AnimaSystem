const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

// The active state for the view mode toggle button was using "bg-zinc-800 text-zinc-800"
content = content.replace(
  /"bg-zinc-800 text-zinc-800"/g,
  '"bg-zinc-200 text-zinc-900"'
);

// We need to also check the list icon toggle button active state
content = content.replace(
  /"p-1.5 rounded-md transition-colors cursor-pointer",\s*viewMode === 'list' \? "bg-zinc-800 text-zinc-800"/g,
  '"p-1.5 rounded-md transition-colors cursor-pointer", viewMode === \'list\' ? "bg-zinc-200 text-zinc-900"'
);

fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
console.log("ClientsView patched 2");
