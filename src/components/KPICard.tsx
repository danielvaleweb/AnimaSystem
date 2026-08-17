import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { KPIData } from '../types';
import { cn } from '../utils';

interface KPICardProps {
  data: KPIData;
  highlighted?: boolean;
}

export function KPICard({ data, highlighted = false }: KPICardProps) {
  const isPositive = data.trend && data.trend > 0;
  const isNegative = data.trend && data.trend < 0;
  const TrendIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;

  // Set gorgeous gradient line & glowing shadow based on card characteristics
  let gradientClass = "bg-gradient-to-r from-zinc-500 to-zinc-400";
  let hoverShadowClass = "hover:shadow-[0_20px_45px_rgba(255,255,255,0.05)]";
  let iconBgClass = "bg-zinc-500/10 text-zinc-400";

  if (highlighted || data.title.includes("MRR") || data.title.includes("Entradas")) {
    gradientClass = "bg-gradient-to-r from-[#D7FE03] to-emerald-400";
    hoverShadowClass = "hover:shadow-[0_20px_45px_rgba(215,254,3,0.12)]";
    iconBgClass = "bg-[#D7FE03]/10 text-[#D7FE03]";
  } else if (data.title.includes("Faturado")) {
    gradientClass = "bg-gradient-to-r from-emerald-500 to-teal-400";
    hoverShadowClass = "hover:shadow-[0_20px_45px_rgba(16,185,129,0.1)]";
    iconBgClass = "bg-emerald-500/10 text-emerald-400";
  } else if (data.title.includes("Receber")) {
    gradientClass = "bg-gradient-to-r from-blue-500 to-indigo-500";
    hoverShadowClass = "hover:shadow-[0_20px_45px_rgba(59,130,246,0.1)]";
    iconBgClass = "bg-blue-500/10 text-blue-400";
  }

  return (
    <div 
      className={cn(
        "bg-[#0c0d0f] rounded-3xl p-7 relative overflow-hidden group select-none shadow-[0_15px_35px_rgba(0,0,0,0.4)] transition-all duration-500 hover:-translate-y-1.5 border border-zinc-900/40",
        hoverShadowClass
      )}
    >
      {/* Top visual gradient border */}
      <div className={cn("absolute top-0 left-0 w-full h-[3px] opacity-80 group-hover:opacity-100 transition-opacity duration-300", gradientClass)} />
      
      {/* Icon badge inside circular background container */}
      <div className={cn("absolute top-5 right-5 w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", iconBgClass)}>
        <data.icon className="w-5 h-5" />
      </div>

      <div className="flex flex-col h-full justify-between">
        <div className="mb-6">
          <span className="text-zinc-500 text-[11px] font-bold block uppercase tracking-wider">
            {data.title}
          </span>
          <h3 className="text-2.5xl sm:text-3.5xl font-black text-white tracking-tight mt-4 group-hover:text-zinc-100 transition-colors">
            {data.value}
          </h3>
        </div>

        {data.trend !== undefined && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={cn(
              "flex items-center gap-0.5 text-[11px] font-extrabold px-2 py-0.5 rounded-md",
              isPositive 
                ? "bg-emerald-500/10 text-emerald-400" 
                : isNegative
                  ? "bg-red-500/10 text-red-400"
                  : "bg-zinc-800 text-zinc-400"
            )}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{Math.abs(data.trend)}%</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-semibold">vs. mês anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}
