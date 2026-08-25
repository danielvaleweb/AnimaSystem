import { motion } from 'motion/react';

interface DecisionClaritySectionProps {
  onOpenDemoModal?: () => void;
  isDarkMode?: boolean;
}

export function DecisionClaritySection({ 
  onOpenDemoModal,
  isDarkMode = false
}: DecisionClaritySectionProps) {
  const handleScrollToAbout = () => {
    const el = document.getElementById('sobre-nos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onOpenDemoModal) {
      onOpenDemoModal();
    }
  };

  return (
    <section id="sobre" className={`py-20 sm:py-28 border-b overflow-hidden transition-colors duration-500 ${
      isDarkMode 
        ? 'bg-[#0f1013] text-white border-zinc-800/80' 
        : 'bg-white text-zinc-950 border-zinc-200/80'
    }`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Typography & Action */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-8"
          >
            {/* Tag / Eyebrow */}
            <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#D7FE03]' : 'bg-zinc-400'}`} />
              <span>SOBRE NÓS</span>
            </div>

            {/* Headline */}
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-['Urbanist'] font-bold tracking-tight leading-[1.12] transition-colors ${
              isDarkMode ? 'text-white' : 'text-zinc-950'
            }`}>
              Nós ajudamos empresas a tomar decisões melhores e crescer com clareza.
            </h2>

            {/* Subtext Paragraph */}
            <p className={`text-base sm:text-lg leading-relaxed max-w-xl transition-colors ${
              isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
            }`}>
              Trazemos estratégias com propósito, insights acionáveis e processos modernos para ajudar você a validar, lançar e escalar seus produtos com absoluta confiança no mercado digital.
            </p>

            {/* CTA Button */}
            <div className="pt-2">
              <button
                onClick={handleScrollToAbout}
                className={`inline-flex items-center justify-center px-8 py-3.5 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                  isDarkMode 
                    ? 'bg-[#D7FE03] hover:bg-[#c4e602] text-black' 
                    : 'bg-zinc-950 hover:bg-black text-white'
                }`}
              >
                <span>SABER MAIS</span>
              </button>
            </div>
          </motion.div>

          {/* Right Column: Image with rounded corners and clean shadow */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-md lg:max-w-none">
              <div className={`overflow-hidden rounded-[32px] sm:rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] border transition-colors ${
                isDarkMode 
                  ? 'bg-zinc-900 border-zinc-800' 
                  : 'bg-zinc-100 border-zinc-200/70'
              }`}>
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                  alt="Equipe colaborando e desenvolvendo soluções de tecnologia com clareza"
                  className="w-full h-auto aspect-4/3 sm:aspect-square lg:aspect-4/3 object-cover object-center transform hover:scale-102 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
