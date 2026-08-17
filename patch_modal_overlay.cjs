const fs = require('fs');
let content = fs.readFileSync('src/components/ConfirmationModal.tsx', 'utf8');

content = content.replace(
  /className="absolute inset-0 bg-white\/80 backdrop-blur-sm"/g,
  'className="absolute inset-0 bg-zinc-900\/40 backdrop-blur-sm"'
);

fs.writeFileSync('src/components/ConfirmationModal.tsx', content);
