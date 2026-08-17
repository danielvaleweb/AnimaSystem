const fs = require('fs');
let content = fs.readFileSync('src/components/agenda/AgendaView.tsx', 'utf8');

content = content.replace(
  /export function AgendaView\(\) \{/,
  'export function AgendaView({ onNavigate }: { onNavigate?: (view: any, id?: string) => void }) {'
);

const oldHeaderStr = `  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 animate-fade-in pb-16">`;

const newHeaderStr = `  return (
    <div className="flex flex-col h-full space-y-6 relative">
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
              Agenda
            </h1>
          </div>
        </div>
      </div>

    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 animate-fade-in pb-16 w-full">`;

content = content.replace(oldHeaderStr, newHeaderStr);

fs.writeFileSync('src/components/agenda/AgendaView.tsx', content + '\n</div>'); // append closing div since we added an extra wrapper
console.log("Agenda patched");
