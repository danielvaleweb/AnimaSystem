import fs from 'fs';
let content = fs.readFileSync('src/components/plans/CheckoutView.tsx', 'utf8');

const funcMatch = "const generateAsaasCheckout = async (name: string, email: string, phone: string, cpf: string) => {";

content = content.replace(
  funcMatch,
  `const handleCreditCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessingCC) return;
    setIsProcessingCC(true);
    setCcError('');

    try {
      const effName = (leadName || clientInfo?.responsible || clientInfo?.name || clientInfo?.companyRazaoSocial || '').trim();
      const rawCpf = (leadCpf || clientInfo?.cpf || clientInfo?.cnpj || clientInfo?.companyCnpj || '').replace(/\\D/g, '');
      const rawPhone = (leadPhone || clientInfo?.phone || clientInfo?.companyPhone || '').replace(/\\D/g, '');
      const rawEmail = (leadEmail || clientInfo?.email || clientInfo?.companyEmail || '').trim();
      const cleanEmail = rawEmail || \`cliente_\${rawCpf || Date.now()}@animasystem.com.br\`;

      const response = await fetch('/api/asaas/pay-credit-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrderId,
          creditCard: {
            holderName: ccName,
            number: ccNumber,
            expiryMonth: ccExpiry.split('/')[0]?.trim() || '',
            expiryYear: ccExpiry.split('/')[1]?.trim() || '',
            ccv: ccCvv
          },
          creditCardHolderInfo: {
            name: effName || 'Cliente AnimaSystem',
            email: cleanEmail,
            cpfCnpj: rawCpf || '00000000000',
            phone: rawPhone || '11999999999',
            postalCode: '01310100',
            addressNumber: '100'
          },
          installmentCount: ccInstallments
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setCcError(data.error || 'Ocorreu um erro ao processar o cartão.');
        setIsProcessingCC(false);
        return;
      }

      setIsPaymentConfirmed(true);
      setActivePaymentTab('pix');
    } catch (err: any) {
      setCcError(err.message || 'Falha de comunicação. Tente novamente.');
    } finally {
      setIsProcessingCC(false);
    }
  };

  ${funcMatch}`
);

fs.writeFileSync('src/components/plans/CheckoutView.tsx', content);
