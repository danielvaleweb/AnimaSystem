import { TrendingUp, Users, Globe, DollarSign, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

export function StatsSection() {
  const stats = [
    {
      value: '8k+',
      label: 'Operações no ecossistema',
      subtext: 'Empresas ativas e conectadas',
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      value: '50k+',
      label: 'Usuários ativos na plataforma',
      subtext: 'Equipes comerciais e gestores',
      icon: TrendingUp,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      value: '500+',
      label: 'Cidades com rede conectada',
      subtext: 'Presença nacional em todo o Brasil',
      icon: Globe,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      value: 'R$ 40B+',
      label: 'Volume de negócios processados',
      subtext: 'Transações e contratos no ERP',
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      value: '63K+',
      label: 'Chamadas de IA no mês',
      subtext: 'Crescimento exponencial de atendimentos',
      icon: Cpu,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-[#D7FE03] ring-2 ring-zinc-300" />
              <span>EXPERIÊNCIA E MATURIDADE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-tight leading-tight">
              A plataforma não começou em IA agora. <br className="hidden sm:inline" />
              Ela treinou essa virada por anos.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              A IA nasce da experiência real com dados, jornadas, integrações e atendimentos do mercado corporativo. Não é um experimento de laboratório: é inteligência aplicada a milhões de interações.
            </p>
          </div>
        </div>

        {/* 5 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="bg-[#F8F9FA] hover:bg-white border border-zinc-200/90 hover:border-[#D7FE03] rounded-3xl p-5 sm:p-6 transition-all shadow-2xs hover:shadow-md group"
              >
                <div className="w-10 h-10 rounded-2xl bg-black text-[#D7FE03] flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-black tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-2 text-xs sm:text-sm font-bold text-zinc-900 leading-snug">
                  {stat.label}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {stat.subtext}
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
