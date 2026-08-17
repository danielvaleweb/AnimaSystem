const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');
content = content.replace(/import { Phone, /g, 'import { ');
content = content.replace(/import {   ArrowLeft/, 'import { Phone, ArrowLeft');
fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
