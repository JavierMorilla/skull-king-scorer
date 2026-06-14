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
            className="bg-cabin-slate rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-mist/30 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <h3 className="text-2xl font-display font-bold text-gold mb-4">{title}</h3>
            <p className="font-sans text-ice mb-8 leading-relaxed">{message}</p>
            
            <div className="flex justify-end gap-3 font-sans">
              <button 
                onClick={onCancel} 
                className="px-6 py-2.5 min-h-11 flex items-center justify-center rounded-full font-bold text-ice hover:bg-slate-mist/10 active:scale-[0.97] transition-colors duration-150 outline-none"
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm} 
                className={`px-6 py-2.5 min-h-11 flex items-center justify-center rounded-full font-bold active:scale-[0.97] transition-[background-color,transform,box-shadow] duration-150 shadow-lg outline-none gap-2 ${
                  isDestructive 
                    ? 'bg-coral text-abyssal-deep hover:bg-coral-hover shadow-coral/20' 
                    : 'bg-gold text-abyssal-deep hover:bg-gold-hover shadow-gold/20'
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
