const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

content = content.replace(
  'const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);',
  `const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState('');`
);

fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
