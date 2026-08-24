import { useState } from 'react';
import { ExternalLink, Sparkles, Smartphone, Globe, Layers, ArrowUpRight, CheckCircle2, Shield } from 'lucide-react';
import { motion } from 'motion/react';

interface PortfolioSectionProps {
  onOpenDemoModal: () => void;
}

export function PortfolioSection({ onOpenDemoModal }: PortfolioSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  const categories = [
    { id: 'todos', label: 'Todos os Projetos' },
    { id: 'erp', label: 'ERPs & Gestão' },
    { id: 'sites', label: 'Sites & Landing Pages' },
    { id: 'apps', label: 'Apps Mobile' },
    { id: 'crm', label: 'CRMs & IA' },
  ];

  const projects = [
    {
      id: 'lava-jato',
      title: 'AutoShine ERP & Lava-Jato',
      category: 'erp',
      categoryLabel: 'ERP Lava-Jato',
      description: 'Sistema completo com fila de lavagem em tempo real, comissões de lavadores, checkout rápido PIX e agendamento pelo WhatsApp.',
      tags: ['Gestão de Fila', 'WhatsApp Bot', 'Painel TV'],
      metric: '+45% velocidade no atendimento',
      color: 'from-emerald-500 to-teal-700',
    },
    {
      id: 'mecanica',
      title: 'MasterFix Auto Center & Mecânica',
      category: 'erp',
      categoryLabel: 'ERP Mecânica',
      description: 'Ordem de serviço digital com fotos de vistoria no checklist, controle de estoque de autopeças e lembretes automáticos de revisão.',
      tags: ['Ordem de Serviço', 'Estoque Peças', 'Vistoria Foto'],
      metric: 'Zero perda de peças no estoque',
      color: 'from-slate-800 to-slate-900',
    },
    {
      id: 'imobiliaria',
      title: 'PrimeHouse Imobiliária & CRM',
      category: 'erp',
      categoryLabel: 'ERP Imobiliária',
      description: 'Portal de imóveis de alta velocidade com integração a portais (ZAP/VivaReal), LYA SDR 24/7 e esteira de locação digital.',
      tags: ['Integração Portais', 'LYA SDR 24/7', 'Contrato Digital'],
      metric: '3.4x mais leads convertidos',
      color: 'from-emerald-600 to-emerald-900',
    },
    {
      id: 'site-clinica',
      title: 'Clínica Lumina Médica',
      category: 'sites',
      categoryLabel: 'Desenvolvimento de Sites',
      description: 'Site institucional moderno com nota 100 no Google PageSpeed, integração com prontuário e agendamento de consultas via IA.',
      tags: ['PageSpeed 100', 'SEO Rank 1', 'Agendamento IA'],
      metric: 'Tempo de carga < 0.8s',
      color: 'from-teal-600 to-emerald-700',
    },
    {
      id: 'app-logistica',
      title: 'Rotas Express Driver',
      category: 'apps',
      categoryLabel: 'Desenvolvimento de App',
      description: 'Aplicativo móvel Android/iOS para motoristas com rastreamento GPS em segundo plano, baixa offline e assinatura na tela.',
      tags: ['Flutter/React Native', 'GPS Realtime', 'Modo Offline'],
      metric: 'Mais de 50.000 entregas/mês',
      color: 'from-slate-900 to-emerald-950',
    },
    {
      id: 'lp-lancamento',
      title: 'Landing Page Alpha Experience',
      category: 'sites',
      categoryLabel: 'Landing Pages de Alta Conversão',
      description: 'Página de vendas com design imersivo, testes A/B integrados, contadores de escassez dinâmicos e checkout direto.',
      tags: ['Taxa 18.4% Conversão', 'Design Imersivo', 'Copywriting IA'],
      metric: '18.4% taxa de conversão',
      color: 'from-emerald-700 to-teal-800',
    },
    {
      id: 'crm-vendas',
      title: 'Nexus Omnichannel CRM',
      category: 'crm',
      categoryLabel: 'Desenvolvimento CRM',
      description: 'Pipeline multicanal integrando WhatsApp, Instagram Direct, Facebook Messenger e E-mail com transcrição automática de áudios.',
      tags: ['Kanban Visual', 'Transcrição Áudio', 'Distribuição Leads'],
      metric: 'Atendimento unificado 24/7',
      color: 'from-slate-800 to-emerald-900',
    },
  ];

  const filteredProjects = activeCategory === 'todos'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  return (
    <section id="portfolio" className="py-20 sm:py-28 bg-[#F4F4F4]/40 border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-800 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#D7FE03] ring-2 ring-zinc-300" />
            <span>PORTFÓLIO & CASOS DE SUCESSO</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black tracking-tight">
            Projetos que aceleram <span className="underline decoration-[#D7FE03] decoration-4 underline-offset-6">negócios reais</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-600 leading-relaxed">
            De ERPs especializados para verticais de mercado a sites ultrarrápidos e aplicativos mobile escaláveis.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-black hover:bg-zinc-100 border border-zinc-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Project Header Banner / Mockup Preview */}
                <div className={`h-36 bg-gradient-to-br from-zinc-900 to-black p-6 flex flex-col justify-between relative overflow-hidden text-white`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D7FE03]/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 text-[#D7FE03] border border-[#D7FE03]/30 backdrop-blur-xs px-2.5 py-1 rounded-full">
                      {project.categoryLabel}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center group-hover:bg-[#D7FE03] group-hover:text-black transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D7FE03]" />
                      <span>{project.metric}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7 space-y-3.5">
                  <h3 className="text-lg font-black text-black group-hover:text-zinc-700 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {project.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-semibold bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom CTA Action */}
              <div className="p-6 sm:p-7 pt-0">
                <button
                  onClick={onOpenDemoModal}
                  className="w-full py-2.5 rounded-2xl bg-zinc-50 hover:bg-[#D7FE03] text-zinc-800 hover:text-black border border-zinc-200/80 hover:border-[#D7FE03] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Solicitar projeto similar</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-14 p-8 rounded-3xl bg-[#161616] text-white border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-xl font-black">Tem um projeto específico em mente?</h4>
            <p className="text-xs sm:text-sm text-zinc-400">
              Desenvolvemos sistemas web, aplicativos e landing pages sob medida para sua operação.
            </p>
          </div>
          <button
            onClick={onOpenDemoModal}
            className="px-6 py-3 rounded-full bg-[#D7FE03] hover:bg-[#c4e602] text-black text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
          >
            Falar com nosso time de engenharia
          </button>
        </div>

      </div>
    </section>
  );
}
