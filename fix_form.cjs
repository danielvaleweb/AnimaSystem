const fs = require('fs');

let content = fs.readFileSync('src/components/investments/InvestmentsView.tsx', 'utf8');

const startTag = '<form onSubmit={handleSave} className="p-6 space-y-4">';
const endTag = '<div className="space-y-2">'; // Just before the visual/style section

const startIndex = content.indexOf(startTag) + startTag.length;
const endIndex = content.indexOf(endTag, startIndex);

if (startIndex > startTag.length - 1 && endIndex > -1) {
  const replacement = `
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Nome (Ex: TSLA)</label>
                <input 
                  type="text" 
                  placeholder="Ex: TSLA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40 uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Classe</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Ação, FII"
                    value={classe}
                    onChange={(e) => setClasse(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Corretora</label>
                  <input 
                    type="text" 
                    placeholder="Ex: XP, Clear"
                    value={corretora}
                    onChange={(e) => setCorretora(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Quantidade</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="0"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Preço Médio</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="R$ 0,00"
                    value={precoMedio}
                    onChange={(e) => setPrecoMedio(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Val. Investido</label>
                  <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-500 outline-none truncate">
                    R$ {((parseFloat(quantidade)||0) * (parseFloat(precoMedio)||0)).toLocaleString('pt-BR', {minimumFractionDigits:2})}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Preço Atual</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="Cotação Atual"
                    value={precoAtual}
                    onChange={(e) => setPrecoAtual(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Proventos (R$)</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="Total Recebido"
                    value={proventos}
                    onChange={(e) => setProventos(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
              </div>\n              `;
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('src/components/investments/InvestmentsView.tsx', content);
  console.log('Patch success!');
} else {
  console.log('Could not find form block');
}
