const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  fs.writeFileSync(filePath, content);
}

replaceInFile('src/components/clients/ClientsView.tsx', [
  [/bg-accent\/10 border border-accent\/20 text-xs font-medium text-accent/g, 'bg-accent border border-accent text-xs font-semibold text-black'],
  [/bg-accent\/10 border border-accent\/20 text-\[10px\] font-medium text-accent/g, 'bg-accent border border-accent text-[10px] font-semibold text-black']
]);

replaceInFile('src/components/clients/ClientDetailView.tsx', [
  [/bg-accent\/10 border-accent\/20 text-accent hover:bg-accent\/20/g, 'bg-accent border-accent text-black font-semibold hover:bg-[#bbf000]'],
  [/bg-accent\/10 border-accent\/20 text-accent/g, 'bg-accent border-accent text-black font-semibold']
]);

console.log("Patched badges");
