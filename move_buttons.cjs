const fs = require('fs');
let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

const topBarRegex = /(<div className="flex flex-col sm:flex-row gap-2 lg:gap-4 items-stretch sm:items-center w-full justify-start xl:justify-end">[\s\S]*?)<\/div>\s*\{timeRange === 'custom'/;

const match = content.match(topBarRegex);
if(match) {
   let topBarContent = match[1];
   // We need to keep only the status dropdown here.
   // Let's find the end of status dropdown.
   const statusDropdownEnd = '              </div>';
   const firstSplitIndex = topBarContent.indexOf(statusDropdownEnd) + statusDropdownEnd.length;
   
   const statusDropdownStr = topBarContent.substring(0, firstSplitIndex);
   const extractedElements = topBarContent.substring(firstSplitIndex); // Client, Time, Atualizar

   // Find custom dates
   const customDatesRegex = /                    \{timeRange === 'custom' && \(\n             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1 w-full justify-end">\n                <input\n                    type="date"\n                   value=\{customStart\}\n                   onChange=\{\(e\) => setCustomStart\(e\.target\.value\)\}\n                   className="bg-white border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-300 w-full sm:w-auto"\n                   style=\{\{ colorScheme: 'dark' \}\}\n                \/>\n                <span className="text-zinc-500 text-xs text-center">até<\/span>\n                <input\n                    type="date"\n                   value=\{customEnd\}\n                   onChange=\{\(e\) => setCustomEnd\(e\.target\.value\)\}\n                   className="bg-white border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-300 w-full sm:w-auto"\n                   style=\{\{ colorScheme: 'dark' \}\}\n                \/>\n             <\/div>\n          \)\}\n/;
   const customDatesMatch = content.match(customDatesRegex);
   const customDatesStr = customDatesMatch ? customDatesMatch[0] : '';
   
   // We reconstruct the top bar to only have the Status Dropdown
   const newTopBar = statusDropdownStr;
   
   // Replace in file
   content = content.replace(topBarContent, newTopBar);
   if(customDatesMatch) {
       content = content.replace(customDatesRegex, '');
   }
   
   // Now replace the debug buttons section
   const debugBtnsRegex = /              \{selectedClient\?\.firebaseProjectId && gcpMetrics && \([\s\S]*?              \)\}/;
   
   const targetReplacement = `              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 shrink-0">
${extractedElements.replace(/^/gm, '  ')}
${customDatesStr.replace(/^/gm, '  ')}
              </div>`;

   content = content.replace(debugBtnsRegex, targetReplacement);
   
   fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
   console.log('Success');
} else {
   console.log('Top bar regex failed');
}

