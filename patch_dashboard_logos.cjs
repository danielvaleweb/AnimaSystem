const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

// The "Multi-logos horizontal overlapped lists" container
// Replace the outer div wrapper:
// className="w-16 h-16 rounded-full bg-zinc-900 border-[3px] border-white flex items-center justify-center overflow-hidden z-10"
content = content.replace(
  /className="w-16 h-16 rounded-full bg-zinc-900 border-\[3px\] border-white flex items-center justify-center overflow-hidden z-10"/g,
  'className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center overflow-hidden z-10"'
);

// Replace the "+x" circle styling
content = content.replace(
  /className="w-16 h-16 rounded-full bg-zinc-800 border-\[3px\] border-white flex items-center justify-center text-lg font-bold text-white z-0"/g,
  'className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-500 z-0"'
);

// Replace the fallback text styling
content = content.replace(
  /className="text-xl font-bold text-white"/g,
  'className="text-xl font-bold text-zinc-500"'
);

// Add p-2 object-contain for img
content = content.replace(
  /className="w-full h-full object-cover" loading="lazy"/g,
  'className="w-full h-full object-contain p-3" loading="lazy"'
);
content = content.replace(
  /className="w-full h-full object-cover"\s+\/>/g,
  'className="w-full h-full object-contain p-3" />'
);

// Replace the default static circles
content = content.replace(
  /bg-zinc-900 border-\[3px\] border-white.*text-white">A/g,
  'bg-white border border-zinc-200 text-zinc-500">A'
);
content = content.replace(
  /bg-zinc-100 border-\[3px\] border-white.*text-zinc-800">KFC/g,
  'bg-white border border-zinc-200 text-zinc-500">KFC'
);
content = content.replace(
  /bg-yellow-400 border-\[3px\] border-white.*text-black">M/g,
  'bg-white border border-zinc-200 text-zinc-500">M'
);
content = content.replace(
  /bg-zinc-800 border-\[3px\] border-white.*text-white">\+3/g,
  'bg-white border border-zinc-200 text-zinc-500">+3'
);

// And adjust the spacing of the overlapped list to overlap slightly less (from -space-x-3 to -space-x-4 maybe? Or keep -space-x-3)

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
console.log("Dashboard patched");
