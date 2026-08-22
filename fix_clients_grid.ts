import fs from 'fs';
let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

// The block to remove is from `<div className="flex items-center justify-between text-sm">` with `Próxima renovação` to its closing `</div>`

const lines = content.split('\n');
let newLines = [];
let skip = false;
let divs = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<span className="text-zinc-500 text-xs">Próxima renovação</span>')) {
    // We want to skip from the parent <div>
    // the previous line is `<div className="flex items-center justify-between text-sm">`
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

fs.writeFileSync('src/components/clients/ClientsView.tsx', newLines.join('\n'));
