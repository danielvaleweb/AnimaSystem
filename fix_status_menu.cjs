const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');
content = content.replace(/setShowStatusMenu/g, 'setShowMenu');

fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
