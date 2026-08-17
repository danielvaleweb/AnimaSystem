const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');

const replacement = `
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Domínio</label>
                  <input 
                    name="domain"
                    value={formData.domain || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-accent text-zinc-900 text-sm transition-all"
                    placeholder="Ex: techflow.com"
                  />
                </div>
`;

content = content.replace(
  '                <div className="space-y-2">\n                  <label className="text-sm font-medium text-zinc-500">URL da Logo (ou use upload acima)</label>',
  replacement + '                <div className="space-y-2">\n                  <label className="text-sm font-medium text-zinc-500">URL da Logo (ou use upload acima)</label>'
);

fs.writeFileSync('src/components/clients/ClientModal.tsx', content);
