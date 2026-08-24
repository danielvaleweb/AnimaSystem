import { 
  MessageSquare
} from 'lucide-react';
import { LightningLogo } from '../LightningLogo';

interface MegaCtaAndFooterProps {
  brandName: string;
  onOpenDemoModal: () => void;
  onOpenLoginModal: () => void;
}

export function MegaCtaAndFooter({ brandName, onOpenDemoModal, onOpenLoginModal }: MegaCtaAndFooterProps) {

  return (
    <>
      {/* ---------------- COMPREHENSIVE FOOTER ---------------- */}
      <footer className="bg-[#09090b] text-zinc-400 text-xs border-t border-zinc-800/80 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
            
            {/* Column 1 & 2: Brand Narrative */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-black flex items-center justify-center text-[#D7FE03] border border-zinc-800">
                  <LightningLogo className="w-4 h-4 text-[#D7FE03]" />
                </div>
                <span className="text-2xl font-sans tracking-tight select-none">
                  <span className="font-light text-zinc-400">Anima</span>
                  <span className="font-bold text-white tracking-tight">System</span>
                </span>
              </div>
              
              <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
                A plataforma AI First líder para empresas, integrando inteligência artificial ao WhatsApp, CRM de vendas, ERP de gestão e sites de alta conversão.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={onOpenLoginModal}
                  className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-700 transition-colors"
                >
                  Área do Cliente →
                </button>
              </div>
            </div>

            {/* Column 3: SERVIÇOS */}
            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-3 text-[11px]">
                SERVIÇOS
              </div>
              <ul className="space-y-2">
                <li><a href="#portfolio" className="hover:text-white transition-colors">ERP Lava-Jato</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">ERP Mecânica</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">ERP Imobiliária</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">Desenvolvimento Sites</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">Desenvolvimento Apps</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">Desenvolvimento CRM</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">Landing Pages</a></li>
              </ul>
            </div>

            {/* Column 4: IA & TECNOLOGIA */}
            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-3 text-[11px]">
                IA & TECNOLOGIA
              </div>
              <ul className="space-y-2">
                <li><a href="#planos" className="hover:text-white transition-colors">Como funcionam Koins</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">LYA SDR (WhatsApp 24/7)</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Transcrição de Áudios</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Virtual Staging IA</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">Cluster Google Cloud</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">Segurança & LGPD</a></li>
              </ul>
            </div>

            {/* Column 5: PLANOS */}
            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-3 text-[11px]">
                PLANOS
              </div>
              <ul className="space-y-2">
                <li><a href="#planos" className="hover:text-white transition-colors">Plano Starter</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Plano Pro</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Plano Enterprise</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Perguntas Frequentes (FAQ)</a></li>
              </ul>
            </div>

            {/* Column 6: EMPRESA */}
            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-3 text-[11px]">
                EMPRESA
              </div>
              <ul className="space-y-2">
                <li><a href="#sobre" className="hover:text-white transition-colors">Sobre Nós</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">Portfólio de Projetos</a></li>
                <li><span className="text-zinc-500">Termos de Uso</span></li>
                <li><span className="text-zinc-500">Privacidade (LGPD)</span></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Central de Suporte</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar with Status Badge */}
          <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D7FE03] animate-pulse" />
              <span className="text-zinc-300">Todos os Serviços Operacionais • SLA 99.9% Google Cloud</span>
            </div>
            
            <div className="text-zinc-500">
              © {new Date().getFullYear()} {brandName || 'AnimaSystem'} Inc. Todos os direitos reservados.
            </div>
          </div>

        </div>
      </footer>

      {/* ---------------- FLOATING DEMO / CHAT BUTTON ---------------- */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={onOpenDemoModal}
          className="w-12 h-12 rounded-full bg-black hover:bg-zinc-800 text-[#D7FE03] shadow-xl flex items-center justify-center transition-all cursor-pointer border border-zinc-700 hover:scale-105"
          aria-label="Abrir conversa ou agendar demonstração"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}
