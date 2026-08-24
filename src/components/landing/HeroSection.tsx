import { ArrowRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroSectionProps {
  onOpenDemoModal: () => void;
  onScrollToAi?: () => void;
}

export function HeroSection({ onOpenDemoModal }: HeroSectionProps) {
  const tickerItems = [
    { label: 'CRM DE VENDAS', icon: '📊' },
    { label: 'ERP GESTÃO', icon: '🏢' },
    { label: 'SITES DE ALTA CONVERSÃO', icon: '🌐' },
    { label: 'WHATSAPP SDR 24/7', icon: '💬' },
    { label: 'OMNICHANNEL UNIFICADO', icon: '⚡' },
    { label: 'VIRTUAL STAGING IA', icon: '🎨' },
    { label: 'COPYWRITING AUTOMÁTICO', icon: '✍️' },
    { label: 'BUSINESS INTELLIGENCE', icon: '📈' },
    { label: 'NÚCLEO GOOGLE CLOUD', icon: '☁️' },
  ];

  return (
    <section className="relative overflow-hidden bg-[#F8F9FA] min-h-[calc(100vh-80px)] flex flex-col justify-between pt-12 sm:pt-20 lg:pt-28 pb-8 border-b border-zinc-200/80">
      
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-16 xl:px-20 relative flex-1 flex flex-col justify-center">
        {/* Decorative Geometric Art 1 - Left Wiggle SVG (Smaller & balanced) */}
        <motion.div
          animate={{
            y: [-4, 6, -4],
            rotate: [-2, 2, -2],
          }}
          transition={{
            duration: 7.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-10 lg:left-16 xl:left-24 w-28 sm:w-36 md:w-44 lg:w-52 xl:w-60 h-28 sm:h-36 md:h-44 lg:h-52 xl:h-60 pointer-events-none opacity-85 z-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            className="w-full h-full drop-shadow-[0_12px_24px_rgba(215,254,3,0.22)]"
            fill="none"
          >
            <defs>
              <linearGradient id="heroArtGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E9FFA6" />
                <stop offset="35%" stopColor="#D7FE03" />
                <stop offset="100%" stopColor="#83AF3B" />
              </linearGradient>
            </defs>
            <path
              d="M 128 192 C 92.654 192 64 220.654 64 256 L 0 256 C 0 185.308 57.308 128 128 128 Z M 256 128 C 256 198.692 198.692 256 128 256 L 128 192 C 163.346 192 192 163.346 192 128 Z M 128 64 C 92.654 64 64 92.654 64 128 L 0 128 C 0 57.308 57.308 0 128 0 Z M 256 0 C 256 70.692 198.692 128 128 128 L 128 64 C 163.346 64 192 35.346 192 0 Z"
              fill="url(#heroArtGrad1)"
            />
          </svg>
        </motion.div>

        {/* Decorative Geometric Art 2 - Right Wiggle SVG (Smaller & balanced) */}
        <motion.div
          animate={{
            y: [5, -5, 5],
            rotate: [2, -2, 2],
          }}
          transition={{
            duration: 8.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-10 lg:right-16 xl:right-24 w-28 sm:w-36 md:w-44 lg:w-52 xl:w-60 h-28 sm:h-36 md:h-44 lg:h-52 xl:h-60 pointer-events-none opacity-85 z-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            className="w-full h-full drop-shadow-[0_12px_24px_rgba(131,175,59,0.22)]"
            fill="none"
          >
            <defs>
              <linearGradient id="heroArtGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F4FFD2" />
                <stop offset="40%" stopColor="#D7FE03" />
                <stop offset="100%" stopColor="#83AF3B" />
              </linearGradient>
            </defs>
            <path
              d="M 0 0 C 70.692 0 128 57.308 128 128 C 128 198.692 70.692 256 0 256 Z M 256 256 C 185.308 256 128 198.692 128 128 C 128 57.308 185.308 0 256 0 Z"
              fill="url(#heroArtGrad2)"
            />
          </svg>
        </motion.div>

        <div className="relative max-w-4xl mx-auto text-center z-10 py-6 sm:py-10">
          
          {/* Main Headline with Decorative Spinning Lightning Icon and Coral Circle */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative max-w-3xl sm:max-w-4xl mx-auto my-2"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] xl:text-[80px] font-['Urbanist'] font-bold text-black tracking-tight leading-[1.12] select-none">
              Soluções{" "}
              <span className="relative inline-block">
                {/* Spinning Lightning Bolt Icon Badge floating above 'tecnológicas' */}
                <motion.span
                  animate={{ rotate: 360, y: [0, -3, 0] }}
                  transition={{
                    rotate: { duration: 7, repeat: Infinity, ease: "linear" },
                    y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute -top-8 sm:-top-10 md:-top-12 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black text-[#D7FE03] rounded-xl flex items-center justify-center shadow-md pointer-events-none border border-zinc-800"
                  aria-hidden="true"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-[#D7FE03] text-[#D7FE03]" />
                </motion.span>
                <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#EC4899] bg-clip-text text-transparent font-bold">
                  tecnológicas
                </span>
              </span>
              <br />
              <span className="relative inline-block">
                para seu negócio!
                {/* Coral / Pink Circle overlapping the end */}
                <motion.span
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-3 sm:-right-5 md:-right-6 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-[#fb2c58] rounded-full -z-10 block pointer-events-none"
                  aria-hidden="true"
                >
                  <span className="sr-only">Decorativo</span>
                </motion.span>
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-base sm:text-lg md:text-xl text-zinc-600 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed"
          >
            A plataforma une <strong className="text-black font-bold">CRM, ERP, sites, dados e ecossistema integrado</strong> para transformar a gestão de empresas que querem liderar – não apenas competir.
          </motion.p>

          {/* Hero CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex items-center justify-center"
          >
            <button
              onClick={onOpenDemoModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-10 py-4.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider text-black bg-[#D7FE03] hover:bg-[#c4e602] shadow-md hover:shadow-xl transition-all cursor-pointer group"
            >
              <span>Agendar demonstração</span>
              <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

        </div>
      </div>

      {/* Marquee Partner / Ecosystem Ticker */}
      <div className="mt-10 pt-6 border-t border-zinc-200/80 overflow-hidden relative">
        <div className="flex items-center gap-8 animate-[marquee_28s_linear_infinite] whitespace-nowrap">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 uppercase hover:text-zinc-700 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              <span className="text-zinc-300 ml-4">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
