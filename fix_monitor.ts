import fs from 'fs';

let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

// 1. Add NotificationContext import
if (!content.includes('import { useNotification }')) {
  content = content.replace(
    "import { useState, useEffect } from 'react';",
    "import { useState, useEffect } from 'react';\nimport { useNotification } from '../NotificationContext';"
  );
}

// 2. Add showSuccess hook
if (!content.includes('const { showSuccess } = useNotification();')) {
  content = content.replace(
    'export function MonitorView({ onNavigate }: { onNavigate?: (v: any, id?: string) => void }) {',
    'export function MonitorView({ onNavigate }: { onNavigate?: (v: any, id?: string) => void }) {\n  const { showSuccess } = useNotification();'
  );
}

// 3. Add showSuccess in fetchClientMetrics
const updateDocMatch = `    if (selectedClient.id && !currentError) {
       try {
          await updateDoc(doc(db, "clients", selectedClient.id), {
             lastMetricsUpdate: new Date().toISOString(),
             lastGcpMetrics: fetchedGcp || null,
             lastRealMetrics: fetchedReal.length ? fetchedReal : null
          });
       } catch (err) {
          console.error("Erro ao salvar cache de metricas", err);
       }
    }`;

const replaceWithSuccess = `    if (selectedClient.id && !currentError) {
       try {
          await updateDoc(doc(db, "clients", selectedClient.id), {
             lastMetricsUpdate: new Date().toISOString(),
             lastGcpMetrics: fetchedGcp || null,
             lastRealMetrics: fetchedReal.length ? fetchedReal : null
          });
          showSuccess('Atualização Concluída', 'Métricas e faturamento sincronizados com sucesso.');
       } catch (err) {
          console.error("Erro ao salvar cache de metricas", err);
       }
    }`;

content = content.replace(updateDocMatch, replaceWithSuccess);

// 4. Remove Custom Client Selector
const clientSelectorRegex = /\{\/\* Custom Client Selector.*?<\/AnimatePresence>\s*<\/div>\s*/s;
content = content.replace(clientSelectorRegex, '');


// 5. Add Client Grid above "Métricas do Google Cloud Monitoring"
const metricsContainerRegex = /<div className="flex-1 w-full flex flex-col">\s*\{\/\* Consumo de Cotas Limits \*\/\}/s;

const clientGridCode = `
      {/* Client Selector Cards */}
      <div className="flex items-center gap-4 overflow-x-auto pb-6 scrollbar-hide">
        {clients.map(client => (
          <button
            key={client.id}
            type="button"
            onClick={() => setSelectedClientId(client.id)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[90px] h-[90px] rounded-2xl border transition-all cursor-pointer shrink-0",
              selectedClient?.id === client.id
                ? "border-accent shadow-[0_0_15px_rgba(215,254,3,0.25)] bg-[#fcffed]"
                : "border-zinc-200/80 bg-white hover:border-zinc-300 shadow-sm"
            )}
          >
            {client.logoUrl ? (
              <img src={client.logoUrl} alt={client.name} className="w-10 h-10 rounded-full object-cover mb-2 border border-zinc-100" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-600 mb-2 uppercase border border-zinc-200">
                {client.logoInitials || client.name.substring(0, 2)}
              </div>
            )}
            <span className="text-[10px] text-zinc-600 font-medium truncate w-[75px] text-center px-1 leading-tight">
              {client.name.split(' ').slice(0, 2).join(' ')}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 w-full flex flex-col">
        {/* Consumo de Cotas Limits */}`;

content = content.replace(metricsContainerRegex, clientGridCode);

fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);

