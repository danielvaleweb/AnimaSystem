const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');

// Fix hover on more-vertical button
const oldMenuBtn = `              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>`;

const newMenuBtn = `              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>`;

content = content.replace(oldMenuBtn, newMenuBtn);

// Remove the navigation tabs section
const oldTabsSection = `      {/* Navigation Tabs */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-1.5 flex overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id 
                ? "bg-zinc-800 text-zinc-100" 
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-accent" : "")} />
            {tab.label}
          </button>
        ))}
      </div>`;

content = content.replace(oldTabsSection, "");

fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
