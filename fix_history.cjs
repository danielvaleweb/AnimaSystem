const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

const oldStr = `            {/* Bottom part of Column 3: History */}
            <div className="bg-white border border-zinc-200/75 rounded-3xl p-6 flex flex-col justify-between flex-1">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100">`;

const newStr = `            {/* Bottom part of Column 3: History */}
            <div className="bg-white border border-zinc-200/75 rounded-3xl p-6 flex flex-col justify-start flex-1">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100">`;

content = content.replace(oldStr, newStr);

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
