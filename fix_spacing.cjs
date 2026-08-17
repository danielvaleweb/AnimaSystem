const fs = require('fs');

const filesToPatch = [
  'src/components/agenda/AgendaView.tsx',
  'src/components/audit/AuditView.tsx',
  'src/components/clients/ClientDetailView.tsx',
  'src/components/clients/ClientsView.tsx',
  'src/components/finance/FinanceView.tsx',
  'src/components/leads/LeadsView.tsx',
  'src/components/monitor/MonitorView.tsx',
  'src/components/settings/SettingsView.tsx',
  'src/components/tickets/TicketsView.tsx'
];

for (const file of filesToPatch) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the main space-y-6 with space-y-14
    // We only want to replace the first occurrence (usually the root div) or occurrences that are clearly root wrappers.
    // e.g. <div className="flex flex-col h-full space-y-6"> or similar
    content = content.replace(/className="([^"]*)space-y-6([^"]*)"/, 'className="$1space-y-14$2"');
    
    // Some files might have multiple space-y-6, but the first one is almost always the root.
    // Let's also remove `mb-2 mt-2`, `mb-4`, `mb-6`, `mb-8`, `mt-2` from the greeting rows.
    // Greeting rows usually look like: <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-2 mt-2">
    content = content.replace(/gap-6 mb-2 mt-2/g, 'gap-6');
    content = content.replace(/gap-6 mb-8 mt-2/g, 'gap-6');
    content = content.replace(/gap-4 mb-2 mt-2/g, 'gap-4');
    content = content.replace(/gap-4 mb-8 mt-2/g, 'gap-4');
    content = content.replace(/gap-6 mb-4 mt-2/g, 'gap-6');
    content = content.replace(/gap-6 mb-6 mt-2/g, 'gap-6');
    content = content.replace(/gap-5 mb-2 mt-2/g, 'gap-5');
    
    fs.writeFileSync(file, content);
  }
}
console.log("Patched spacing");
