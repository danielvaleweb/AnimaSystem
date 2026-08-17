const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

// 1. Update Tooltip
const oldTooltip = `const CustomChartTooltip = ({ active, payload, label }: any) => {
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
};`;

const newTooltip = `const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const currentVal = payload[0].value;
    const prevVal = currentVal * 0.91; 

    return (
      <div className="flex items-center gap-2 mb-2 -ml-5 -mt-10 outline-none">
        <span className="text-[10px] bg-zinc-100 text-zinc-600 font-semibold px-2.5 py-1 rounded-full border border-zinc-200">
          R$ {prevVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-[10px] bg-[#D7FE03] text-black font-bold px-2.5 py-1 rounded-full border border-transparent shadow-[0_0_15px_rgba(215,254,3,0.3)]">
          R$ {currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    );
  }
  return null;
};`;
content = content.replace(oldTooltip, newTooltip);

// 2. Add extra background data to expensesChartData
const oldChartData = `const expensesChartData = [
    { name: 'jan', expense: 1200 },
    { name: 'feb', expense: 1400 },
    { name: 'mar', expense: 1100 },
    { name: 'apr', expense: 1900 },
    { name: 'may', expense: 1700 },
    { name: 'jun', expense: 2300 },
    { name: 'jul', expense: 2120 },
    { name: 'aug', expense: 1800 },
    { name: 'sep', expense: 2200 },
    { name: 'oct', expense: 1950 },
    { name: 'nov', expense: 2500 },
    { name: 'dec', expense: 2400 },
  ];`;

const newChartData = `const expensesChartData = [
    { name: 'jan', expense: 1200, bg: 1500 },
    { name: 'feb', expense: 1400, bg: 1300 },
    { name: 'mar', expense: 1100, bg: 1600 },
    { name: 'apr', expense: 1900, bg: 1400 },
    { name: 'may', expense: 1700, bg: 2000 },
    { name: 'jun', expense: 2300, bg: 1800 },
    { name: 'jul', expense: 2120, bg: 1500 },
    { name: 'aug', expense: 1800, bg: 2100 },
    { name: 'sep', expense: 2200, bg: 1900 },
    { name: 'oct', expense: 1950, bg: 1600 },
    { name: 'nov', expense: 2500, bg: 2200 },
    { name: 'dec', expense: 2400, bg: 2000 },
  ];
  
  const [selectedChartPeriod, setSelectedChartPeriod] = useState('Anual');
  const [activeMonth, setActiveMonth] = useState('jul');
  `;
content = content.replace(oldChartData, newChartData);

