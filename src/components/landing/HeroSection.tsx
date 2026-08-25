import { useState, useEffect } from 'react';
import { ArrowRight, Zap, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroSectionProps {
  onOpenDemoModal: () => void;
  onScrollToAi?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export function HeroSection({ 
  onOpenDemoModal,
  isDarkMode = false,
  onToggleTheme
}: HeroSectionProps) {
  // Live ticking uptime timer (format HH:MM:SS)
  const [uptime, setUptime] = useState('11:08:12');

  useEffect(() => {
    const startTime = Date.now() - (11 * 3600 + 8 * 60 + 12) * 1000;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const hours = String(Math.floor((diff / 3600) % 24)).padStart(2, '0');
      const minutes = String(Math.floor((diff / 60) % 60)).padStart(2, '0');
      const seconds = String(diff % 60).padStart(2, '0');
      setUptime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
    <section className={`relative overflow-hidden min-h-screen flex flex-col justify-between pt-20 sm:pt-22 pb-8 border-b transition-colors duration-500 ${
      isDarkMode 
        ? 'bg-[#070709] text-white border-zinc-800/80' 
        : 'bg-[#F8F9FA] text-zinc-900 border-zinc-200/80'
    }`}>
      
      {/* ================= DARK MODE AMBIENT AURORA GRADIENTS (GREEN / BLUE / PURPLE) & GRID ================= */}
      {isDarkMode && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Subtle Grid Dot Matrix */}
          <div 
            className="absolute inset-0 opacity-40" 
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
              backgroundSize: '28px 28px'
            }}
          />

          {/* 1. Deep Purple / Violet Glow (Upper Left & Center) */}
          <div className="absolute -top-24 -left-20 w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] bg-gradient-to-tr from-purple-900/40 via-purple-600/30 to-indigo-600/20 rounded-full blur-[140px] opacity-75" />
          
          {/* 2. Emerald Green / Mint / Lime Glow (Center & Mid-Section) */}
          <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[500px] sm:w-[650px] h-[400px] sm:h-[500px] bg-gradient-to-br from-emerald-500/25 via-teal-500/20 to-[#D7FE03]/15 rounded-full blur-[150px] opacity-70" />

          {/* 3. Electric Blue / Cyan Aurora Glow (Top Right & Right-Wing) */}
          <div className="absolute -top-20 -right-20 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-gradient-to-bl from-blue-600/35 via-cyan-500/25 to-purple-700/20 rounded-full blur-[160px] opacity-80" />

          {/* 4. Deep Violet / Indigo Base Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[250px] bg-gradient-to-t from-indigo-950/40 via-purple-950/20 to-transparent blur-[120px]" />
        </div>
      )}

      {/* ================= HUD TELEMETRY & THEME SWITCHER ================= */}
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 pt-1 sm:pt-2 mb-0 flex justify-end relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`w-full sm:w-auto min-w-[270px] font-mono text-[11px] sm:text-xs transition-all ${
            isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
          }`}
        >
          <div className="space-y-1.5 py-0.5">
            {/* 1. THEME ROW */}
            <div className="flex items-center justify-between gap-6">
              <span className={`uppercase tracking-wider font-semibold text-[10px] sm:text-[11px] ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-400'
              }`}>
                THEME
              </span>

              <button
                onClick={onToggleTheme}
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none group ${
                  isDarkMode 
                    ? 'bg-zinc-900/90 border-zinc-700/80 text-white hover:border-[#D7FE03] shadow-xs' 
                    : 'bg-zinc-100/90 border-zinc-200 text-zinc-800 hover:border-zinc-300'
                }`}
                title="Alternar tema claro / escuro"
              >
                <div className={`w-3.5 h-3.5 flex items-center justify-center transition-transform duration-300 ${
                  isDarkMode ? 'text-[#D7FE03]' : 'text-amber-500'
                }`}>
                  {isDarkMode ? <Moon className="w-3 h-3 fill-current" /> : <Sun className="w-3.5 h-3.5 fill-current" />}
                </div>
                <span className="font-bold text-[10px] uppercase tracking-wider">
                  {isDarkMode ? 'DARK' : 'LIGHT'}
                </span>
                <div className={`w-7 h-3.5 rounded-full relative transition-colors p-0.5 ${
                  isDarkMode ? 'bg-[#D7FE03]' : 'bg-zinc-300'
                }`}>
                  <div className={`w-2.5 h-2.5 rounded-full bg-black transition-transform duration-200 ${
                    isDarkMode ? 'translate-x-3.5' : 'translate-x-0'
                  }`} />
                </div>
              </button>
            </div>

            {/* 2. SESSION ROW */}
            <div className="flex items-center justify-between gap-6">
              <span className={`uppercase tracking-wider font-semibold text-[10px] sm:text-[11px] ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-400'
              }`}>
                SESSION
              </span>
              <span className={`font-mono text-[11px] font-medium ${
                isDarkMode ? 'text-zinc-200' : 'text-zinc-700'
              }`}>
                Sistema de Negócios / Anima
              </span>
            </div>

            {/* 3. UPTIME ROW */}
            <div className="flex items-center justify-between gap-6">
              <span className={`uppercase tracking-wider font-semibold text-[10px] sm:text-[11px] ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-400'
              }`}>
                UPTIME
              </span>
              <span className="font-mono text-[11px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                {uptime}
              </span>
            </div>

            {/* 4. STATUS ROW */}
            <div className="flex items-center justify-between gap-6">
              <span className={`uppercase tracking-wider font-semibold text-[10px] sm:text-[11px] ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-400'
              }`}>
                STATUS
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>operacional</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-16 xl:px-20 relative flex-1 flex flex-col justify-center">
        
        {/* Decorative Geometric Art 1 - Left Double Purple Crescent / Arrow Shapes */}
        <motion.div
          animate={{
            y: [-5, 6, -5],
            rotate: [-1, 2, -1],
          }}
          transition={{
            duration: 7.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-6 lg:left-12 xl:left-16 w-24 sm:w-32 md:w-40 lg:w-48 xl:w-56 h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56 pointer-events-none z-0"
        >
          {isDarkMode ? (
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_10px_30px_rgba(168,85,247,0.35)]" fill="none">
              <path d="M40 20 C90 20 130 60 130 110 C130 160 90 200 40 200 L40 160 C70 160 90 140 90 110 C90 80 70 60 40 60 Z" fill="#9333EA" />
              <path d="M0 20 C50 20 90 60 90 110 C90 160 50 200 0 200 L0 160 C30 160 50 140 50 110 C50 80 30 60 0 60 Z" fill="#A855F7" />
            </svg>
          ) : (
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
          )}
        </motion.div>

        {/* Decorative Geometric Art 2 - Right Custom SVG (Blue in dark mode & optimized scale) */}
        <motion.div
          animate={{
            y: [6, -6, 6],
            rotate: [2, -2, 2],
          }}
          transition={{
            duration: 8.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[44%] -translate-y-1/2 right-2 sm:right-6 lg:right-10 xl:right-16 w-28 sm:w-36 md:w-44 lg:w-52 xl:w-60 h-28 sm:h-36 md:h-44 lg:h-52 xl:h-60 pointer-events-none z-20 opacity-90 sm:opacity-95"
        >
          {isDarkMode ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              className="w-full h-full drop-shadow-[0_12px_36px_rgba(59,130,246,0.45)] filter"
              fill="none"
            >
              <path
                d="M 112 32 L 54.627 32 L 128 105.373 L 201.373 32 L 144 32 L 144 0 L 256 0 L 256 112 L 224 112 L 224 54.627 L 150.627 128 L 224 201.373 L 224 144 L 256 144 L 256 256 L 144 256 L 144 224 L 201.373 224 L 128 150.627 L 54.627 224 L 112 224 L 112 256 L 0 256 L 0 144 L 32 144 L 32 201.373 L 105.373 128 L 32 54.627 L 32 112 L 0 112 L 0 0 L 112 0 Z"
                fill="#3B82F6"
              />
            </svg>
          ) : (
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
          )}
        </motion.div>

        {/* Floating Teal/Mint Cube (As in screenshot) */}
        {isDarkMode && (
          <motion.div
            animate={{
              y: [-4, 6, -4],
              rotate: [12, 18, 12],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-12 sm:top-16 left-1/2 translate-x-16 sm:translate-x-32 md:translate-x-44 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-[0_10px_25px_rgba(16,185,129,0.4)] pointer-events-none z-0"
          />
        )}

        <div className="relative max-w-4xl mx-auto text-center z-10 py-4 sm:py-8">
          
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative max-w-3xl sm:max-w-4xl mx-auto my-2"
          >
            <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-[72px] xl:text-[80px] font-['Urbanist'] font-bold tracking-tight leading-[1.1] select-none transition-colors ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              <span className="relative inline-block">
                Soluções
                {/* Floating Spinning Lightning Bolt Badge (Larger and positioned over / near Soluções) */}
                <motion.span
                  animate={{ rotate: 360, y: [0, -4, 0] }}
                  transition={{
                    rotate: { duration: 7, repeat: Infinity, ease: "linear" },
                    y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className={`absolute -top-7 sm:-top-9 md:-top-11 right-0 sm:right-2 w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-2xl flex items-center justify-center pointer-events-none border transition-all ${
                    isDarkMode 
                      ? 'bg-zinc-950 text-[#D7FE03] border-zinc-800 shadow-lg shadow-black/80' 
                      : 'bg-black text-[#D7FE03] border-zinc-800 shadow-xl'
                  }`}
                  aria-hidden="true"
                >
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 fill-[#D7FE03] text-[#D7FE03]" />
                </motion.span>
              </span>{" "}
              <span className="relative inline-block">
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
            className={`mt-8 text-base sm:text-lg md:text-xl max-w-2xl sm:max-w-3xl mx-auto leading-relaxed transition-colors ${
              isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
            }`}
          >
            A plataforma une <strong className={isDarkMode ? 'text-white font-bold' : 'text-black font-bold'}>CRM, ERP, sites, dados e ecossistema integrado</strong> para transformar a gestão de empresas que querem liderar – não apenas competir.
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
      <div className={`mt-8 pt-6 border-t overflow-hidden relative transition-colors ${
        isDarkMode ? 'border-zinc-800/80 bg-zinc-950/40' : 'border-zinc-200/80'
      }`}>
        <div className="flex items-center gap-8 animate-[marquee_28s_linear_infinite] whitespace-nowrap">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
            <div
              key={idx}
              className={`inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors ${
                isDarkMode 
                  ? 'text-zinc-500 hover:text-zinc-300' 
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              <span className={isDarkMode ? 'text-zinc-700 ml-4' : 'text-zinc-300 ml-4'}>•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

