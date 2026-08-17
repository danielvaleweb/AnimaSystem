const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

// 1. Add CustomTooltip before NocHubDashboard component
const customTooltipDef = `
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const currentVal = payload[0].value;
    
    // We can just mock a previous value if needed or calculate it
    // But since it's a mock chart, let's just make the prev val slightly smaller
    const prevVal = currentVal * 0.91; 

    return (
      <div className="flex items-center gap-1.5 mb-2 -ml-4 -mt-8 outline-none">
        <span className="text-[10px] bg-zinc-100 text-zinc-500 font-medium px-2 py-1 rounded-full shadow-sm">
          R$ {prevVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-[10px] bg-[#D7FE03] text-black font-bold px-2 py-1 rounded-full shadow-sm">
          R$ {currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    );
  }
  return null;
};

export function NocHubDashboard`;

content = content.replace(/export function NocHubDashboard/g, customTooltipDef);

// 2. Add State for the menu
content = content.replace(
  /const \[isRefreshing, setIsRefreshing\] = useState\(false\);/,
  "const [isRefreshing, setIsRefreshing] = useState(false);\n  const [showChartMenu, setShowChartMenu] = useState(false);"
);

// 3. Replace the chart section
const oldChartSection = `{/* Bottom: Your expenses this year chart */}
            <div className="bg-white border border-zinc-200/75 rounded-3xl p-5 shadow-xs flex flex-col justify-between flex-1">
              <div className="flex justify-between items-center pb-2">
                <span className="font-light text-black text-sm tracking-wide">Your expenses this year</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] bg-zinc-100 text-zinc-500 font-light px-2 py-0.5 rounded-full">$1,946.00</span>
                  <span className="text-[9px] bg-[#D7FE03] text-black font-semibold px-2 py-0.5 rounded-full">$2,120.00</span>
                </div>
              </div>

              {/* Area Spline chart */}
              <div className="h-32 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={expensesChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <ChartTooltip 
                      contentStyle={{ background: '#fff', borderColor: '#e2e8f0', borderRadius: '10px', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="expense" stroke="#161616" strokeWidth={2.5} fill="rgba(216,255,2,0.06)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>`;

const newChartSection = `{/* Bottom: Your expenses this year chart */}
            <div className="bg-white border border-zinc-200/75 rounded-[32px] p-6 shadow-xs flex flex-col justify-between flex-1 relative">
              <div className="flex justify-between items-center pb-4">
                <span className="font-semibold text-zinc-900 text-sm tracking-wide">Crescimento financeiro</span>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => setShowChartMenu(!showChartMenu)}
                      className="w-9 h-9 rounded-full border border-zinc-200/80 flex items-center justify-center hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                    
                    {showChartMenu && (
                      <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-zinc-200/80 rounded-2xl shadow-xl py-2 z-50 animate-fade-in text-left">
                        <button onClick={() => setShowChartMenu(false)} className="w-full text-left px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">Mensal</button>
                        <button onClick={() => setShowChartMenu(false)} className="w-full text-left px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">Anual</button>
                        <button onClick={() => setShowChartMenu(false)} className="w-full text-left px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">Total</button>
                        <button onClick={() => setShowChartMenu(false)} className="w-full text-left px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">Por Período</button>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => onNavigate('finance')}
                    className="w-9 h-9 rounded-full border border-zinc-200/80 flex items-center justify-center hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Area Spline chart */}
              <div className="h-40 w-full pt-6 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={expensesChartData} margin={{ top: 15, right: 10, left: 10, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#d4d4d8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                      tick={(props: any) => {
                        const { x, y, payload } = props;
                        // To make the current month stand out, we could check if payload.value === 'jul'
                        const isActive = payload.value === 'jul';
                        return (
                          <g transform={\`translate(\${x},\${y})\`}>
                            <rect x="-14" y="-8" width="28" height="16" rx="8" fill={isActive ? '#18181b' : 'transparent'} stroke={isActive ? '#18181b' : '#e4e4e7'} />
                            <text x="0" y="3" dy=".1em" textAnchor="middle" fill={isActive ? '#ffffff' : '#71717a'} fontSize={9} fontWeight={isActive ? 600 : 400}>
                              {payload.value}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <ChartTooltip 
                      content={<CustomChartTooltip />}
                      cursor={{ stroke: '#e4e4e7', strokeWidth: 1.5 }}
                      isAnimationActive={false}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#161616" 
                      strokeWidth={2.5} 
                      fill="transparent" 
                      activeDot={{ r: 4, fill: '#fff', stroke: '#18181b', strokeWidth: 2.5 }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>`;

content = content.replace(oldChartSection, newChartSection);

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
console.log("Dashboard Chart Patched");
