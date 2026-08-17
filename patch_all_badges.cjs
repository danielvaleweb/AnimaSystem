const fs = require('fs');
const glob = require('glob');

// We will find all .tsx files
const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Blue badges
  content = content.replace(/bg-blue-500\/10 border(?:-blue-500\/20| border-blue-500\/20) text-(xs|\[10px\]|sm) font-(medium|semibold) text-blue-400/g, 'bg-blue-500 border border-blue-500 text-$1 font-semibold text-white');
  
  content = content.replace(/bg-blue-500\/10 border-blue-500\/20 text-blue-400/g, 'bg-blue-500 border-blue-500 text-white font-semibold');

  // Hover states for blue
  content = content.replace(/hover:bg-blue-500\/20/g, 'hover:bg-blue-600');

  // Rose badges
  content = content.replace(/bg-rose-500\/10 border(?:-rose-500\/20| border-rose-500\/20) text-(xs|\[10px\]|sm) font-(medium|semibold) text-rose-400/g, 'bg-rose-500 border border-rose-500 text-$1 font-semibold text-white');
  
  content = content.replace(/bg-rose-500\/10 border-rose-500\/20 text-rose-600/g, 'bg-rose-500 border-rose-500 text-white font-semibold');
  
  // Hover states for rose
  content = content.replace(/hover:bg-rose-500\/20/g, 'hover:bg-rose-600');

  // Zinc badges
  content = content.replace(/bg-zinc-500\/10 border(?:-zinc-500\/20| border-zinc-500\/20) text-(xs|\[10px\]|sm) font-(medium|semibold) text-zinc-500/g, 'bg-zinc-500 border border-zinc-500 text-$1 font-semibold text-white');
  
  content = content.replace(/bg-zinc-500\/10 border-zinc-500\/20 text-zinc-500/g, 'bg-zinc-500 border-zinc-500 text-white font-semibold');
  
  // Hover states for zinc
  content = content.replace(/hover:bg-zinc-500\/20/g, 'hover:bg-zinc-600');

  // Purple badges
  content = content.replace(/bg-purple-500\/10 border(?:-purple-500\/20| border-purple-500\/20) text-(xs|\[10px\]|sm) font-(medium|semibold) text-purple-400/g, 'bg-purple-500 border border-purple-500 text-$1 font-semibold text-white');
  
  content = content.replace(/bg-purple-500\/10 border-purple-500\/20 text-purple-400/g, 'bg-purple-500 border-purple-500 text-white font-semibold');
  
  // Hover states for purple
  content = content.replace(/hover:bg-purple-500\/20/g, 'hover:bg-purple-600');
  
  // Amber badges
  content = content.replace(/bg-amber-500\/10 border(?:-amber-500\/20| border-amber-500\/20) text-(xs|\[10px\]|sm) font-(medium|semibold) text-amber-400/g, 'bg-amber-500 border border-amber-500 text-$1 font-semibold text-black');
  content = content.replace(/bg-amber-500\/10 border-amber-500\/20 text-amber-500/g, 'bg-amber-500 border-amber-500 text-black font-semibold');
  content = content.replace(/hover:bg-amber-500\/20/g, 'hover:bg-amber-600');
  
  if (original !== content) {
    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
  }
});
