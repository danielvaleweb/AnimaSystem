import fs from 'fs';
const file = 'src/components/monitor/MonitorView.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace the broken line 521 string literal
content = content.replace("style={{ width: \\`\\${progressPercent}%\\` }}", "style={{ width: progressPercent + '%' }}");
content = content.replace("style={{ width: `${progressPercent}%` }}", "style={{ width: progressPercent + '%' }}");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed exactly!');
