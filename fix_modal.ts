import fs from 'fs';
let content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');

const match = `                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Próxima Renovação</label>
                  <input 
                    type="date"
                    name="nextRenewalDate"
                    value={formData.nextRenewalDate || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="AAAA-MM-DD"
                  />
                </div>`;
                
content = content.replace(match, '');
fs.writeFileSync('src/components/clients/ClientModal.tsx', content);
