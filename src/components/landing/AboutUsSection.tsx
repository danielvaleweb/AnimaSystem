import { Users, Award, ShieldCheck, HeartHandshake, Code, Sparkles, ArrowRight } from 'lucide-react';

interface AboutUsSectionProps {
  onOpenDemoModal: () => void;
}

export function AboutUsSection({ onOpenDemoModal }: AboutUsSectionProps) {
  const pillars = [
    {
      icon: Code,
      title: 'Engenharia de Alto Desempenho',
      description: 'Arquiteturas modernas em nuvem Google Cloud com foco em velocidade de carregamento, segurança de dados e disponibilidade contínua.',
    },
    {
      icon: Sparkles,
      title: 'DNA 100% AI First',
      description: 'Não adicionamos IA por modismo. Nossos produtos são concebidos do zero com agentes inteligentes para eliminar tarefas manuais repetitivas.',
    },
    {
      icon: ShieldCheck,
      title: 'Confiabilidade e Segurança',
      description: 'Sistemas protegidos com criptografia de ponta a ponta, backups diários automáticos e conformidade rigorosa com a LGPD.',
    },
    {
      icon: HeartHandshake,
      title: 'Parceria de Longo Prazo',
      description: 'Acompanhamos cada cliente no onboarding, treinamento e evolução tecnológica contínua para garantir resultados mensuráveis.',
    },
  ];

  return (
    <section id="sobre" className="py-20 sm:py-28 bg-white border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#D7FE03] ring-2 ring-zinc-300" />
              <span>SOBRE NÓS</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black tracking-tight leading-[1.15]">
              Construindo a tecnologia que impulsiona o <span className="underline decoration-[#D7FE03] decoration-4 underline-offset-6">futuro dos negócios</span>
            </h2>

            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">
              Nascemos com a missão clara de transformar a complexidade de softwares empresariais em experiências simples, integradas e potencializadas por Inteligência Artificial.
            </p>

            <p className="text-sm text-zinc-600 leading-relaxed">
              Desenvolvemos ERPs verticais específicos para cada nicho de mercado, portais imobiliários, sites de altíssima conversão e aplicativos mobile sob medida. Nossa equipe combina engenharia de ponta com profundo entendimento das dores comerciais reais de pequenas, médias e grandes empresas.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenDemoModal}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-black hover:bg-zinc-800 text-white shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <span>Conhecer soluções personalizadas</span>
                <ArrowRight className="w-4 h-4 text-[#D7FE03]" />
              </button>
            </div>
          </div>

          {/* Right Highlights Bento Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#F8F9FA] border border-zinc-200/90 rounded-3xl p-6 hover:bg-white hover:border-[#D7FE03] hover:shadow-md transition-all space-y-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-black text-[#D7FE03] flex items-center justify-center shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-black">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">{pillar.description}</p>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