// 3. Update the chart section JSX
const oldChartSection = /{[\s\S]*?\/\* Bottom: Your expenses this year chart \*\/[\s\S]*?className="bg-white border border-zinc-200\/75 rounded-\[32px\] p-6 shadow-xs flex flex-col justify-between flex-1 relative"[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

// We need to carefully replace the bottom chart div
const chartSectionReplacement = `{/* Bottom: Crescimento financeiro chart */}
            <div className="bg-white border border-zinc-200/75 rounded-[32px] p-8 shadow-xs flex flex-col justify-between flex-1 relative overflow-visible">
              <div className="flex justify-between items-start pb-4">
                <span className="font-display font-medium text-zinc-900 text-2xl tracking-tight">Crescimento financeiro</span>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => setShowChartMenu(!showChartMenu)}
                      className="w-10 h-10 rounded-full border border-zinc-200/80 flex items-center justify-center hover:bg-zinc-50 text-zinc-500 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-4 h-4" />
                    </button>
                    
                    {showChartMenu && (
                      <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-zinc-200/80 rounded-2xl shadow-xl py-2 z-50 animate-fade-in text-left">
                        {['Mensal', 'Anual', 'Total', 'Por Período'].map(p => (
                          <button 
                            key={p}
                            onClick={() => { setSelectedChartPeriod(p); setShowChartMenu(false); }} 
                            className={\`w-full text-left px-4 py-2 text-xs font-medium transition-colors cursor-pointer \${selectedChartPeriod === p ? 'text-black bg-zinc-50' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}\`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => onNavigate('finance')}
                    className="w-10 h-10 rounded-full border border-zinc-200/80 flex items-center justify-center hover:bg-zinc-50 text-zinc-500 transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Area Spline chart */}
              <div className="h-44 w-full pt-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={expensesChartData} 
                    margin={{ top: 15, right: 10, left: 10, bottom: 20 }}
                    onMouseMove={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        setActiveMonth(state.activePayload[0].payload.name);
                      }
                    }}
                    onMouseLeave={() => setActiveMonth('jul')}
                  >
                    {/* Background Mountain Shapes */}
                    <Area 
                      type="monotone" 
                      dataKey="bg" 
                      stroke="none"
                      fill="#f4f4f5" 
                      fillOpacity={0.6} 
                    />
                    
                    <XAxis 
                      dataKey="name" 
                      stroke="#d4d4d8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dy={15}
                      tick={(props: any) => {
                        const { x, y, payload } = props;
                        const isActive = payload.value === activeMonth;
                        return (
                          <g transform={\`translate(\${x},\${y})\`}>
                            <rect 
                               x="-18" 
                               y="-10" 
                               width="36" 
                               height="20" 
                               rx="10" 
                               fill={isActive ? '#09090b' : '#ffffff'} 
                               stroke={isActive ? '#09090b' : '#e4e4e7'} 
                               strokeWidth={1}
                            />
                            <text 
                               x="0" 
                               y="3" 
                               textAnchor="middle" 
                               fill={isActive ? '#ffffff' : '#71717a'} 
                               fontSize={10} 
                               fontWeight={isActive ? 600 : 500}
                            >
                              {payload.value}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <ChartTooltip 
                      content={<CustomChartTooltip />}
                      cursor={{ stroke: '#d4d4d8', strokeWidth: 1.5 }}
                      isAnimationActive={false}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#18181b" 
                      strokeWidth={2} 
                      fill="transparent" 
                      activeDot={{ r: 5, fill: '#fff', stroke: '#18181b', strokeWidth: 2.5 }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Footer totals */}
              <div className="flex items-baseline gap-2 mt-4 pt-4">
                <span className="text-[28px] font-display font-semibold text-zinc-900 tracking-tight">
                  R$ 28.460,00
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {selectedChartPeriod === 'Mensal' ? 'Isso é R$5.650,00 a mais que no mesmo dia do mês passado' : 'Isso é R$5.650,00 a mais que no ano passado'}
                </span>
              </div>
            </div>`;

// Use simple replacement instead of regex since the old block might contain newlines which makes regex tricky
const oldBlockStart = `{/* Bottom: Your expenses this year chart */}`;
const parts = content.split(oldBlockStart);
if (parts.length > 1) {
  // We want to replace from oldBlockStart up to the end of that div which is right before {/* ----------------- COLUMN 3: HIGHLIGHTS & HISTORY (4/12 width) ----------------- */}
  const column3Start = `{/* ----------------- COLUMN 3: HIGHLIGHTS & HISTORY (4/12 width) ----------------- */}`;
  const parts2 = parts[1].split(column3Start);
  
  // The first chunk of parts2 is the old chart section and some trailing whitespace/divs.
  // We need to keep the closing divs if any.
  // Actually, the old chart is just one div. Let's see what is between oldBlockStart and column3Start
  // "</div>\n\n          </div>\n\n          {/* ----------------- COLUMN 3: HIGHLIGHTS & HISTORY"
  // Let's do a more precise replacement.
  
  content = parts[0] + chartSectionReplacement + "\n\n          </div>\n\n          " + column3Start + parts2[1];
}

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
console.log("Dashboard Chart Patched fully!");
