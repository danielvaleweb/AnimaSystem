const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/NocHubDashboard.tsx', 'utf8');

const regex = /const adjustedChange = inv\.changePercent \* periodMult;[\s\S]*?return \(/;

const replacement = `const adjustedChange = inv.changePercent * periodMult;
                      const quantity = (inv.name.length * 0.5 + 1.2).toFixed(4); // Mock quantity for layout
                      const currentPrice = inv.value / parseFloat(quantity); // Mock current price derived from value
                      
                      const forcedLogoType = index === 0 ? 'black' : index === 1 ? 'green' : 'white';
                      
                      return (`;

content = content.replace(regex, replacement);

// Replace inv.logoType with forcedLogoType in the card rendering
// We need to do this carefully within the map function
// Actually we can just do a regex replace from `return \(` to `}\)` or similar.

content = content.replace(/inv\.logoType === 'black'/g, "forcedLogoType === 'black'");
content = content.replace(/inv\.logoType === 'green'/g, "forcedLogoType === 'green'");

// Fix padding to avoid covering text. Change p-4 to px-5 pt-5 pb-8
content = content.replace(/className=\{\`p-4 rounded-\[28px\]/, "className={`px-5 pt-5 pb-7 rounded-[28px]");

fs.writeFileSync('src/components/dashboard/NocHubDashboard.tsx', content);
