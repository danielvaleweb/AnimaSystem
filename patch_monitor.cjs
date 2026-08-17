const fs = require('fs');
let content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

// Replace handleUpdateStatus
const oldFn = `  const handleUpdateStatus = async (newStatus: 'active' | 'suspended' | 'ended' | 'trial' | 'developing') => {
    if (!selectedClient) return;
    try {
      await updateDoc(doc(db, 'clients', selectedClient.id), {
        status: newStatus
      });
      setIsStatusDropdownOpen(false);
    } catch (err) {
      console.error("Error updating client status:", err);
      setErrorMsg("Erro ao atualizar status do cliente.");
    }
  };`;

const newFn = `  const handleUpdateStatus = async (newStatus: 'active' | 'suspended' | 'ended' | 'trial' | 'developing') => {
    if (!selectedClient) return;
    if (newStatus === 'trial') {
      setIsTrialModalOpen(true);
      setIsStatusDropdownOpen(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'clients', selectedClient.id), {
        status: newStatus,
        trialEndDate: null
      });
      setIsStatusDropdownOpen(false);
    } catch (err) {
      console.error("Error updating client status:", err);
      setErrorMsg("Erro ao atualizar status do cliente.");
    }
  };

  const handleConfirmTrial = async () => {
    if (!selectedClient || !trialEndDate) return;
    try {
      await updateDoc(doc(db, 'clients', selectedClient.id), { status: 'trial', trialEndDate });
      setIsTrialModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao atualizar status para trial.');
    }
  };`;

content = content.replace(oldFn, newFn);
fs.writeFileSync('src/components/monitor/MonitorView.tsx', content);
