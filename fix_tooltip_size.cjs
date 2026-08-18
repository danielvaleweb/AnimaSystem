const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

const oldStr = `              {client.logoUrl && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 bg-white p-2 rounded-xl shadow-2xl border border-zinc-200/80 scale-95 group-hover:scale-100 origin-top">
                  <img src={client.logoUrl} alt="Logo Ampliada" className="w-32 h-32 object-contain rounded-lg bg-zinc-50" />
                </div>
              )}`;

const newStr = `              {client.logoUrl && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 bg-white p-2 rounded-xl shadow-2xl border border-zinc-200/80 scale-95 group-hover:scale-100 origin-top w-[140px] h-[140px] flex items-center justify-center">
                  <img src={client.logoUrl} alt="Logo Ampliada" className="w-full h-full object-cover rounded-lg" />
                </div>
              )}`;

content = content.replace(oldStr, newStr);

fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
