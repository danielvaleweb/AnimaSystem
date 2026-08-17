const fs = require('fs');

let cContent = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');
cContent = cContent.replace(
  'Rocket, Power, Code, Hand, Clock, Check, Sparkles, CreditCard',
  'Rocket, Power, Code, Hand, Clock, Check, Sparkles, CreditCard, Phone'
);
fs.writeFileSync('src/components/clients/ClientDetailView.tsx', cContent);

let mContent = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');
mContent = mContent.replace(
  'const handleBqSync = async () => {};',
  `const handleBqSync = async () => {
    setIsBqSyncing(true);
    setBqError('');
    setTimeout(() => {
      setIsBqSyncing(false);
      setBqResult('Sincronização concluída com sucesso!');
    }, 2000);
  };`
);
fs.writeFileSync('src/components/monitor/MonitorView.tsx', mContent);
