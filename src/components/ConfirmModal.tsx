import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  onConfirm, 
  onCancel,
  isDestructive = false
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
            className="bg-cabin-slate rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-mist/10 max-h-[90vh] overflow-y-auto custom-scrollbar relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <h3 className="text-2xl font-sans font-bold text-gold mb-4 relative z-10">{title}</h3>
            <p className="font-sans text-ice mb-8 leading-relaxed relative z-10">{message}</p>
            
            <div className="flex justify-end gap-3 font-sans relative z-10">
              <button 
                onClick={onCancel} 
                className="px-5 py-2.5 min-h-11 flex items-center justify-center rounded-xl font-bold text-ice hover:bg-slate-mist/10 active:scale-[0.97] transition-all outline-none border border-slate-mist/5"
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm} 
                className={`px-5 py-2.5 min-h-11 flex items-center justify-center rounded-xl font-bold active:scale-[0.97] transition-all shadow-lg outline-none gap-2 ${
                  isDestructive 
                    ? 'bg-coral text-abyssal-deep hover:bg-coral-hover shadow-coral/20' 
                    : 'bg-gradient-to-r from-gold to-gold-hover text-abyssal-deep shadow-gold/20'
                }`}
              >
                {isDestructive && <span className="material-symbols-outlined text-[20px]">warning</span>}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
