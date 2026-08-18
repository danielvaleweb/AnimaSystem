const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');

const oldStr = `          </form>
        </div>
        </div>
      </div>
      
      <div className="bg-white border-t border-zinc-200 p-6 sticky bottom-0 z-10">`;

const newStr = `          </form>
        </div>
      </div>
      
      <div className="bg-white border-t border-zinc-200 p-6 sticky bottom-0 z-10">`;

content = content.replace(oldStr, newStr);

fs.writeFileSync('src/components/clients/ClientModal.tsx', content);
