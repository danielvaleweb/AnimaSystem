const fs = require('fs');

let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

// 1. Rename button on the screen
content = content.replace(
  /<Upload className="w-4 h-4 shrink-0" \/>\n\s*<span>Sincronizar Faturamento \(CSV\)<\/span>/,
  '<Zap className="w-4 h-4 shrink-0" />\n                <span>Sincronizar Faturamento</span>'
);

// 2. Remove the tabs inside the modal
const tabsRegex = /\{\/\* Tab Selector \*\/\}\n\s*\{csvSuccessCount === null && \([\s\S]*?<\/div>\n\s*\)\}/;
content = content.replace(tabsRegex, '');

// 3. Update the conditional rendering for the success view and main view
// The old code:
// {csvSuccessCount !== null ? ( ... ) : billingSyncTab === 'csv' ? ( ... ) : ( ...bq view... )}

// We want:
// {csvSuccessCount !== null ? ( ... ) : ( ...bq view... )}

const csvViewStart = /: billingSyncTab === 'csv' \? \(\n\s*<div className="space-y-4">/;
const csvViewEndStr = '</div>\n              ) : (\n                <div className="space-y-4">\n                  <div className="p-4 bg-accent/5';

let csvStartIndex = content.search(csvViewStart);
if (csvStartIndex !== -1) {
    let before = content.substring(0, csvStartIndex);
    let afterStart = content.substring(csvStartIndex);
    
    let afterCsvEndIndex = afterStart.indexOf(csvViewEndStr);
    
    if (afterCsvEndIndex !== -1) {
        let after = afterStart.substring(afterCsvEndIndex + csvViewEndStr.length - '<div className="space-y-4">\n                  <div className="p-4 bg-accent/5'.length);
        
        // Connect them:
        content = before + ' : (\n                ' + after;
    }
}

// Write the file
fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
console.log("CSV UI removed.");
