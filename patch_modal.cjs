const fs = require('fs');

let content = fs.readFileSync('src/components/ConfirmationModal.tsx', 'utf8');

// Modal container
content = content.replace(
  /bg-zinc-900 border border-zinc-200 rounded-\[2rem\] p-6 sm:p-8 shadow-\[0_0_50px_rgba\(0,0,0,0\.5\)\]/g,
  'bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 shadow-2xl'
);

// Icon container
content = content.replace(
  /bg-zinc-850 border border-zinc-200 shrink-0/g,
  'bg-white border border-zinc-200 shrink-0 shadow-sm'
);

// Cancel button
content = content.replace(
  /bg-zinc-850 hover:bg-zinc-800 border border-zinc-200 hover:border-zinc-700 text-zinc-600 hover:text-black/g,
  'bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900'
);

// Confirm button (Danger)
content = content.replace(
  /bg-red-600 hover:bg-red-700 text-black shadow-\[0_0_20px_rgba\(239,68,68,0\.2\)\]/g,
  'bg-red-600 hover:bg-red-700 text-white shadow-sm'
);

fs.writeFileSync('src/components/ConfirmationModal.tsx', content);
console.log("Patched ConfirmationModal");
