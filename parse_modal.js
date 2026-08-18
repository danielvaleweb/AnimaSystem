const fs = require('fs');
const content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');

const returnIndex = content.indexOf('return (');
const stateCode = content.substring(0, returnIndex);

// Save state code to a file so we can inspect it safely
fs.writeFileSync('stateCode.txt', stateCode);
