const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

if (!content.includes("{ label: 'Agenda', view: 'agenda' }")) {
  content = content.replace(
    /const topMenus: MenuItem\[\] = \[\n  \{ label: 'Dashboard', view: 'dashboard' \},\n/,
    "const topMenus: MenuItem[] = [\n  { label: 'Dashboard', view: 'dashboard' },\n  { label: 'Agenda', view: 'agenda' },\n"
  );
  fs.writeFileSync('src/components/Header.tsx', content);
  console.log("Header Patched successfully!");
} else {
  console.log("Agenda already in header.");
}
