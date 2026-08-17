const fs = require('fs');

let content = fs.readFileSync('src/components/CollaboratorAuthView.tsx', 'utf8');

content = content.replace(
  /"bg-accent\/10 border-accent\/20 text-accent hover:bg-accent\/20"/g,
  '"bg-accent border-accent text-black font-semibold hover:bg-[#bbf000]"'
);

fs.writeFileSync('src/components/CollaboratorAuthView.tsx', content);
