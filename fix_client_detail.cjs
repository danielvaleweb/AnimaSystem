const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

const regex = /\{\/\* Status Dropdown \*\/\}.+?\{\/\* Header Actions Menu end or whatever \*\/\}/;
// Since I don't know the exact end marker, I will use line replacements

const start = content.indexOf('{/* Status Dropdown */}');
const end = content.indexOf('          {!isClientView && (', start);

if (start !== -1 && end !== -1) {
    const toReplace = content.substring(start, end);
    const newRender = `{/* Status Badge (Read Only) */}
          <div className="relative">
              <div 
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-1.5",
                  client.status === 'active' ? "bg-accent border-accent text-black font-semibold" :
                  client.status === 'trial' ? "bg-blue-500 border-blue-500 text-white font-semibold" :
                  client.status === 'ended' ? "bg-zinc-500 border-zinc-500 text-white font-semibold" :
                  client.status === 'developing' ? "bg-purple-500 border-purple-500 text-white font-semibold" :
                  "bg-rose-500 border-rose-500 text-white font-semibold"
                )}
              >
                {client.status === 'active' ? (
                  <><Rocket className="w-3.5 h-3.5" />Ativo</>
                ) : client.status === 'trial' ? (
                  <><Clock className="w-3.5 h-3.5" />Trial</>
                ) : client.status === 'ended' ? (
                  <><Power className="w-3.5 h-3.5" />Encerrado</>
                ) : client.status === 'developing' ? (
                  <><Code className="w-3.5 h-3.5" />Em construção</>
                ) : (
                  <><Hand className="w-3.5 h-3.5" />Suspenso</>
                )}
              </div>
          </div>

`;
    content = content.replace(toReplace, newRender);
    fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
    console.log("Fixed ClientDetailView");
} else {
    console.log("Could not find blocks");
}
