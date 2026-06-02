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

  return (
    <div 
      className={cn(
        "p-6 rounded-[2rem] flex flex-col justify-between transition-all duration-300",
        highlighted 
          ? "bg-accent text-zinc-950" 
          : "bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700/50"
      )}
    >
      <div className="flex items-start justify-between mb-8">
        <div 
          className={cn(
            "p-3 rounded-2xl", 
            highlighted ? "bg-black/10" : "bg-zinc-800/50"
          )}
        >
          <data.icon className={cn("w-6 h-6", highlighted ? "text-zinc-950" : "text-accent")} />
        </div>
        
        {data.trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full",
            highlighted 
              ? "bg-black/10 text-zinc-950" 
              : isPositive 
                ? "bg-emerald-500/10 text-emerald-400" 
                : isNegative
                  ? "bg-red-500/10 text-red-400"
                  : "bg-zinc-800 text-zinc-400"
          )}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{Math.abs(data.trend)}%</span>
          </div>
        )}
      </div>

      <div>
        <p className={cn(
          "text-sm font-medium mb-1",
          highlighted ? "text-zinc-900/70" : "text-zinc-400"
        )}>
          {data.title}
        </p>
        <h3 className={cn(
          "font-display text-4xl font-bold tracking-tight",
          highlighted ? "text-zinc-950" : "text-zinc-100"
        )}>
          {data.value}
        </h3>
      </div>
    </div>
  );
}
