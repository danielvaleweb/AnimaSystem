const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

// 1. Add state
content = content.replace(
  'const [showNotifications, setShowNotifications] = useState(false);',
  'const [showNotifications, setShowNotifications] = useState(false);\n  const [hasUnread, setHasUnread] = useState(true);'
);

// 2. Update handleClickOutside
const oldHandleClick = `    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };`;

const newHandleClick = `    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };`;
content = content.replace(oldHandleClick, newHandleClick);

// 3. Update red dot
content = content.replace(
  '<span className="absolute top-[10px] right-[10px] block h-2 w-2 rounded-full border-2 border-white bg-red-500" />',
  '{hasUnread && <span className="absolute top-[10px] right-[10px] block h-2 w-2 rounded-full border-2 border-white bg-red-500" />}'
);

// 4. Update "3 Novas"
content = content.replace(
  '<div className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">3 Novas</div>',
  '{hasUnread && <div className="text-[10px] font-medium text-zinc-500">3 Novas</div>}'
);

// 5. Update "Marcar todas"
content = content.replace(
  '<button className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer">\n                  Marcar todas como lidas\n                </button>',
  '<button onClick={() => setHasUnread(false)} className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer">\n                  Marcar todas como lidas\n                </button>'
);

fs.writeFileSync('src/components/Header.tsx', content);
