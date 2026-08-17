const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

const target = `  if (!client) {
    return <div className="p-8 text-center text-zinc-500">Cliente não encontrado ou sem permissão.</div>;
  }`;

const inject = `  if (isClientView && client.status === 'suspended') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-4 font-sans text-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
            <Ban className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-3">
            Acesso temporariamente indisponível
          </h1>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            Este site encontra-se temporariamente indisponível no momento. 
            Para mais informações, entre em contato com nossa equipe.
          </p>
          <a 
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 transition-colors text-black font-extrabold rounded-xl w-full justify-center shadow-lg shadow-emerald-500/20"
          >
            <Phone className="w-5 h-5 fill-current" />
            Suporte
          </a>
        </div>
      </div>
    );
  }`;

content = content.replace(target, target + '\\n\\n' + inject);

fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
console.log("Patched ClientDetailView suspended screen");
