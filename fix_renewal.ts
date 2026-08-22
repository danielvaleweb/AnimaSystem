import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(
  `        let baseDate = new Date();
        if (existingClientData?.nextRenewalDate && /^\\d{4}-\\d{2}-\\d{2}/.test(existingClientData.nextRenewalDate)) {
          const [y, m, d] = existingClientData.nextRenewalDate.split('-').map(Number);
          const parsed = new Date(y, m - 1, d);
          if (parsed > baseDate) {
            baseDate = parsed;
          }
        }
        baseDate.setMonth(baseDate.getMonth() + (isRenewal ? renewalMonths : 1));`,
  `        let baseDate = new Date();
        if (existingClientData?.nextRenewalDate && /^\\d{4}-\\d{2}-\\d{2}/.test(existingClientData.nextRenewalDate)) {
          const [y, m, d] = existingClientData.nextRenewalDate.split('-').map(Number);
          baseDate = new Date(y, m - 1, d);
        }
        baseDate.setMonth(baseDate.getMonth() + (isRenewal ? renewalMonths : 1));`
);
fs.writeFileSync('server.ts', content);
