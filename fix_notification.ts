import fs from 'fs';

let content = fs.readFileSync('src/components/NotificationContext.tsx', 'utf8');

// 1. Add playPopSound function before ToastItem
const popSoundCode = `
function playPopSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // ignore
  }
}

interface ToastItemProps {`;

content = content.replace('interface ToastItemProps {', popSoundCode);

// 2. Play sound on Toast mount
const toastUseEffect = `  useEffect(() => {
    playPopSound();
    const timer = setTimeout(onClose, notification.duration || 5000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);`;

content = content.replace(
  `  useEffect(() => {
    const timer = setTimeout(onClose, notification.duration || 5000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);`,
  toastUseEffect
);


// 3. Update Success style
const oldSuccessStyle = `      case 'success':
        return {
          icon: <Rocket className="w-5 h-5 text-accent animate-pulse" />,
          classes: 'bg-zinc-950/95 border border-accent/40 text-zinc-100 shadow-[0_0_20px_rgba(153,243,62,0.15)]',
          barColor: 'bg-accent'
        };`;

const newSuccessStyle = `      case 'success':
        return {
          icon: (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.6, duration: 0.6 }}
            >
              <CheckCircle2 className="w-5 h-5 text-accent" />
            </motion.div>
          ),
          classes: 'bg-zinc-950/95 border border-zinc-800 text-zinc-100 shadow-xl',
          barColor: 'bg-accent',
          hideSideBar: true
        };`;

content = content.replace(oldSuccessStyle, newSuccessStyle);

// 4. Hide side bar conditionally
content = content.replace(
  `<div className={cn("absolute left-0 top-0 bottom-0 w-[4px]", style.barColor)}></div>`,
  `{!style.hideSideBar && <div className={cn("absolute left-0 top-0 bottom-0 w-[4px]", style.barColor)}></div>}`
);

fs.writeFileSync('src/components/NotificationContext.tsx', content);
