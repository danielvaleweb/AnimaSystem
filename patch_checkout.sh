cat << 'INNEREOF' > src/components/plans/CheckoutView.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, QrCode } from 'lucide-react';

export default function CheckoutView() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const plan = searchParams.get('plan') || 'starter';
  
  return (
    <div className="min-h-screen bg-[#F5F5F8] flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-zinc-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-black mb-2">Pagamento via PIX</h1>
          <p className="text-zinc-500 text-sm">Plano selecionado: <span className="font-bold text-black uppercase">{plan}</span></p>
        </div>
        
        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex flex-col items-center mb-6">
          <div className="w-48 h-48 bg-white border border-zinc-200 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <QrCode className="w-24 h-24 text-zinc-800" />
          </div>
          <div className="text-sm text-zinc-600 space-y-2 text-center w-full">
            <p><span className="font-semibold text-black">Chave PIX:</span> 24981000306</p>
            <p><span className="font-semibold text-black">Instituição:</span> Banco Inter</p>
            <p><span className="font-semibold text-black">Nome:</span> Daniel Vale</p>
            <p><span className="font-semibold text-black">CPF:</span> 142.***.***-45</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={() => navigate('/admin-cliente')}
            className="w-full py-4 rounded-xl bg-[#D7FE03] hover:bg-[#c4e602] text-zinc-950 font-bold tracking-wide transition-all uppercase text-sm shadow-md"
          >
            Já Paguei
          </button>
          <button 
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-semibold text-sm transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
INNEREOF

sed -i 's/import CheckoutView from .*/import CheckoutView from ".\/components\/plans\/CheckoutView";\nimport AddServicesView from ".\/components\/plans\/AddServicesView";\nimport ClientAdminView from ".\/components\/plans\/ClientAdminView";/g' src/App.tsx
sed -i 's/<Route path="\/checkout" element={<CheckoutView \/>} \/>/<Route path="\/checkout" element={<CheckoutView \/>} \/>\n      <Route path="\/adicionar-servicos" element={<AddServicesView \/>} \/>\n      <Route path="\/admin-cliente" element={<ClientAdminView \/>} \/>/g' src/App.tsx
