import { useState } from 'react';
import { 
  Bot, MessageSquare, Check, Sparkles, Phone, Volume2, 
  Send, User, Copy, CheckCheck, Play, ArrowRight, Sliders,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'motion/react';

export function FeatureDeepDives() {
  // Deep Dive 3: Editor Copy state
  const [editorTone, setEditorTone] = useState<'persuasive' | 'luxury' | 'direct'>('persuasive');
  const [copied, setCopied] = useState(false);

  // Deep Dive 4: Virtual Staging Slider state (0 to 100)
  const [sliderPos, setSliderPos] = useState(50);

  const sampleCopies = {
    persuasive: "Apartamento espetacular de 115m² em andar alto, com vista livre e permanente. Possui 3 suítes amplas, varanda gourmet integrada e acabamentos de primeiríssima linha. Condomínio clube completo com piscina aquecida, academia de ponta e 2 vagas demarcadas. Oportunidade única para quem valoriza conforto e localização privilegiada.",
    luxury: "Exclusividade e sofisticação definem este imóvel de 115m². Projeto arquitetônico impecável com 3 refinadas suítes, living integrado à varanda gourmet com iluminação cênica. Lazer privativo de padrão internacional no endereço mais nobre da região. Um refúgio urbano para quem exige o mais alto padrão.",
    direct: "Apto 115m² | 3 Suítes | Varanda Gourmet | 2 Vagas. Andar alto com vista livre. Condomínio completo com piscina, academia e portaria 24h. Aceita financiamento bancário. Pronto para morar."
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleCopies[editorTone]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="solucoes" className="py-20 sm:py-28 bg-[#F9FAFC] border-b border-slate-200/80 space-y-24 sm:space-y-32">
      
      {/* ---------------- FEATURE 1: LYA SDR WHATSAPP 24/7 ---------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5" />
              <span>LYA SDR • ATENDIMENTO IMEDIATO</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Seu primeiro atendimento não pode depender do horário comercial.
            </h2>
            
            <p className="text-base text-slate-600 leading-relaxed">
              O lead não quer esperar amanhã de manhã. A LYA SDR responde instantaneamente no WhatsApp 24 horas por dia, 7 dias por semana, tirando dúvidas, qualificando o perfil e agendando a reunião.
            </p>

            <ul className="space-y-3.5 pt-2">
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Tempo de resposta de 3 segundos:</strong> Nenhum cliente fica sem retorno ou procura o concorrente.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Qualificação inteligente:</strong> Coleta orçamento, urgência e requisitos antes de passar ao corretor.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Agendamento direto:</strong> Conecta a agenda do seu time e bloqueia o horário automaticamente.</span>
              </li>
            </ul>
          </div>

          {/* Right WhatsApp Simulator Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white relative">
                    <span>LY</span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#075E54] absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <span>LYA SDR • Atendimento</span>
                      <span className="bg-emerald-400 text-slate-900 text-[9px] font-black px-1.5 py-0.2 rounded-full">✓ OFICIAL</span>
                    </div>
                    <div className="text-[11px] text-emerald-200">Online agora • Resposta instantânea</div>
                  </div>
                </div>
                <Phone className="w-4 h-4 text-white/80" />
              </div>

              {/* Chat Body */}
              <div className="bg-[#EFEAE2] p-4 space-y-3 min-h-[320px] text-xs font-sans">
                
                {/* Incoming user message */}
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-xs shadow-xs max-w-[85%] text-slate-800 space-y-1">
                    <p>Olá, boa noite! Vi o anúncio no portal e gostaria de saber se aceita financiamento e se dá pra visitar amanhã.</p>
                    <div className="text-[10px] text-slate-400 text-right">21:42</div>
                  </div>
                </div>

                {/* AI Instant Reply */}
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] p-3 rounded-2xl rounded-tr-xs shadow-xs max-w-[85%] text-slate-900 space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>LYA AI Assistente</span>
                    </div>
                    <p>Olá! Aceita financiamento bancário sim! 🏡 Temos horário para visita amanhã às <strong>14:00</strong> ou às <strong>16:30</strong>. Qual horário fica melhor para você?</p>
                    <div className="text-[10px] text-slate-500 text-right flex items-center justify-end gap-1">
                      <span>21:42</span>
                      <CheckCheck className="w-3 h-3 text-emerald-600" />
                    </div>
                  </div>
                </div>

                {/* User selection */}
                <div className="flex justify-start">
                  <div className="bg-white p-2.5 rounded-2xl rounded-tl-xs shadow-xs text-slate-800">
                    <p>Pode ser amanhã às 14:00!</p>
                    <div className="text-[10px] text-slate-400 text-right">21:43</div>
                  </div>
                </div>

                {/* AI Confirmation */}
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] p-3 rounded-2xl rounded-tr-xs shadow-xs max-w-[85%] text-slate-900 space-y-1">
                    <p>Perfeito! Visita confirmada para amanhã às 14:00 com o consultor Rafael. Acabei de enviar o endereço completo no seu e-mail!</p>
                    <div className="text-[10px] text-slate-500 text-right flex items-center justify-end gap-1">
                      <span>21:43</span>
                      <CheckCheck className="w-3 h-3 text-emerald-600" />
                    </div>
                  </div>
                </div>

                {/* CRM Status Tag */}
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-2 text-center text-[11px] font-semibold flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lead Qualificado • Score 98% • Registrado no CRM</span>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ---------------- FEATURE 2: LYA OMNICHANNEL + AUDIO TRANSCRIPTION ---------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left CRM UI Mockup */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-4 sm:p-6 space-y-4">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Inbox Unificado WhatsApp CRM</h4>
                    <div className="text-xs text-slate-500">12 conversas ativas no momento</div>
                  </div>
                </div>
                <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-full border border-purple-200">
                  Transcrição IA Ativa
                </span>
              </div>

              {/* Audio Message & Live AI Transcription Pill */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Áudio recebido de: Camila Silveira</span>
                  </div>
                  <span className="text-slate-400">0:42</span>
                </div>

                {/* Fake Waveform */}
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <button className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                  <div className="flex items-center gap-1 flex-1 h-6">
                    {[40, 70, 30, 90, 60, 80, 45, 95, 30, 85, 60, 40, 70, 90, 50, 65, 30, 75, 50, 35].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-purple-300 rounded-full"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* AI Transcription Result */}
                <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-purple-800 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Transcrição da IA (Resumo para o CRM):</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-sans">
                    "Cliente informa que precisa se mudar até o dia 15 do próximo mês. Orçamento aprovado de até R$ 850 mil para compra à vista ou financiamento facilitado. Tem preferência por 3 dormitórios com varanda."
                  </p>
                </div>
              </div>

              {/* CRM Lead Action Drawer */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                  Status: Quente 🔥
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                  Budget: R$ 850k
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                  Urgência: Alta
                </div>
              </div>

            </div>
          </div>

          {/* Right Text Column */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>LYA OMNICHANNEL • SEM CAOS NO WHATSAPP</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              WhatsApp, CRM e IA na mesma conversa.
            </h2>
            
            <p className="text-base text-slate-600 leading-relaxed">
              Chega de conversas perdidas no celular particular de corretores. Centralize todo o atendimento em um único número oficial com histórico unificado e transcrição automática de áudios longos.
            </p>

            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Transcrição de áudio:</strong> Ouça ou leia resumos gerados pela IA em segundos.</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Histórico seguro:</strong> Se um membro da equipe sair, a carteira e o histórico continuam na empresa.</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Tags automáticas:</strong> Classificação por temperatura e interesse sem trabalho manual.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ---------------- FEATURE 3: LYA EDITOR (COPYWRITING) ---------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LYA EDITOR • COPYWRITING AUTOMÁTICO</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Chega de anúncio com descrição genérica ou em branco.
            </h2>
            
            <p className="text-base text-slate-600 leading-relaxed">
              A IA transforma simples especificações técnicas em descrições persuasivas, ricas em detalhes e otimizadas para busca no Google (SEO), aumentando a taxa de cliques e conversão.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-amber-100/70 text-amber-900 text-xs font-semibold px-3 py-1 rounded-full">
                ✓ Otimizado para SEO
              </span>
              <span className="bg-amber-100/70 text-amber-900 text-xs font-semibold px-3 py-1 rounded-full">
                ✓ Ajuste de tom de voz
              </span>
              <span className="bg-amber-100/70 text-amber-900 text-xs font-semibold px-3 py-1 rounded-full">
                ✓ Pronto em 2 segundos
              </span>
            </div>
          </div>

          {/* Right Interactive Copy Editor Mockup */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Gerador de Descrições IA
                </div>
                <div className="flex items-center gap-1">
                  {(['persuasive', 'luxury', 'direct'] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setEditorTone(tone)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        editorTone === tone
                          ? 'bg-amber-500 text-white font-bold shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tone === 'persuasive' ? 'Persuasivo' : tone === 'luxury' ? 'Alto Padrão' : 'Direto'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Box */}
              <div className="p-4 rounded-2xl bg-[#FEFDF8] border border-amber-200/80 text-xs text-slate-800 leading-relaxed font-sans min-h-[140px] relative">
                <p>{sampleCopies[editorTone]}</p>
                
                <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>SEO Score: <strong>98/100 (Excelente)</strong></span>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ---------------- FEATURE 4: LYA STUDIO (VIRTUAL STAGING) ---------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Interactive Staging Slider */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-4 sm:p-6 space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Virtual Staging Antes & Depois
                  </span>
                </div>
                <span className="text-xs text-rose-600 font-bold">Arraste para comparar</span>
              </div>

              {/* Interactive Staging Viewer */}
              <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden select-none border border-slate-200">
                {/* AFTER IMAGE (Decorated) */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000&q=80')`
                  }}
                >
                  <span className="absolute bottom-3 right-3 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                    ✨ Com Virtual Staging IA
                  </span>
                </div>

                {/* BEFORE IMAGE (Empty Room Overlay) */}
                <div
                  className="absolute inset-0 bg-cover bg-center overflow-hidden border-r-2 border-white shadow-2xl"
                  style={{
                    width: `${sliderPos}%`,
                    backgroundImage: `url('https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&q=80')`
                  }}
                >
                  <span className="absolute bottom-3 left-3 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                    Foto Original Vazia
                  </span>
                </div>

                {/* Slider Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 flex items-center justify-center"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="w-7 h-7 rounded-full bg-white shadow-lg border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold">
                    ↔
                  </div>
                </div>
              </div>

              {/* Slider Range Control */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs text-slate-500 font-medium">Original</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <span className="text-xs text-rose-600 font-bold">Staged IA</span>
              </div>

            </div>
          </div>

          {/* Right Text */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>LYA STUDIO • DECORAÇÃO VIRTUAL</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Fotos vazias não precisam parecer frias ou sem vida.
            </h2>
            
            <p className="text-base text-slate-600 leading-relaxed">
              O LYA Studio transforma fotos cruas em ambientes decorados, iluminados e aconchegantes com poucos cliques, permitindo que o cliente se imagine morando no espaço.
            </p>

            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>Aumento de cliques:</strong> Anúncios mobiliados virtualmente recebem até 3x mais contatos.</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>Custo zero de produção:</strong> Sem necessidade de móveis físicos ou fotógrafos caros.</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>Tratamento de luz e céu:</strong> Correção automática de fotos escuras ou nubladas.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

    </section>
  );
}
