const fs = require('fs');
let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');
content = content.replace(/\\n\\n/g, '');
fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
