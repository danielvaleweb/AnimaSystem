const fs = require('fs');

let content = fs.readFileSync('src/components/investments/InvestmentsView.tsx', 'utf8');

// 1. Update the interface
content = content.replace(
  /interface Investment \{[\s\S]*?ownerId: string;\n\}/,
  `interface Investment {
  id: string;
  name: string;
  ticker: string;
  classe: string;
  corretora: string;
  quantidade: number;
  precoMedio: number;
  precoAtual: number;
  proventos: number;
  value: number; // For sorting and total (current total value)
  valorInvestido: number;
  changePercent: number; // e.g. +4.21 or -1.02
  logoType: 'black' | 'green' | 'white'; // card layout style as seen in print
  ownerId: string;
}`
);

// 2. Add state variables
content = content.replace(
  /const \[ticker, setTicker\] = useState\(''\);\n  const \[value, setValue\] = useState\(''\);\n  const \[changePercent, setChangePercent\] = useState\(''\);/,
  `const [ticker, setTicker] = useState('');
  const [classe, setClasse] = useState('');
  const [corretora, setCorretora] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [precoMedio, setPrecoMedio] = useState('');
  const [precoAtual, setPrecoAtual] = useState('');
  const [proventos, setProventos] = useState('');`
);

// 3. Update handleOpenAddModal
content = content.replace(
  /setEditingId\(null\);\n    setName\(''\);\n    setTicker\(''\);\n    setValue\(''\);\n    setChangePercent\(''\);/,
  `setEditingId(null);
    setName('');
    setTicker('');
    setClasse('');
    setCorretora('');
    setQuantidade('');
    setPrecoMedio('');
    setPrecoAtual('');
    setProventos('');`
);

// 4. Update handleOpenEditModal
content = content.replace(
  /setEditingId\(inv\.id\);\n    setName\(inv\.name\);\n    setTicker\(inv\.ticker\);\n    setValue\(inv\.value\.toString\(\)\);\n    setChangePercent\(inv\.changePercent\.toString\(\)\);/,
  `setEditingId(inv.id);
    setName(inv.name);
    setTicker(inv.ticker || inv.name);
    setClasse(inv.classe || '');
    setCorretora(inv.corretora || '');
    setQuantidade((inv.quantidade || 0).toString());
    setPrecoMedio((inv.precoMedio || 0).toString());
    setPrecoAtual((inv.precoAtual || 0).toString());
    setProventos((inv.proventos || 0).toString());`
);

// 5. Update handleSave logic
content = content.replace(
  /if \(\!name\.trim\(\) \|\| \!ticker\.trim\(\) \|\| \!value \|\| \!changePercent\) \{[\s\S]*?return;\n    \}/,
  `if (!name.trim() || !quantidade || !precoMedio) {
      showError("Campos necessários", "Por favor, preencha Nome, Quantidade e Preço Médio.");
      return;
    }`
);

content = content.replace(
  /const payload = \{[\s\S]*?ownerId: auth\.currentUser\.uid\n      \};/,
  `const numQuantidade = parseFloat(quantidade) || 0;
      const numPrecoMedio = parseFloat(precoMedio) || 0;
      const numPrecoAtual = parseFloat(precoAtual) || numPrecoMedio; // default to precoMedio if not set
      const numProventos = parseFloat(proventos) || 0;
      
      const calcValorInvestido = numQuantidade * numPrecoMedio;
      const calcValorAtual = numQuantidade * numPrecoAtual;
      
      let calcChange = 0;
      if (calcValorInvestido > 0) {
        calcChange = ((calcValorAtual - calcValorInvestido + numProventos) / calcValorInvestido) * 100;
      }
      
      const payload = {
        name: name.trim().toUpperCase(),
        ticker: name.trim().toUpperCase(), // Keep ticker same as name for backward compatibility
        classe: classe.trim(),
        corretora: corretora.trim(),
        quantidade: numQuantidade,
        precoMedio: numPrecoMedio,
        precoAtual: numPrecoAtual,
        proventos: numProventos,
        valorInvestido: calcValorInvestido,
        value: calcValorAtual, // the current value
        changePercent: calcChange,
        logoType,
        ownerId: auth.currentUser.uid
      };`
);

// 6. Form HTML replacement
const formOld = `<div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Nome do Ativo / Empresa</label>
                <input 
                  type="text" 
                  placeholder="Ex: Tesla"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Ticker / Sigla</label>
                <input 
                  type="text" 
                  placeholder="Ex: TSLA"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Valor Alocado (R$)</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="Ex: 5000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Rendimento Mensal (%)</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="Ex: 4.21 ou -1.02"
                    value={changePercent}
                    onChange={(e) => setChangePercent(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-black outline-none focus:border-accent/40"
                  />
                </div>
              </div>`;

const formNew = `<div className="space-y-1.5">
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
                  <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-500 outline-none">
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
              </div>`;

content = content.replace(formOld, formNew);

// Table Header Update
content = content.replace(
  /<th className="py-4 px-6 font-extrabold">Ativo \/ Empresa<\/th>[\s\S]*?<th className="py-4 px-6 font-extrabold">Sigla<\/th>[\s\S]*?<th className="py-4 px-6 font-extrabold">Valor Alocado<\/th>/,
  `<th className="py-4 px-6 font-extrabold">Ativo / Nome</th>
                    <th className="py-4 px-6 font-extrabold">Classe / Corretora</th>
                    <th className="py-4 px-6 font-extrabold">Valor Atual</th>`
);

// Table Row Update
const rowRegex = /<td className="py-4 px-6 text-zinc-500 font-mono text-sm">\{inv\.ticker\}<\/td>[\s\S]*?<td className="py-4 px-6 text-zinc-800 font-bold font-mono">[\s\S]*?R\$ \{inv\.value\.toLocaleString\('pt-BR', \{ minimumFractionDigits: 2 \}\)\}[\s\S]*?<\/td>/;

const rowNew = `<td className="py-4 px-6 text-zinc-500 font-mono text-sm">
                      <div className="flex flex-col">
                        <span>{inv.classe || '-'}</span>
                        <span className="text-[10px] text-zinc-400">{inv.corretora || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-zinc-800 font-bold font-mono">
                      <div className="flex flex-col">
                        <span>R$ {(inv.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-zinc-500 font-light">Inv: R$ {(inv.valorInvestido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </td>`;

content = content.replace(rowRegex, rowNew);

fs.writeFileSync('src/components/investments/InvestmentsView.tsx', content);

