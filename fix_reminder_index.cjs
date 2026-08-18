const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

const oldStr = `  useEffect(() => {
    if (clients.length === 0) return;
    const interval = setInterval(() => {
      setCurrentReminderIndex((prev) => (prev + 1) % Math.min(clients.length, 5));
    }, 4000);
    return () => clearInterval(interval);
  }, [clients]);`;

const newStr = `  useEffect(() => {
    const activeClients = clients.filter(c => c.status === 'active');
    if (activeClients.length === 0) return;
    const interval = setInterval(() => {
      setCurrentReminderIndex((prev) => (prev + 1) % Math.min(activeClients.length, 5));
    }, 4000);
    return () => clearInterval(interval);
  }, [clients]);`;

content = content.replace(oldStr, newStr);

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
