const fs = require('fs');
let content = fs.readFileSync('src/components/customization/CustomizationView.tsx', 'utf8');

// Replace "Banner 1 (123x123)" with "Banner 1 (Opcional)" etc to avoid confusion
content = content.replace(/123x123/g, 'Opcional');

fs.writeFileSync('src/components/customization/CustomizationView.tsx', content);
