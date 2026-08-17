const fs = require('fs');

let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

// Update function signature
content = content.replace(
  /export function MonitorView\(\) \{/,
  'export function MonitorView({ onNavigate }: { onNavigate?: (view: any, id?: string) => void }) {'
);

// Replace NOC Header with new Title Row pattern
const nocHeaderPattern = /\{\/\* NOC Header \*\/\}\n\s*<div className="bg-white border border-zinc-200\/80 rounded-\[2rem\] p-4 sm:p-6 lg:p-8 flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between relative">[\s\S]*?<div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between relative">[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/; 

// Let's manually replace it to be safe.
