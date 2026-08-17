const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

const badSyntax = `        </div>
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>`;

const goodSyntax = `        </div>
      </div>`;

content = content.replace(badSyntax, goodSyntax);
fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
