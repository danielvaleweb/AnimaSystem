import fs from 'fs';
let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');
content = content.replace(
  "import { cn } from '../../utils';",
  "import { cn, getClientRenewalInfo } from '../../utils';"
);
content = content.replace(
  `                      const today = new Date();
                      const dueDate = new Date();
                      dueDate.setDate(client.dueDate || (today.getDate() + idx));
                      
                      const isToday = dueDate.getDate() === today.getDate();
                      const daysLeft = dueDate.getDate() - today.getDate();
                      
                      let statusText = "";
                      let statusColor = "";
                      
                      if (isToday) {
                        statusText = "Vence Hoje";
                        statusColor = "text-red-600 bg-red-50 border-red-100";
                      } else if (daysLeft < 0) {
                        statusText = "Atrasado";
                        statusColor = "text-red-700 bg-red-50 border-red-200";
                      } else {
                        statusText = \`Vence em \${daysLeft} dias\`;
                        statusColor = "text-amber-600 bg-amber-50 border-amber-100";
                      }`,
  `                      const renewInfo = getClientRenewalInfo(client);
                      const daysLeft = renewInfo.daysUntilRenewal;
                      
                      let statusText = "";
                      let statusColor = "";
                      
                      if (daysLeft === 0) {
                        statusText = "Vence Hoje";
                        statusColor = "text-red-600 bg-red-50 border-red-100";
                      } else if (daysLeft < 0) {
                        statusText = "Atrasado";
                        statusColor = "text-red-700 bg-red-50 border-red-200";
                      } else {
                        statusText = \`Vence em \${daysLeft} dias\`;
                        statusColor = "text-amber-600 bg-amber-50 border-amber-100";
                      }`
);
fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
