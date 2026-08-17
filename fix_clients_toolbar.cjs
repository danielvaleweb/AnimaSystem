const fs = require('fs');
let content = fs.readFileSync('src/components/clients/ClientsView.tsx', 'utf8');

const oldToolbarStart = `      {/* Toolbar */}
      <div className="p-4 sm:p-6 border border-zinc-200/80 bg-white rounded-3xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou domínio..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-zinc-200/80 focus:border-zinc-300 outline-none rounded-full py-2.5 pl-11 pr-4 text-sm text-zinc-800 placeholder:text-zinc-500 shadow-sm transition-all"
            />
          </div>`;

const newToolbarStart = `      {/* Toolbar */}
      <div className="p-2 pl-4 border border-zinc-200 bg-white rounded-[2rem] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou domínio..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border border-zinc-200 hover:border-zinc-300 focus:border-zinc-300 outline-none rounded-full py-2 pl-9 pr-4 text-sm text-zinc-800 placeholder:text-zinc-400 transition-all"
            />
          </div>`;

content = content.replace(oldToolbarStart, newToolbarStart);

const oldStatusBtn = `            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center justify-between gap-2.5 bg-white border border-zinc-200/80 text-sm text-zinc-800 rounded-full py-2.5 pl-5 pr-8 outline-none focus:border-zinc-300 shadow-sm transition-all select-none cursor-pointer w-full sm:w-auto sm:min-w-[160px] relative"
            >
              <span>
                {filterStatus === 'all' ? 'Todos os Status' : 
                 filterStatus === 'active' ? 'Ativos' : 
                 filterStatus === 'trial' ? 'Em Trial' : 'Suspensos'}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 absolute right-3.5 top-1/2 -translate-y-1/2", isStatusDropdownOpen && "rotate-180")} />
            </button>`;

const newStatusBtn = `            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center justify-between gap-2.5 bg-transparent border border-zinc-200 hover:border-zinc-300 text-sm text-zinc-700 rounded-full py-2 pl-4 pr-8 outline-none focus:border-zinc-300 transition-all select-none cursor-pointer w-full sm:w-auto sm:min-w-[160px] relative"
            >
              <span>
                {filterStatus === 'all' ? 'Todos os Status' : 
                 filterStatus === 'active' ? 'Ativos' : 
                 filterStatus === 'trial' ? 'Em Trial' : 'Suspensos'}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 absolute right-3.5 top-1/2 -translate-y-1/2", isStatusDropdownOpen && "rotate-180")} />
            </button>`;

content = content.replace(oldStatusBtn, newStatusBtn);

const oldViewModes = `          <div className="flex bg-white p-1 rounded-full border border-zinc-200/80 shadow-sm justify-center sm:justify-start shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                viewMode === 'list' ? "bg-zinc-200 text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                viewMode === 'grid' ? "bg-zinc-200 text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>`;

const newViewModes = `          <div className="flex bg-transparent p-1 rounded-full border border-zinc-200 justify-center sm:justify-start shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-full transition-colors cursor-pointer",
                viewMode === 'list' ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-full transition-colors cursor-pointer",
                viewMode === 'grid' ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>`;

content = content.replace(oldViewModes, newViewModes);

const oldButtons = `        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsContractsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 font-semibold py-2.5 px-6 rounded-full transition-colors text-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Gerenciar Contratos
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-zinc-950 font-semibold py-2.5 px-6 rounded-full transition-colors text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>`;

const newButtons = `        <div className="flex gap-2 w-full sm:w-auto p-1 sm:p-0 sm:pr-1">
          <button 
            onClick={() => setIsContractsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 font-medium py-2 px-4 rounded-full transition-colors text-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-zinc-500" />
            Gerenciar Contratos
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-zinc-950 font-semibold py-2 px-5 rounded-full transition-colors text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>`;

content = content.replace(oldButtons, newButtons);

fs.writeFileSync('src/components/clients/ClientsView.tsx', content);
