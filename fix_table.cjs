const fs = require('fs');
let content = fs.readFileSync('src/components/investments/InvestmentsView.tsx', 'utf8');

const thOld = `<th className="py-4 px-6">Ativo / Empresa</th>
                  <th className="py-4 px-6">Sigla</th>
                  <th className="py-4 px-6">Valor Alocado</th>`;

const thNew = `<th className="py-4 px-6">Ativo / Nome</th>
                  <th className="py-4 px-6">Classe / Corretora</th>
                  <th className="py-4 px-6">Valor Atual</th>`;

content = content.replace(thOld, thNew);

const tdOld = `<td className="py-4 px-6 text-zinc-500 font-mono text-sm">{inv.ticker}</td>
                    <td className="py-4 px-6 text-zinc-800 font-bold font-mono">
                      R$ {inv.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>`;

const tdNew = `<td className="py-4 px-6 text-zinc-500 font-mono text-sm">
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

content = content.replace(tdOld, tdNew);

fs.writeFileSync('src/components/investments/InvestmentsView.tsx', content);
console.log('Table fixed!');
