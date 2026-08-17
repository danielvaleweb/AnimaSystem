import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const clients = [
  {
    id: 1,
    name: "TechNova Solutions",
    description: "Plataforma completa de gestão de nuvem, incluindo dashboard administrativo e aplicativo mobile.",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400&q=80&fit=crop",
    color: "from-blue-500/20 to-indigo-500/20",
    tags: ["React", "Node.js", "AWS"]
  },
  {
    id: 2,
    name: "Naturale Foods",
    description: "E-commerce escalável para venda de produtos orgânicos em todo o país.",
    logo: "https://images.unsplash.com/photo-1590403759281-2244f77c381c?w=400&q=80&fit=crop",
    color: "from-green-500/20 to-emerald-500/20",
    tags: ["Next.js", "Stripe", "Tailwind"]
  },
  {
    id: 3,
    name: "Lumina Studio",
    description: "Portfólio interativo para uma agência de design, focado em alta performance e SEO.",
    logo: "https://images.unsplash.com/photo-1558452919-08ae4aea8e29?w=400&q=80&fit=crop",
    color: "from-purple-500/20 to-pink-500/20",
    tags: ["Vite", "Framer Motion", "GSAP"]
  },
  {
    id: 4,
    name: "AeroDynamics",
    description: "Sistema de monitoramento e telemetria em tempo real para drones.",
    logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80&fit=crop",
    color: "from-orange-500/20 to-red-500/20",
    tags: ["WebSockets", "React", "D3.js"]
  },
  {
    id: 5,
    name: "FinFlow",
    description: "Aplicativo fintech de organização pessoal financeira com open banking.",
    logo: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&q=80&fit=crop",
    color: "from-cyan-500/20 to-blue-500/20",
    tags: ["React Native", "Firebase", "Plaid"]
  },
  {
    id: 6,
    name: "EduMetrics",
    description: "Dashboard educacional para professores e coordenadores pedagógicos.",
    logo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80&fit=crop",
    color: "from-yellow-500/20 to-amber-500/20",
    tags: ["Vue.js", "PostgreSQL", "GraphQL"]
  }
];

export function PortfolioPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a1007] font-sans pb-24 relative overflow-hidden text-white">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D7FE03]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#5fc2fe]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-6 py-8 md:px-12 md:py-12 flex items-center justify-between max-w-7xl mx-auto border-b border-zinc-800/50">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-2">Nosso Portfólio</h1>
          <p className="text-zinc-400 font-light text-lg">Trabalhos recentes que transformaram ideias em realidade.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-lg border border-white/10 text-white font-medium px-6 py-3 rounded-full text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </header>

      {/* Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clients.map((client) => (
            <div 
              key={client.id}
              className="group relative bg-[#0f150d] rounded-3xl border border-white/5 overflow-hidden hover:border-[#D7FE03]/50 transition-colors duration-500"
            >
              {/* Image Header */}
              <div className="aspect-[4/3] bg-zinc-900 relative overflow-hidden border-b border-white/5">
                <div className={`absolute inset-0 bg-gradient-to-br opacity-50 mix-blend-overlay z-10 ${client.color}`} />
                <img 
                  src={client.logo} 
                  alt={client.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold font-display tracking-tight text-white">{client.name}</h3>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#D7FE03] group-hover:text-black group-hover:border-[#D7FE03] transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-zinc-400 font-light leading-relaxed mb-6">
                  {client.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  {client.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-300 font-medium tracking-wide">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
