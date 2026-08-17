const fs = require('fs');

let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

// Rename the button text and the icon
content = content.replace(
  /<Upload className="w-4 h-4 shrink-0" \/>\n\s*<span>Sincronizar Faturamento \(CSV\)<\/span>/,
  '<Zap className="w-4 h-4 shrink-0 text-zinc-900" />\n                <span>Sincronizar Faturamento</span>'
);

// We want to remove the billingSyncTab logic and the tabs UI entirely.
// Find the modal start
const modalStartStr = '{isCsvModalOpen && (';
const tabsStartStr = '<div className="flex border-b border-zinc-200/60 mb-6">';
const tabsEndStr = '</div>';

// This might be risky, let's replace the whole modal content carefully.
