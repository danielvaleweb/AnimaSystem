const fs = require('fs');
let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

content = content.replace(
  'const [isDiscovering, setIsDiscovering] = useState(false);',
  `const [isDiscovering, setIsDiscovering] = useState(false);
  const [bqProjectId, setBqProjectId] = useState('');
  const [bqDatasetId, setBqDatasetId] = useState('');
  const [bqTableId, setBqTableId] = useState('');
  const [isBqSyncing, setIsBqSyncing] = useState(false);
  const [bqError, setBqError] = useState('');
  const [bqResult, setBqResult] = useState<any>(null);`
);

content = content.replace(
  'const handleToggleStatus = async',
  `const handleBqSync = async () => {};\n  const handleToggleStatus = async`
);

fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
