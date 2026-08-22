import fs from 'fs';
let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

const lines = content.split('\n');
let newLines = [];
let skip = false;
let divs = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<span className="block text-sm text-zinc-500 mb-1">Próxima Renovação</span>')) {
    newLines.pop(); // remove the opening div
    skip = true;
    divs = 1;
    continue;
  }
  
  if (skip) {
    if (lines[i].includes('<div')) divs++;
    if (lines[i].includes('</div')) divs--;
    
    if (divs === 0) {
      skip = false;
    }
    continue;
  }
  
  newLines.push(lines[i]);
}

fs.writeFileSync('src/components/clients/ClientDetailView.tsx', newLines.join('\n'));
