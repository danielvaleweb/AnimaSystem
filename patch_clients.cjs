const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

// Update function signature
content = content.replace(
  /export function ClientsView\(\) \{/,
  'export function ClientsView({ onNavigate }: { onNavigate?: (view: any, id?: string) => void }) {'
);

const oldHeaderStr = `    <div className="flex flex-col h-full bg-transparent relative">
      
      {/* Toolbar */}
      <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">`;

const newHeaderStr = `    <div className="flex flex-col h-full bg-transparent relative space-y-6">
      {/* Greeting Row Pattern */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-2 mt-2">
        <div className="flex items-center gap-5 text-left">
          <button 
            onClick={() => onNavigate?.('dashboard')}
            className="w-12 h-12 rounded-full bg-transparent border border-zinc-200/80 flex items-center justify-center text-zinc-500 hover:bg-white hover:text-black transition-all cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="text-[40px] font-normal text-zinc-900 tracking-tight whitespace-nowrap">
              Clientes
            </h1>
          </div>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="p-4 sm:p-6 border border-zinc-200/80 bg-white rounded-3xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">`;

content = content.replace(oldHeaderStr, newHeaderStr);

fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
console.log("Clients patched");
