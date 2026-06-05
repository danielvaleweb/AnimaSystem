import { 
  ArrowRight, Server, CloudLightning, ShieldCheck, Database, LayoutDashboard,
  Activity, Users, DollarSign, MessageSquare, ListTree, AlertTriangle, CheckCircle2,
  Lock, BarChart, ChevronDown, Check, Menu, X, ArrowUpRight, Hash, AtSign, Plus, Star,
  Umbrella, Aperture, Leaf, Network, Wind, Zap, Hexagon
} from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { cn } from '../../utils';
import { LightningLogo } from '../LightningLogo';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [hoveredNetworkNode, setHoveredNetworkNode] = useState<{
    id: number;
    name: string;
    desc: string;
    status: string;
    cpu: string;
    latency: string;
    x: number;
    y: number;
  } | null>(null);

  const networkNodes = [
    { id: 1, name: 'Marcenaria Sheiffer', desc: 'Monitoramento NOC Ativo', status: 'Online', cpu: '1.4%', latency: '4ms', x: 300, y: 60 },
    { id: 2, name: 'E-commerce Premium', desc: 'Prevenção de Gargalos de Venda', status: 'Seguro', cpu: '3.1%', latency: '8ms', x: 470, y: 130 },
    { id: 3, name: 'Portal Institucional', desc: 'Redundância Dinâmica Web', status: 'Excelente', cpu: '0.9%', latency: '3ms', x: 540, y: 300 },
    { id: 4, name: 'CRM Central Integrado', desc: 'Banco de Dados Replicado', status: 'Protegido', cpu: '4.8%', latency: '11ms', x: 470, y: 470 },
    { id: 5, name: 'Checkout Expresso', desc: 'Cluster Isolado e Seguro', status: 'Online', cpu: '2.2%', latency: '5ms', x: 300, y: 540 },
    { id: 6, name: 'Módulo de Pagamentos', desc: 'Gateway Criptografado GCP', status: 'Impenetrável', cpu: '0.7%', latency: '6ms', x: 130, y: 470 },
    { id: 7, name: 'Agência Digital Sol', desc: 'Auto-Scaling de Cache Ativo', status: 'Excelente', cpu: '1.1%', latency: '2ms', x: 60, y: 300 },
    { id: 8, name: 'Gestor de Relatórios', desc: 'SLA de Disponibilidade 99.9%', status: 'Online', cpu: '3.9%', latency: '10ms', x: 130, y: 130 },
  ];

  const getCurvePath = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx = mx - dy * 0.12;
    const cy = my + dx * 0.12;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleSubmitConsultoria = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const uid = auth.currentUser?.uid || 'anonymous';
      await addDoc(collection(db, 'leads'), {
        ownerId: uid, 
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: '-', 
        message: formData.message,
        status: 'new',
        createdAt: new Date().toISOString()
      });
      setFormSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const [heroImage, setHeroImage] = useState("");

  useEffect(() => {
    const docRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().heroImage) {
        setHeroImage(docSnap.data().heroImage);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1007] text-[#f4fbf0] font-sans selection:bg-[#97fb2e]/30 overflow-x-hidden">
      
      {/* Background Base */}
      <div className="fixed inset-0 bg-[#0a1007] pointer-events-none z-0" />

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 w-full z-50 pt-6 px-6 lg:px-12"
      >
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <LightningLogo className="w-8 h-8" />
            </div>
             <span className="text-xl tracking-tight hidden sm:block" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
               <span className="font-light text-white">Anima</span><span className="font-bold text-white">System</span>
             </span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-[11px] uppercase tracking-widest font-semibold text-white/85 absolute left-1/2 -translate-x-1/2">
            <a href="#home" className="hover:text-[#97fb2e] transition-colors">Home</a>
            <a href="#servicos" className="hover:text-[#97fb2e] transition-colors">Serviços</a>
            <a href="#planos" className="hover:text-[#97fb2e] transition-colors">Planos</a>
            <a href="#sobre" className="hover:text-[#97fb2e] transition-colors">Sobre Nós</a>
          </div>

          <div className="flex items-center gap-4">
             <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => setIsModalOpen(true)}
               className="hidden md:block bg-[#97fb2e] hover:bg-[#86e029] text-black px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(151,251,46,0.3)] cursor-pointer"
             >
               Agendar Consultoria
             </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 top-24 bg-[#0a1007] z-40 p-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-lg font-medium text-white text-center">
              <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
              <a href="#servicos" onClick={() => setMobileMenuOpen(false)}>Serviços</a>
              <a href="#planos" onClick={() => setMobileMenuOpen(false)}>Planos</a>
              <a href="#sobre" onClick={() => setMobileMenuOpen(false)}>Sobre Nós</a>
              <button onClick={() => { setMobileMenuOpen(false); setIsModalOpen(true); }} className="mt-4 bg-[#97fb2e] text-[#0a1007] py-3 rounded-full font-bold uppercase text-sm shadow-[0_0_40px_rgba(151,251,46,0.3)]">
                  Agendar Consultoria
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <main id="home" className="relative z-10 pt-[230px] pb-32 px-6 overflow-hidden min-h-screen flex flex-col justify-center border-b border-zinc-900/30">
        
        {/* Abstract Image Background Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {heroImage && (
              <img 
                src={heroImage} 
                alt="Hero Background" 
                className="absolute inset-0 w-full h-full object-cover object-center opacity-60 mix-blend-luminosity"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a1007]/80 to-[#0a1007]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#97fb2e]/5 rounded-full blur-[150px]"></div>
        </div>

        <div className="max-w-4xl mx-auto w-full relative z-10">
          
          {/* Floating Tags Container */}
          <div className="relative w-full h-0">
             
             {/* Tag 1 */}
             <motion.div 
               initial={{ scale: 0.7, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.4 }}
               className="absolute -top-32 left-0 sm:left-10 p-2 pr-5 rounded-[2rem] bg-white/5 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/30 shadow-[inset_0_4px_20px_rgba(255,255,255,0.4),inset_0_-4px_20px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-[bounce_4s_infinite]"
             >
                <div className="w-6 h-6 rounded-full bg-[#5fc2fe] flex items-center justify-center shrink-0">
                  <Hash strokeWidth={2.5} className="w-[14px] h-[14px] text-zinc-950" />
                </div>
                <span className="text-white/90 text-[13px] font-medium tracking-wide">Design Moderno</span>
             </motion.div>

             {/* Tag 2 */}
             <motion.div 
               initial={{ scale: 0.7, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.5 }}
               className="absolute -top-10 right-0 sm:right-20 p-2 pr-5 rounded-[2rem] bg-white/5 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/30 shadow-[inset_0_4px_20px_rgba(255,255,255,0.4),inset_0_-4px_20px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-[bounce_5s_infinite]"
             >
                <div className="w-6 h-6 rounded-full bg-[#97fb2e] flex items-center justify-center shrink-0">
                  <AtSign strokeWidth={2.5} className="w-[14px] h-[14px] text-zinc-950" />
                </div>
                <span className="text-white/90 text-[13px] font-medium tracking-wide">Estratégia Real</span>
             </motion.div>

             {/* Tag 3 */}
             <motion.div 
               initial={{ scale: 0.7, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.6 }}
               className="absolute top-20 -left-4 sm:-left-20 p-2 pr-5 rounded-[2rem] bg-white/5 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/30 shadow-[inset_0_4px_20px_rgba(255,255,255,0.4),inset_0_-4px_20px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-[bounce_3s_infinite]"
             >
                <div className="w-6 h-6 rounded-full bg-[#e8fa56] flex items-center justify-center shrink-0">
                  <Plus strokeWidth={3} className="w-[14px] h-[14px] text-zinc-950 relative top-[0.5px]" />
                </div>
                <span className="text-white/90 text-[13px] font-medium tracking-wide">Crescimento Rápido</span>
             </motion.div>

             {/* Tag 4 */}
             <motion.div 
               initial={{ scale: 0.7, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.7 }}
               className="absolute top-10 -right-4 sm:-right-10 p-2 pr-5 rounded-[2rem] bg-white/5 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/30 shadow-[inset_0_4px_20px_rgba(255,255,255,0.4),inset_0_-4px_20px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-[bounce_4.5s_infinite]"
             >
                <div className="w-6 h-6 rounded-full bg-[#fe7f8d] flex items-center justify-center shrink-0">
                  <DollarSign strokeWidth={2.5} className="w-[14px] h-[14px] text-zinc-950" />
                </div>
                <span className="text-white/90 text-[13px] font-medium tracking-wide">Profissional</span>
             </motion.div>

             {/* Tag 5 */}
             <motion.div 
               initial={{ scale: 0.7, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.8 }}
               className="absolute top-44 right-10 p-2 pr-5 rounded-[2rem] bg-white/5 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/30 shadow-[inset_0_4px_20px_rgba(255,255,255,0.4),inset_0_-4px_20px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-[bounce_3.5s_infinite] hidden sm:flex"
             >
                <div className="w-6 h-6 rounded-full bg-[#c084fe] flex items-center justify-center shrink-0">
                  <Star fill="currentColor" strokeWidth={0} className="w-[14px] h-[14px] text-zinc-950" />
                </div>
                <span className="text-white/90 text-[13px] font-medium tracking-wide">Inovação Digital</span>
             </motion.div>

          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-center space-y-8 mt-10"
          >
            <h1 className="font-sans font-medium text-5xl md:text-6xl lg:text-[72px] tracking-tight leading-[1.05] text-white">
              Criação inteligente. <br/> Estratégia real. <br/> Na palma da sua mão.
            </h1>

            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-light">
              Ajudamos empresas e marcas a estruturar completamente a sua presença online. Da validação da ideia até sistemas escaláveis e apps interativos.
            </p>

            <div className="pt-8 flex items-center justify-center">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px -10px rgba(151,251,46,0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/portfolio')} 
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-3xl backdrop-saturate-[3] backdrop-brightness-110 border border-white/20 text-white font-medium px-8 py-4 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.3)] text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer"
              >
                Ver Portfólio
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Brand Marquee */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-10 left-0 w-full overflow-hidden flex whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        >
           <div className="flex w-max animate-marquee items-center">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 pr-4 shrink-0">
                  <div className="flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold tracking-tight text-[17px] shadow-lg shadow-black/20"><Wind className="w-6 h-6 text-zinc-900" /> Flash</div>
                  <div className="flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold tracking-tight text-[17px] shadow-lg shadow-black/20"><Leaf className="w-6 h-6 text-purple-600" /> Cactus</div>
                  <div className="flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold tracking-tight text-[17px] shadow-lg shadow-black/20"><Aperture className="w-6 h-6 text-orange-500" /> vision</div>
                  <div className="flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold tracking-tight text-[17px] shadow-lg shadow-black/20"><Hexagon className="w-6 h-6 text-emerald-600" /> Greenish</div>
                  <div className="flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold tracking-tight text-[17px] shadow-lg shadow-black/20"><Umbrella className="w-6 h-6 text-red-500" /> umbrella</div>
                  <div className="flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold tracking-tight text-[17px] shadow-lg shadow-black/20"><Network className="w-6 h-6 text-blue-600" /> Network</div>
                  <div className="flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold tracking-tight text-[17px] shadow-lg shadow-black/20"><Activity className="w-6 h-6 text-fuchsia-600" /> Pulse</div>
                </div>
              ))}
           </div>
        </motion.div>

      </main>

      {/* Services Cards Section */}
      <section id="servicos" className="bg-white relative z-10 py-32 pb-12 overflow-hidden border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
             className="mb-12"
           >
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-[#97fb2e] rounded-full"></div> NOSSOS SERVIÇOS
              </span>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Card 1 */}
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
               className="bg-[#f0f2ec] rounded-[32px] p-8 flex flex-col justify-between group relative h-[500px] overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#97fb2e]/10 transition-all duration-500 border border-transparent hover:border-zinc-300"
             >
               <div className="flex justify-between items-start z-10">
                 <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest border border-zinc-300/50 px-4 py-1.5 rounded-full bg-white">Dev & Apps</span>
                 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-zinc-100">
                    <ArrowUpRight className="w-5 h-5 text-zinc-900 group-hover:rotate-45 transition-transform" />
                 </div>
               </div>
               
               <div className="z-10 mt-12 mb-auto">
                 <h3 className="text-[26px] font-medium text-zinc-900 leading-[1.1] pr-4 max-w-[280px]">
                    Desenvolvimento de Plataformas Web e Mobile
                 </h3>
               </div>

               <div className="absolute bottom-0 inset-x-0 h-[45%] p-3">
                  <div className="w-full h-full rounded-[24px] overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" alt="Dev" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
               </div>
             </motion.div>

             {/* Card 2 */}
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
               className="bg-[#97fb2e] rounded-[32px] p-8 flex flex-col justify-between group relative h-[500px] overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#97fb2e]/20 transition-all duration-500"
             >
               <div className="absolute top-0 inset-x-0 h-[55%] p-4">
                 <div className="w-full h-full rounded-[40px] rounded-tr-[80px] rounded-bl-[80px] overflow-hidden relative border-4 border-[#97fb2e]/20">
                   <img src="https://images.unsplash.com/photo-1556761175-5973e4499b70?w=800&q=80" alt="Estratégia" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[30%] group-hover:grayscale-0" />
                 </div>
               </div>

               <div className="flex justify-between items-end z-10 mt-auto relative">
                  <div>
                    <span className="text-[#0a1007]/60 border border-[#0a1007]/20 text-[10px] uppercase font-bold tracking-widest px-4 py-1.5 rounded-full mb-6 inline-block bg-[#97fb2e]">Consultoria</span>
                    <h3 className="text-[26px] font-medium text-[#0a1007] leading-[1.1] pr-4 max-w-[240px]">
                      Estratégia Real e Crescimento Sustentável
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-transparent group-hover:border-[#0a1007]/10 transition-all">
                    <ArrowUpRight className="w-5 h-5 text-zinc-900 group-hover:rotate-45 transition-transform" />
                  </div>
               </div>
             </motion.div>

             {/* Card 3 */}
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
               className="bg-[#f0f2ec] rounded-[32px] p-8 flex flex-col justify-between group relative h-[500px] overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#97fb2e]/10 transition-all duration-500 border border-transparent hover:border-zinc-300"
             >
               <div className="flex justify-between items-start z-10">
                 <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest border border-zinc-300/50 px-4 py-1.5 rounded-full bg-white">UX & UI</span>
                 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-zinc-100">
                    <ArrowUpRight className="w-5 h-5 text-zinc-900 group-hover:rotate-45 transition-transform" />
                 </div>
               </div>
               
               <div className="z-10 mt-12 mb-auto">
                 <h3 className="text-[26px] font-medium text-zinc-900 leading-[1.1] pr-4 max-w-[280px]">
                    Design Moderno e Focado na Conversão
                 </h3>
               </div>

               <div className="absolute bottom-0 inset-x-0 h-[45%] p-3">
                  <div className="w-full h-full rounded-[24px] overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                    <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80" alt="Design" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
               </div>
             </motion.div>
           </div>
        </div>
      </section>

      {/* Partnerships / Core Network Section */}
      <section className="bg-[#070b05] relative z-10 py-24 pb-32 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              
              {/* Left Column: Text and Specs */}
              <div className="lg:col-span-5 space-y-8">
                 <motion.div
                   initial={{ opacity: 0, x: -24 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true, margin: "-100px" }}
                   transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                 >
                    <span className="text-[#97fb2e] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-[#97fb2e] animate-pulse"></span> NÚCLEO GOOGLE CLOUD
                    </span>
                 </motion.div>

                 <div className="space-y-6">
                    <motion.h2 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      className="font-sans text-3xl md:text-4xl lg:text-[46px] leading-[1.15] font-semibold text-zinc-100"
                    >
                      Estrutura blindada e redundante via <span className="text-[#97fb2e]">Google Cloud</span>.
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                      className="text-zinc-400 text-base md:text-lg leading-relaxed font-light"
                    >
                      Cada cliente corporativo opera conectado ao <strong className="text-zinc-200 font-semibold text-[#97fb2e]">Anima System</strong>, nosso núcleo central de orquestração. Hospedado em múltiplos clusters seguros do Google Cloud, eliminamos completamente riscos de quedas de site, oscilações no checkout e lentidões inesperadas.
                    </motion.p>
                 </div>

                 {/* Infrastructure Pillars */}
                 <div className="space-y-4 pt-4 border-t border-zinc-800/60">
                    <motion.div 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-[#97fb2e] mt-1 shrink-0 font-bold">1</div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">Segurança de Nível Bancário</h4>
                        <p className="text-xs text-zinc-500 mt-0.5 font-light">Proteção ativa contra ataques DDoS, criptografia de tráfego SSL/TLS e isolamento absoluto de dados.</p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-[#97fb2e] mt-1 shrink-0 font-bold">2</div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">Auto-Scaling Inteligente (Sem Travamentos)</h4>
                        <p className="text-xs text-zinc-500 mt-0.5 font-light">Sua infraestrutura se expande automaticamente em milissegundos para aguentar picos de tráfego ou campanhas virais.</p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-[#97fb2e] mt-1 shrink-0 font-bold">3</div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">Redundância Crítica Multi-Região</h4>
                        <p className="text-xs text-zinc-500 mt-0.5 font-light">Se algum hardware global apresentar instabilidade, outro assume instantaneamente sem que ninguém perceba.</p>
                      </div>
                    </motion.div>
                 </div>
              </div>

              {/* Right Column: Visual Core Network */}
              <div className="lg:col-span-7 flex flex-col items-center space-y-6">
                 <motion.div 
                   className="w-full max-w-[580px] sm:max-w-[620px] aspect-square bg-[#0b1007]/90 border border-zinc-800/80 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden flex items-center justify-center shadow-3xl shadow-black/80"
                   initial={{ opacity: 0, scale: 0.95 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   viewport={{ once: true, margin: "-100px" }}
                   transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                 >
                    {/* Living Tech Grid Background - Styled in green instead of purple */}
                    <div className="absolute inset-0 bg-[radial-gradient(rgba(151,251,46,0.04)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                    
                    {/* SVG Interactive Network with scaled center 300, 300 */}
                    <svg viewBox="0 0 600 600" className="w-full h-full relative z-10 select-none">
                      <defs>
                        {/* Glow Filters strictly configured in green / white */}
                        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <filter id="glow-strong-green" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="9" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <filter id="glow-light-green" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Connection Wires from (300, 300) center */}
                      {networkNodes.map((node) => {
                        const pathD = getCurvePath(300, 300, node.x, node.y);
                        const isHovered = hoveredNetworkNode?.id === node.id;
                        return (
                          <g key={`wire-group-${node.id}`}>
                            {/* Base Wire - transitions from green to white on hover */}
                            <path 
                              d={pathD}
                              fill="none"
                              stroke={isHovered ? "#ffffff" : "rgba(151, 251, 46, 0.12)"}
                              strokeWidth={isHovered ? 2.5 : 1.2}
                              className="transition-all duration-300"
                            />
                            
                            {/* Animated Pulse traveling from center outward */}
                            <circle r={isHovered ? 5.5 : 3.5} fill={isHovered ? "#ffffff" : "#97fb2e"} filter="url(#glow-light-green)">
                              <animateMotion 
                                dur={isHovered ? "1.2s" : "2.4s"} 
                                repeatCount="indefinite" 
                                path={pathD} 
                                begin={`${node.id * 0.25}s`} 
                              />
                            </circle>
                          </g>
                        );
                      })}

                      {/* Core Center (Anima System Nucleus) - translated exactly to (255, 255) for 300, 300 perfect center alignment of 90x90 rect */}
                      <g transform="translate(255, 255)">
                        {/* Back Glow - glowing neon green */}
                        <circle 
                          cx="45" 
                          cy="45" 
                          r="60" 
                          fill="rgba(151, 251, 46, 0.08)" 
                          filter="url(#glow-strong-green)" 
                          className="animate-pulse"
                        />
                        
                        {/* Core rounded box */}
                        <rect 
                          x="0" 
                          y="0" 
                          width="90" 
                          height="90" 
                          rx="28" 
                          fill="#090d06" 
                          stroke={hoveredNetworkNode ? "#ffffff" : "#97fb2e"} 
                          strokeWidth="2" 
                          className="transition-all duration-500"
                          style={{ filter: 'drop-shadow(0px 0px 18px rgba(151, 251, 46, 0.45))' }}
                        />
                        
                        {/* Stacked cards representing Anima System dynamic framework */}
                        <g transform="translate(29, 26)" stroke={hoveredNetworkNode ? "#ffffff" : "#97fb2e"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="transition-all duration-300">
                          <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="rgba(151, 251, 46, 0.08)" />
                          <path d="M2 14L16 21L30 14" />
                          <path d="M2 19L16 26L30 19" />
                        </g>

                        {/* Text under Anima logo */}
                        <text 
                          x="45" 
                          y="78" 
                          textAnchor="middle" 
                          fill="rgba(255, 255, 255, 0.5)" 
                          fontSize="7" 
                          fontFamily="monospace"
                          fontWeight="bold"
                          letterSpacing="1"
                        >
                          {hoveredNetworkNode ? 'LINK ATIVO' : 'ANIMA CORE'}
                        </text>
                      </g>

                      {/* Client Nodes (Outer Rounded Square Nodes) */}
                      {networkNodes.map((node) => {
                        const isHovered = hoveredNetworkNode?.id === node.id;
                        return (
                          <g 
                            key={`node-${node.id}`}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredNetworkNode(node)}
                            onMouseLeave={() => setHoveredNetworkNode(null)}
                          >
                            {/* Outer glowing focus indicator ring */}
                            {isHovered && (
                              <circle 
                                cx={node.x} 
                                cy={node.y} 
                                r="28" 
                                fill="rgba(151, 251, 46, 0.08)"
                                filter="url(#glow-green)"
                              />
                            )}
                            
                            {/* Mini Client Rect */}
                            <rect 
                              x={node.x - 18} 
                              y={node.y - 18} 
                              width="36" 
                              height="36" 
                              rx="10" 
                              fill="#050804" 
                              stroke={isHovered ? "#ffffff" : "rgba(151, 251, 46, 0.4)"}
                              strokeWidth={isHovered ? 2 : 1.2}
                              className="transition-all duration-300"
                              style={isHovered ? { filter: 'drop-shadow(0px 0px 10px rgba(151, 251, 46, 0.5))' } : undefined}
                            />
                            
                            {/* Inner core dot */}
                            <circle 
                              cx={node.x} 
                              cy={node.y} 
                              r="4.5" 
                              fill={isHovered ? "#ffffff" : "#97fb2e"} 
                              className="transition-colors duration-300"
                              style={{ filter: isHovered ? 'drop-shadow(0px 0px 5px #ffffff)' : 'drop-shadow(0px 0px 4px #97fb2e)' }}
                            />
                          </g>
                        );
                      })}
                    </svg>
                 </motion.div>

                 {/* HUD Status Overlay — Positioned BELOW the card to prevent overlap with bottom nodes */}
                 <div className="w-full max-w-[580px] sm:max-w-[620px] bg-[#090d07]/90 border border-zinc-850 rounded-2xl p-4.5 sm:p-5 backdrop-blur-md flex flex-col space-y-2 z-20 shadow-xl">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Status da Nuvem</span>
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> ONLINE
                       </span>
                    </div>
                    
                    <div className="transition-all duration-350 min-h-[46px] flex flex-col justify-center">
                       {hoveredNetworkNode ? (
                          <div className="space-y-1">
                             <div className="text-sm font-semibold text-zinc-100 flex items-center justify-between">
                               <span className="text-zinc-200">{hoveredNetworkNode.name}</span>
                               <span className="text-xs text-[#97fb2e] font-mono font-bold">{hoveredNetworkNode.status}</span>
                             </div>
                             <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                               <span>{hoveredNetworkNode.desc}</span>
                               <span className="text-zinc-400">Latência: {hoveredNetworkNode.latency} • CPU: {hoveredNetworkNode.cpu}</span>
                             </div>
                          </div>
                       ) : (
                          <div className="space-y-1">
                             <div className="text-xs text-zinc-350 font-medium">
                               Monitorando <span className="text-[#97fb2e] font-semibold font-mono">8 Servidores Clientes</span> simultaneamente
                             </div>
                             <div className="text-[11px] text-zinc-500 font-mono">
                               Passe o mouse sobre os blocos para inspecionar os contêineres Google Cloud.
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* About Us section */}
      <section id="sobre" className="py-24 bg-[#f2f2f2] text-zinc-950 relative border-t border-zinc-800 z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-6">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div> SOBRE NÓS
              </span>
            </div>
            <h2 className="font-sans text-4xl md:text-5xl lg:text-[56px] font-medium leading-[1.1] text-zinc-900 mb-8 max-w-2xl">
              Nós ajudamos empresas a tomar decisões melhores e crescer com clareza.
            </h2>
            <p className="text-zinc-600 text-lg leading-relaxed max-w-xl mb-12 font-light">
              Trazemos estratégias com propósito, insights acionáveis e processos modernos para ajudar você a validar, lançar e escalar seus produtos com absoluta confiança no mercado digital.
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="bg-zinc-900 hover:bg-black text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              Saber Mais
            </motion.button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="bg-[#121810] rounded-[2rem] p-8 text-white relative shadow-2xl"
          >
             <div className="h-10 bg-[#e4face]/10 rounded-xl mb-8 flex items-center px-4 overflow-hidden border border-white/5">
                <span className="text-white/80 text-sm font-medium">Performance Dashboard</span>
             </div>
             
             <div className="space-y-4">
                <div className="text-[80px] font-light text-[#97fb2e] leading-none tracking-tight flex items-center gap-4">
                  49% <div className="h-3 w-8 bg-white/20 rounded-full animate-pulse"></div>
                </div>
                <p className="text-white/40 text-sm">Crescimento acelerado</p>
             </div>

             <div className="mt-12 flex flex-wrap gap-2 text-[10px] font-medium">
               <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-white/60">Profissional</span>
               <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-white/60">Online</span>
               <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-white/60">Digital Focus</span>
               <span className="px-3 py-1.5 rounded-full bg-[#97fb2e]/10 border border-[#97fb2e]/20 text-[#97fb2e]">Scale Mode</span>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="bg-[#0a1007] relative z-10 py-32 border-t border-zinc-850">
        <div className="max-w-7xl mx-auto px-6">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
             className="text-center max-w-2xl mx-auto mb-20"
           >
              <span className="text-[#97fb2e] text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 mb-6">
                 <div className="w-1.5 h-1.5 bg-[#97fb2e] rounded-full"></div> NOSSOS PLANOS
              </span>
              <h2 className="font-sans text-4xl md:text-5xl text-white font-medium leading-[1.1] mb-6">
                Planos flexíveis para cada estágio do seu negócio
              </h2>
              <p className="text-white/60 text-lg font-light leading-relaxed">
                Comece pequeno ou escale rapidamente. Escolha o plano que melhor se adapta às suas necessidades e ao seu momento no mercado.
              </p>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-2">
              
              {/* Starter */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="bg-[#101112]/90 border border-zinc-800/60 rounded-[2rem] p-10 flex flex-col justify-between hover:border-zinc-700/60 transition-all duration-300 relative"
              >
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2 font-sans tracking-tight">Starter</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed min-h-[40px]">
                      Para freelancers e microsaas lidarem com até 3 apps ativos.
                    </p>
                  </div>
                  <div className="mb-8 font-sans font-extrabold text-4xl text-white tracking-tight">
                    Grátis
                  </div>
                  <ul className="space-y-4 mb-10">
                    {[
                      'Até 3 Clientes',
                      'Monito. Firebase (Limitado)',
                      'Integração Asaas Básica',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-300 text-sm font-medium">
                        <Check className="w-4 h-4 text-[#97fb2e] shrink-0" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3.5 rounded-full bg-[#18191a] hover:bg-zinc-800 border border-zinc-850 text-white font-semibold text-xs uppercase tracking-wider transition-all duration-200 mt-6 cursor-pointer"
                >
                  Iniciar Gratuitamente
                </motion.button>
              </motion.div>

              {/* Professional */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="bg-[#101112]/95 border-2 border-[#97fb2e] rounded-[2rem] p-10 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 relative shadow-[0_0_50px_rgba(151,251,46,0.1)]"
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#97fb2e] text-[#0a1007] text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg select-none">
                  Mais Popular
                </div>
                
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2 font-sans tracking-tight">Professional</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed min-h-[40px]">
                      A ferramenta completa para agências lidarem com escala.
                    </p>
                  </div>
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-sans font-extrabold text-white tracking-tight">R$ 149</span>
                      <span className="text-zinc-500 text-xs font-semibold">/mês</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-10">
                    {[
                      'Clientes Ilimitados',
                      'NOC Firestore Em Tempo Real',
                      'Sistema de Tickets L1/L2',
                      'Faturamento Automático PIX',
                      'Múltiplas Contas Admin',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-200 text-sm font-medium">
                        <Check className="w-4 h-4 text-[#97fb2e] shrink-0" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3.5 rounded-full bg-[#97fb2e] hover:bg-[#86e224] text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(151,251,46,0.2)] mt-6 cursor-pointer"
                >
                  Assinar Pro
                </motion.button>
              </motion.div>

              {/* Enterprise */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="bg-[#101112]/90 border border-zinc-800/60 rounded-[2rem] p-10 flex flex-col justify-between hover:border-zinc-700/60 transition-all duration-300 relative"
              >
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2 font-sans tracking-tight">Enterprise</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed min-h-[40px]">
                      Monitoramento on-premises em instâncias separadas.
                    </p>
                  </div>
                  <div className="mb-8 font-sans font-extrabold text-4xl text-white tracking-tight">
                    Custom
                  </div>
                  <ul className="space-y-4 mb-10">
                    {[
                      'Implantação Self-hosted',
                      'Exportação BigQuery Dedicada',
                      'SLA & Suporte 24/7',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-300 text-sm font-medium">
                        <Check className="w-4 h-4 text-[#97fb2e] shrink-0" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3.5 rounded-full bg-[#18191a] hover:bg-zinc-800 border border-zinc-850 text-white font-semibold text-xs uppercase tracking-wider transition-all duration-200 mt-6 cursor-pointer"
                >
                  Falar com Vendas
                </motion.button>
              </motion.div>

           </div>
        </div>
      </section>

      {/* FAQ Grid Section (Fades up nicely) */}
      <section className="py-24 bg-[#0a1007] relative z-10 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
             <h2 className="text-3xl font-bold text-white mb-4">Perguntas Frequentes</h2>
             <p className="text-zinc-400 font-light">Tire suas dúvidas sobre o funcionamento e segurança da AnimaSystem.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {[
              {
                question: "Preciso dar acesso total ao meu Firebase?",
                answer: "Não. A AnimaSystem utiliza o princípio do Menor Privilégio (Least Privilege). Solicitamos apenas a permissão 'monitoring.viewer' para ler contadores de uso, sem qualquer acesso aos dados dos seus usuários ou do Firestore."
              },
              {
                question: "Como funciona a integração financeira?",
                answer: "Temos integração nativa com o Asaas. Configurando sua chave de API, a AnimaSystem gera cobranças automáticas via PIX, Boleto e Cartão de Crédito, além de gerenciar inadimplência e emitir alertas de vencimento automaticamente."
              },
              {
                question: "A AnimaSystem suporta dezenas de projetos?",
                answer: "Sim. Nossa arquitetura Multi-Tenant com ingestão via Polling foi desenhada para escalar e monitorar dezenas ou até centenas de projetos Firebase simultâneos com baixíssimo custo operacional."
              },
              {
                question: "Posso criar contas para minha equipe?",
                answer: "Com certeza. Nos planos Pro e Enterprise, você pode criar contas para o seu time de suporte com níveis de acesso granulares (Admin, Financeiro, NOC, Suporte L1/L2)."
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between text-white font-medium hover:text-[#97fb2e] transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-300", openFaq === idx && "rotate-180 text-[#97fb2e]")} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/50 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer / CTA Section matching design */}
      <footer className="bg-[#0c0d0e] relative z-10 border-t border-zinc-900 pt-16">
        
        {/* CTA Banner */}
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center relative overflow-hidden">
          {/* Neon green overlay blur glow to match the screenshot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-[#97fb2e]/10 rounded-full blur-[100px] pointer-events-none" />
          
          <h2 className="font-sans font-bold text-4xl md:text-5xl text-white tracking-tight max-w-2xl leading-tight mb-5 relative z-10">
            Pronto para tomar o controle?
          </h2>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl mb-10 relative z-10 font-light leading-relaxed">
            Centralize hoje mesmo a operação dos seus softwares. Sem planilhas,<br className="hidden sm:inline" />
            sem dezenas de abas soltas.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(151,251,46,0.6)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="relative z-10 bg-[#97fb2e] hover:bg-[#86e224] text-black px-10 py-4 rounded-full font-bold text-xs tracking-wider transition-all shadow-[0_0_25px_rgba(151,251,46,0.3)] cursor-pointer"
          >
            Criar Conta Gratuita
          </motion.button>
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="border-t border-zinc-900/80 max-w-7xl mx-auto px-6" />

        {/* Links Grid & Brand Info */}
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 md:gap-16 items-start">
          
          {/* Logo & Narrative */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <LightningLogo className="w-5 h-5 text-[#97fb2e]" />
              <span className="text-lg font-bold tracking-tight text-white font-sans">
                AnimaSystem
              </span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-xs font-light">
              O sistema ERP e Monitoramento focado na redução de atrito para agências digitais e criadores de Software.
            </p>
          </div>

          {/* Links Column 1: Produto */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Produto</h4>
            <ul className="space-y-2.5 text-xs text-zinc-500 font-light">
              <li><a href="#servicos" className="hover:text-[#97fb2e] transition-colors">Funcionalidades</a></li>
              <li><a href="#planos" className="hover:text-[#97fb2e] transition-colors">Integração Asaas</a></li>
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#97fb2e] transition-colors text-left cursor-pointer">Segurança</button></li>
              <li><a href="#planos" className="hover:text-[#97fb2e] transition-colors">Preços</a></li>
            </ul>
          </div>

          {/* Links Column 2: Recursos */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recursos</h4>
            <ul className="space-y-2.5 text-xs text-zinc-500 font-light">
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#97fb2e] transition-colors text-left cursor-pointer">Documentação</button></li>
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#97fb2e] transition-colors text-left cursor-pointer">Status da API</button></li>
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#97fb2e] transition-colors text-left cursor-pointer">Central de Ajuda</button></li>
            </ul>
          </div>

          {/* Links Column 3: Empresa */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Empresa</h4>
            <ul className="space-y-2.5 text-xs text-zinc-500 font-light">
              <li><a href="#sobre" className="hover:text-[#97fb2e] transition-colors">Sobre</a></li>
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#97fb2e] transition-colors text-left cursor-pointer">Termos de Serviço</button></li>
              <li><button onClick={() => setIsModalOpen(true)} className="hover:text-[#97fb2e] transition-colors text-left cursor-pointer">Privacidade</button></li>
            </ul>
          </div>

        </div>

        {/* Divider 2 */}
        <div className="border-t border-zinc-900/60" />

        {/* Copyright and Health Status Row */}
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs text-center sm:text-left font-light">
            © 2026 AnimaSystem Inc. Todos os direitos reservados.
          </p>
          
          {/* Status Badge from Mockup */}
          <div className="flex items-center gap-2 border border-emerald-900/30 bg-[#061c0e]/40 px-4 py-1.5 rounded-full select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 text-[11px] font-medium tracking-wide">
              Todos os Serviços Online (Status: Verde)
            </span>
          </div>
        </div>

      </footer>

      {/* Orçamento Modal (Animated beautifully with AnimatePresence) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                {formSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#97fb2e]/20 text-[#97fb2e] rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Solicitação Enviada!</h2>
                    <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                      A sua solicitação foi feita com sucesso.<br/> Um de nossos colaboradores entrará em contato em breve.
                    </p>
                    <button 
                      onClick={() => {
                        setIsModalOpen(false);
                        setFormSuccess(false);
                        setFormData({ name: '', phone: '', email: '', message: '' });
                      }}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-4 rounded-xl text-sm tracking-widest uppercase transition-all"
                    >
                      Fechar
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Agendar Consultoria</h2>
                    <p className="text-zinc-400 text-sm mb-8">Preencha os dados abaixo e entraremos em contato rapidamente.</p>

                    <form className="space-y-4" onSubmit={handleSubmitConsultoria}>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-[#97fb2e]/80 mb-2">Nome</label>
                        <input 
                          type="text" 
                          required 
                          value={formData.name}
                          onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#97fb2e] focus:ring-1 focus:ring-[#97fb2e] transition-all"
                          placeholder="Seu nome"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-[#97fb2e]/80 mb-2">Telefone</label>
                        <input 
                          type="text" 
                          required 
                          value={formData.phone}
                          onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#97fb2e] focus:ring-1 focus:ring-[#97fb2e] transition-all"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-[#97fb2e]/80 mb-2">E-mail</label>
                        <input 
                          type="email" 
                          required 
                          value={formData.email}
                          onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#97fb2e] focus:ring-1 focus:ring-[#97fb2e] transition-all"
                          placeholder="seu@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-[#97fb2e]/80 mb-2">Sobre o que a sua empresa atua?</label>
                        <textarea 
                          required 
                          rows={4}
                          value={formData.message}
                          onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#97fb2e] focus:ring-1 focus:ring-[#97fb2e] transition-all resize-none font-light"
                          placeholder="Conte um pouco sobre o seu negócio e qual seria a sua necessidade..."
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-6 bg-[#97fb2e] hover:bg-[#86e029] disabled:opacity-50 text-[#0a1007] font-bold px-8 py-4 rounded-xl text-sm tracking-widest uppercase transition-all shadow-[0_0_40px_rgba(151,251,46,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'} <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
