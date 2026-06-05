import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Clock, Hand, Power, Code, Info, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { cn } from '../utils';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';
  title: string;
  message: string;
  duration?: number;
}

export interface NotificationContextType {
  showSuccess: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showWarn: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showSecondary: (title: string, message: string) => void;
  showContrast: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    type: Notification['type'],
    title: string,
    message: string,
    duration = 5000
  ) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = { id, type, title, message, duration };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const showSuccess = (title: string, message: string) => addNotification('success', title, message);
  const showInfo = (title: string, message: string) => addNotification('info', title, message);
  const showWarn = (title: string, message: string) => addNotification('warn', title, message);
  const showError = (title: string, message: string) => addNotification('error', title, message);
  const showSecondary = (title: string, message: string) => addNotification('secondary', title, message);
  const showContrast = (title: string, message: string) => addNotification('contrast', title, message);

  // Return appropriate design classes & icon based on type
  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: <Rocket className="w-5 h-5 text-accent animate-pulse" />,
          classes: 'bg-zinc-950/95 border border-accent/40 text-zinc-100 shadow-[0_0_20px_rgba(153,243,62,0.15)]',
          barColor: 'bg-accent'
        };
      case 'info':
        return {
          icon: <Clock className="w-5 h-5 text-blue-400" />,
          classes: 'bg-zinc-950/95 border border-blue-500/30 text-zinc-100 shadow-[0_0_20px_rgba(59,130,246,0.1)]',
          barColor: 'bg-blue-500'
        };
      case 'warn':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />,
          classes: 'bg-zinc-950/95 border border-amber-500/30 text-zinc-100 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
          barColor: 'bg-amber-500'
        };
      case 'error':
        return {
          icon: <Power className="w-5 h-5 text-rose-500" />,
          classes: 'bg-zinc-950/95 border border-rose-500/30 text-zinc-100 shadow-[0_0_20px_rgba(244,63,94,0.15)]',
          barColor: 'bg-rose-500'
        };
      case 'secondary':
        return {
          icon: <Code className="w-5 h-5 text-zinc-400" />,
          classes: 'bg-zinc-950/95 border border-zinc-800 text-zinc-300 shadow-md',
          barColor: 'bg-zinc-500'
        };
      case 'contrast':
        return {
          icon: <Hand className="w-5 h-5 text-zinc-950" />,
          classes: 'bg-white border border-zinc-200 text-zinc-950 shadow-2xl',
          barColor: 'bg-zinc-950'
        };
    }
  };

  return (
    <NotificationContext.Provider
      value={{ showSuccess, showInfo, showWarn, showError, showSecondary, showContrast }}
    >
      {children}

      {/* Toast Render Area */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => {
            const style = getNotificationStyle(n.type);
            return (
              <ToastItem
                key={n.id}
                notification={n}
                style={style}
                onClose={() => removeNotification(n.id)}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

interface ToastItemProps {
  key?: string;
  notification: Notification;
  style: any;
  onClose: () => void;
}

function ToastItem({
  notification,
  style,
  onClose,
}: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, notification.duration || 5000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className={cn(
        "p-4 rounded-2xl relative flex gap-3.5 shadow-xl select-none pointer-events-auto overflow-hidden",
        style.classes
      )}
    >
      {/* Visual background indicator bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[4px]", style.barColor)}></div>

      {/* Toast Content */}
      <div className="pl-1 flex-1 flex gap-3.5">
        <div className="mt-0.5 shrink-0 select-none">
          {style.icon}
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <h4 className="font-semibold text-sm leading-tight text-inherit select-text">
            {notification.title}
          </h4>
          <p className="text-xs leading-relaxed text-zinc-400 select-text">
            {notification.message}
          </p>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className={cn(
          "shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors border aspect-square cursor-pointer",
          notification.type === 'contrast'
            ? "border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
            : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
        )}
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress timer bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (notification.duration || 5000) / 1000, ease: 'linear' }}
        className={cn("absolute bottom-0 left-0 h-[2px] opacity-60", style.barColor)}
      />
    </motion.div>
  );
}
