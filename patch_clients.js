const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

// Container
content = content.replace('bg-zinc-900 border border-zinc-800/50 rounded-[2rem]', 'bg-transparent');

// Inputs
content = content.replace(/bg-zinc-950 border border-zinc-800 focus:border-accent\/50 outline-none rounded-full py-2\.5 pl-11 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500/g, 'bg-white border border-zinc-200/80 focus:border-zinc-300 outline-none rounded-full py-2.5 pl-11 pr-4 text-sm text-zinc-800 placeholder:text-zinc-400 shadow-sm');
content = content.replace(/bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-full py-2\.5 pl-5 pr-8 outline-none focus:border-accent\/50/g, 'bg-white border border-zinc-200/80 text-sm text-zinc-800 rounded-full py-2.5 pl-5 pr-8 outline-none focus:border-zinc-300 shadow-sm');
content = content.replace(/bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl/g, 'bg-white border border-zinc-200 rounded-2xl shadow-xl');

// Dropdown items
content = content.replace(/hover:bg-zinc-800\/50/g, 'hover:bg-zinc-50');
content = content.replace(/text-zinc-200/g, 'text-zinc-800');
content = content.replace(/text-zinc-300/g, 'text-zinc-800');

// View Toggle
content = content.replace(/bg-zinc-950\/50 p-1 rounded-lg border border-zinc-800\/50/g, 'bg-white p-1 rounded-full border border-zinc-200/80 shadow-sm');
content = content.replace(/text-zinc-100 bg-zinc-800/g, 'text-black bg-zinc-100');
content = content.replace(/text-zinc-500 hover:text-zinc-300/g, 'text-zinc-400 hover:text-zinc-800');

// Table header
content = content.replace(/border-b border-zinc-800\/50 text-sm text-zinc-500 bg-zinc-950\/20/g, 'border-b border-zinc-200/80 text-sm text-zinc-500 bg-transparent');

// Table row
content = content.replace(/hover:bg-zinc-800\/20/g, 'hover:bg-zinc-50/50');
content = content.replace(/border-b border-zinc-800\/30/g, 'border-b border-zinc-100');
content = content.replace(/text-zinc-400/g, 'text-zinc-500');

// Grid cards
content = content.replace(/bg-zinc-950\/50 border border-zinc-800\/80 rounded-2xl p-5 hover:bg-zinc-800\/30/g, 'bg-white border border-zinc-200/75 rounded-3xl p-5 hover:border-zinc-300 shadow-sm');

content = content.replace(/border-zinc-700/g, 'border-zinc-200');

// "Plano" background
content = content.replace(/bg-zinc-800 text-xs font-medium text-zinc-300 border border-zinc-700\/50/g, 'bg-zinc-100 text-xs font-medium text-zinc-800 border border-zinc-200');
content = content.replace(/bg-zinc-950 px-2 py-1 rounded border border-zinc-800/g, 'bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200 text-zinc-600');
content = content.replace(/border-zinc-800\/50/g, 'border-zinc-100');
content = content.replace(/text-emerald-400/g, 'text-emerald-600');

fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
