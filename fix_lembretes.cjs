const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

const oldStr = `                  {/* Lembretes List (Slide 1 by 1) */}
                  <div className="flex-1 flex flex-col justify-center overflow-hidden relative min-h-[140px]">
                    {clients.length > 0 ? clients.slice(0, 5).map((client, idx) => {
                      const today = new Date();`;

const newStr = `                  {/* Lembretes List (Slide 1 by 1) */}
                  <div className="flex-1 flex flex-col justify-center overflow-hidden relative min-h-[140px]">
                    {clients.filter(c => c.status === 'active').length > 0 ? clients.filter(c => c.status === 'active').slice(0, 5).map((client, idx) => {
                      const today = new Date();`;

content = content.replace(oldStr, newStr);

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
