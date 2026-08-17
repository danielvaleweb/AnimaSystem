import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: ConfirmationModalProps) {
  
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      default:
        return <HelpCircle className="w-6 h-6 text-accent" />;
    }
  };

  const getConfirmButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-sm';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-black font-bold';
      default:
        return 'bg-accent hover:bg-accent/90 text-black font-bold';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-white border border-zinc-200 shrink-0 shadow-sm">
                {getIcon()}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-black tracking-tight leading-none">
                  {title}
                </h3>
                <p className="text-sm text-zinc-500 font-light leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 transition-all text-xs font-semibold tracking-wide cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-5 py-2.5 rounded-full transition-all text-xs font-semibold tracking-wide cursor-pointer ${getConfirmButtonStyles()}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
