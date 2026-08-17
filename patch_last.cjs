const fs = require('fs');

function patchFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // Common replacements
  content = content.replace(/bg-zinc-950\/50/g, 'bg-white');
  content = content.replace(/bg-zinc-950\/80/g, 'bg-white/80');
  content = content.replace(/bg-zinc-950/g, 'bg-white');
  
  content = content.replace(/border-zinc-800\/50/g, 'border-zinc-200/80');
  content = content.replace(/border-zinc-800\/80/g, 'border-zinc-200/80');
  content = content.replace(/border-zinc-800/g, 'border-zinc-200');

  content = content.replace(/text-zinc-400/g, 'text-zinc-500');
  content = content.replace(/text-zinc-300/g, 'text-zinc-600');
  content = content.replace(/text-zinc-200/g, 'text-zinc-800');
  content = content.replace(/text-white/g, 'text-black');

  content = content.replace(/text-zinc-950/g, 'text-black'); // Standardize button texts

  fs.writeFileSync(filepath, content);
}

patchFile('src/components/tickets/TicketDetail.tsx');
patchFile('src/components/clients/ClientModal.tsx');
patchFile('src/components/AlertsPanel.tsx');
patchFile('src/components/ConfirmationModal.tsx');
patchFile('src/components/settings/SettingsView.tsx');

