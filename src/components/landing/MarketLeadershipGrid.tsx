import { 
  Building2, LineChart, Globe, BarChart3, Network, Sparkles, 
  Users, Layers, ArrowRight, CheckCircle2, Shield, Code
} from 'lucide-react';
import { motion } from 'motion/react';

interface MarketLeadershipGridProps {
  onOpenDemoModal: () => void;
}

export function MarketLeadershipGrid({ onOpenDemoModal }: MarketLeadershipGridProps) {
  return (
    <section id="ecossistema" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80 space-y-24">
      
      {/* ---------------- 1. MARKET LEADERSHIP PILLARS ---------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>SOLIDEZ E MERCADO</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            A inteligência é nova. <br />
            <span className="text-emerald-600">A plataforma já lidera o mercado.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Você não precisa escolher entre uma ferramenta de IA moderna e um sistema de gestão robusto. Aqui você tem ambos no mesmo ambiente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Pillar 1: CRM */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-2xs hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">CRM para Vendas</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Estrutura comercial completa para cadastrar contatos, distribuir leads com regras personalizadas, simular propostas e fechar contratos com rapidez.
            </p>
          </div>

          {/* Pillar 2: ERP */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-2xs hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
              <LineChart className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">ERP Financeiro e Gestão</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Automação completa de cobranças com envio por WhatsApp/Email, régua de faturamento automática e redução comprovada de inadimplência.
            </p>
          </div>

          {/* Pillar 3: Sites */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-2xs hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Sites Integrados & SEO</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Páginas de alta performance preparadas para ranquear no Google, responsivas em celulares e conectadas em tempo real ao banco de dados.
            </p>
          </div>

          {/* Pillar 4: BI */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-2xs hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">BI e Indicadores Vivos</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Dashboards inteligentes com dados de conversão, ticket médio, tempo de resposta e previsibilidade financeira para a tomada de decisão.
            </p>
          </div>

          {/* Pillar 5: Integrações */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-2xs hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Integrações & Portais</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Conexão com os principais portais de anúncios, gateways de pagamento, birôs de crédito e redes sociais sem atrito.
            </p>
          </div>

          {/* Pillar 6: Highlighted Dark Quote Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-7 border border-slate-800 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 mb-3 tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PRINCÍPIO AI FIRST</span>
              </div>
              <p className="text-base font-bold text-slate-100 leading-snug">
                "IA sem operação vira ferramenta solta. Na nossa plataforma, a IA trabalha conectada diretamente à sua rotina real."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Tecnologia proprietária</span>
              <span className="text-emerald-400 font-semibold">100% Integrado</span>
            </div>
          </div>

        </div>

      </div>

      {/* ---------------- 2. NETWORK & COMMUNITY ---------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm">
          
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              FORÇA DE REDE
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Sozinho você compete. Com inteligência e rede, você lidera.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-3">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Comunidade que Multiplica</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Mais de 50 mil profissionais trocam oportunidades, realizam parcerias de negócios e fecham negócios conjuntos através do ecossistema.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Integrações sem Atrito</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Reduza horas de digitação manual: publique uma vez e replique em múltiplos portais, canais e parceiros com um só clique.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-3">
                <LineChart className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Dados que Direcionam</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Acesse insights reais de mercado, tendências de preço, comportamento de compra e demanda por região para tomar decisões com segurança.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* ---------------- 3. API & PARTNERS BANNER ---------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                <Code className="w-3.5 h-3.5" />
                <span>ECOSSISTEMA & DESENVOLVEDORES</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Conecte sua solução ao ecossistema que agora também é AI First.
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div>
                  <div className="text-xs font-bold text-white">Integração Oficial</div>
                  <div className="text-[11px] text-slate-400">APIs REST e Webhooks</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Mercado Relevante</div>
                  <div className="text-[11px] text-slate-400">8k+ empresas ativas</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Valor Real</div>
                  <div className="text-[11px] text-slate-400">Sem burocracia técnica</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Credibilidade</div>
                  <div className="text-[11px] text-slate-400">Segurança de nível bancário</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <button
                onClick={onOpenDemoModal}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg cursor-pointer"
              >
                <span>Integrar com a plataforma</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

    </section>
  );
}
