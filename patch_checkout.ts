import fs from 'fs';

let content = fs.readFileSync('src/components/plans/CheckoutView.tsx', 'utf8');

// 1. Add Credit Card State
content = content.replace(
  "const [pixCopySuccess, setPixCopySuccess] = useState(false);",
  `const [pixCopySuccess, setPixCopySuccess] = useState(false);
  const [ccName, setCcName] = useState('');
  const [ccNumber, setCcNumber] = useState('');
  const [ccExpiry, setCcExpiry] = useState('');
  const [ccCvv, setCcCvv] = useState('');
  const [ccInstallments, setCcInstallments] = useState(1);
  const [isProcessingCC, setIsProcessingCC] = useState(false);
  const [ccError, setCcError] = useState('');`
);

// 2. Add handleCreditCardPayment function right before handleCreateLeadAndCheckout
const funcMatch = "const handleCreateLeadAndCheckout = async (e: React.FormEvent) => {";

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

// 3. Replace the entire Aba de Visualização do Asaas
const viewStart = `/* Aba de Visualização do Asaas */`;
const viewEnd = `                  {/* Faixa Inferior com Instruções e Botão de Acesso */}`;

const abaIndex = content.indexOf(viewStart);
const endIndex = content.indexOf(viewEnd);

const replaceContent = `/* Aba de Visualização do Asaas (Native Credit Card Checkout) */
                      <div className="w-full h-full bg-[#F3F4F6] overflow-y-auto">
                        
                        {/* Asaas Blue Header Mimic */}
                        <div className="bg-[#0230A5] text-white p-6 sm:p-8">
                          <div className="max-w-2xl mx-auto space-y-4">
                            <div>
                              <h2 className="text-xl sm:text-2xl font-bold">{leadName || clientInfo?.responsible || clientInfo?.name || 'Cliente'}</h2>
                              <p className="text-blue-100 font-mono text-sm">{formatCpf(leadCpf || clientInfo?.cpf || clientInfo?.cnpj || '')}</p>
                            </div>
                            
                            <div className="text-sm text-blue-100 space-y-1">
                              <p>{leadEmail || clientInfo?.email || 'Nenhum email fornecido'}</p>
                              <p>{formatPhone(leadPhone || clientInfo?.phone || '')}</p>
                            </div>

                            <div className="pt-2 border-t border-blue-800/50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                <span className="text-sm font-medium">Aguardando Pagamento</span>
                              </div>
                              <a href={generatedCheckoutUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-200 underline hover:text-white">
                                Visualizar Boleto original
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Asaas Body Content */}
                        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
                          
                          <h3 className="text-lg font-medium text-zinc-800">Dados da fatura - {activeOrderId || 'AS-RENOVACAO'}</h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm space-y-2">
                              <span className="text-xs text-zinc-600 font-semibold block">Valor total</span>
                              <span className="text-2xl font-bold text-[#0230A5]">R$ {total.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm space-y-2">
                              <span className="text-xs text-zinc-600 font-semibold block">Data de vencimento</span>
                              <span className="text-xl font-bold text-[#0230A5]">{new Date().toLocaleDateString('pt-BR')}</span>
                              <span className="text-[10px] text-zinc-400 block">(hoje)</span>
                            </div>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm space-y-2">
                            <span className="text-xs text-zinc-600 font-semibold block">Descrição</span>
                            <p className="text-sm text-zinc-800">Pedido {activeOrderId || 'AS-RENOVACAO'} - {planDetails[planParam]?.name}</p>
                          </div>

                          {/* Credit Card Form */}
                          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                              <CreditCard className="w-6 h-6 text-zinc-900" />
                              <h3 className="text-lg font-bold text-zinc-900">Pagamento com Cartão</h3>
                            </div>

                            <form onSubmit={handleCreditCardSubmit} className="space-y-4">
                              {ccError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                                  {ccError}
                                </div>
                              )}
                              
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700">Número do Cartão</label>
                                <input 
                                  type="text" 
                                  required
                                  placeholder="0000 0000 0000 0000"
                                  maxLength={19}
                                  value={ccNumber}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\\D/g, '').slice(0, 16);
                                    const formatted = val.replace(/(\\d{4})(?=\\d)/g, '$1 ').trim();
                                    setCcNumber(formatted);
                                  }}
                                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-zinc-400 focus:bg-white transition-all font-mono"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700">Nome Impresso no Cartão</label>
                                <input 
                                  type="text" 
                                  required
                                  placeholder="NOME COMPLETO"
                                  value={ccName}
                                  onChange={(e) => setCcName(e.target.value.toUpperCase())}
                                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-zinc-400 focus:bg-white transition-all uppercase"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-zinc-700">Validade</label>
                                  <input 
                                    type="text" 
                                    required
                                    placeholder="MM/AA"
                                    maxLength={5}
                                    value={ccExpiry}
                                    onChange={(e) => {
                                      let val = e.target.value.replace(/\\D/g, '').slice(0, 4);
                                      if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2);
                                      setCcExpiry(val);
                                    }}
                                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-zinc-400 focus:bg-white transition-all font-mono text-center"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-zinc-700">CVV</label>
                                  <input 
                                    type="text" 
                                    required
                                    placeholder="123"
                                    maxLength={4}
                                    value={ccCvv}
                                    onChange={(e) => setCcCvv(e.target.value.replace(/\\D/g, ''))}
                                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-zinc-400 focus:bg-white transition-all font-mono text-center"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700">Parcelamento</label>
                                <select 
                                  value={ccInstallments}
                                  onChange={(e) => setCcInstallments(Number(e.target.value))}
                                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-zinc-400 focus:bg-white transition-all font-medium text-zinc-700"
                                >
                                  <option value={1}>1x de R$ {total.toFixed(2).replace('.', ',')}</option>
                                  {[2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>
                                      {num}x de R$ {(total / num).toFixed(2).replace('.', ',')} sem juros
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="pt-4 flex flex-col gap-3">
                                <button
                                  type="submit"
                                  disabled={isProcessingCC || !ccNumber || !ccName || !ccExpiry || !ccCvv}
                                  className="w-full py-4 bg-[#D7FE03] hover:bg-[#c4e602] text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isProcessingCC ? (
                                    <>
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      <span>Processando...</span>
                                    </>
                                  ) : (
                                    <span>Pagar R$ {total.toFixed(2).replace('.', ',')}</span>
                                  )}
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => setActivePaymentTab('pix')}
                                  className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-colors"
                                >
                                  Voltar para PIX Automático
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
`;

content = content.substring(0, abaIndex) + replaceContent + content.substring(endIndex);

fs.writeFileSync('src/components/plans/CheckoutView.tsx', content);
