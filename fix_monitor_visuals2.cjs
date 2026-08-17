const fs = require('fs');
let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

content = content.replace(
  /className=\{cn\("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer", debugMode \? "bg-accent\/20 border-accent\/30 text-accent" : "bg-zinc-800\/50 border-zinc-300\/50 text-zinc-500 hover:text-zinc-800"\)\}/g,
  'className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer", debugMode ? "bg-accent/20 border-accent/30 text-zinc-900" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200")}'
);

content = content.replace(
  /className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500\/20 text-blue-400 border border-blue-500\/30 hover:bg-blue-500\/30 transition-colors disabled:opacity-50 cursor-pointer"/g,
  'className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 cursor-pointer"'
);

// Fix the subtitle
content = content.replace(
  /<p className="text-zinc-500 text-xs sm:text-sm mt-1 whitespace-normal">/g,
  '<p className="text-zinc-600 text-xs sm:text-sm mt-1 whitespace-normal">'
);

// Inside the cards, check for text-zinc-400
content = content.replace(
  /text-zinc-400/g,
  'text-zinc-600'
);

fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
console.log("Visuals fixed 2.");
