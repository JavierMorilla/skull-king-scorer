import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'info' | 'error' | 'success';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-[calc(5.5rem+var(--safe-area-top))] left-1/2 -translate-x-1/2 z-toast flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
              onClick={() => removeToast(toast.id)}
              className={`pointer-events-auto cursor-pointer p-4 rounded-2xl shadow-xl flex items-center gap-3 border backdrop-blur-md bg-cabin-slate/90 active:scale-[0.98] transition-transform ${
                toast.type === 'error'
                  ? 'border-coral/30 shadow-coral/10'
                  : toast.type === 'success'
                  ? 'border-gold/30 shadow-gold/10'
                  : 'border-slate-mist/30 shadow-abyssal-deep/10'
              }`}
            >
              {toast.type === 'error' && (
                <span className="material-symbols-outlined text-coral text-2xl shrink-0">
                  error
                </span>
              )}
              {toast.type === 'success' && (
                <span className="material-symbols-outlined text-gold text-2xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              )}
              {toast.type === 'info' && (
                <span className="material-symbols-outlined text-ice text-2xl shrink-0">
                  info
                </span>
              )}
              <span className="text-ice font-sans font-medium text-sm leading-snug">
                {toast.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
