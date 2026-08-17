const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

content = content.replace(/<img src=\{client\.logoUrl\} alt=\{client\.name\} className="w-full h-full object-cover" \/>/g, 
  '<img src={client.logoUrl} alt={client.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />');

content = content.replace(/<img src=\{dashboardBanners\.banner1\} className="w-full h-full object-cover" alt="Banner 1" \/>/g,
  '<img src={dashboardBanners.banner1} className="w-full h-full object-cover" alt="Banner 1" loading="lazy" decoding="async" />');

content = content.replace(/<img src=\{dashboardBanners\.banner2\} className="w-full h-full object-cover" alt="Banner 2" \/>/g,
  '<img src={dashboardBanners.banner2} className="w-full h-full object-cover" alt="Banner 2" loading="lazy" decoding="async" />');

content = content.replace(/<img src=\{dashboardBanners\.banner3\} className="w-full h-full object-cover" alt="Banner 3" \/>/g,
  '<img src={dashboardBanners.banner3} className="w-full h-full object-cover" alt="Banner 3" loading="lazy" decoding="async" />');

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
