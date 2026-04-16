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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            className="bg-[#1b2b3b] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#44474c]/30"
          >
            <h3 className="text-2xl font-serif font-bold text-[#fabd04] mb-4">{title}</h3>
            <p className="font-sans text-[#d3e4fa] mb-8 leading-relaxed">{message}</p>
            
            <div className="flex justify-end gap-3 font-sans">
              <button 
                onClick={onCancel} 
                className="px-6 py-2.5 rounded-full font-bold text-[#d3e4fa] hover:bg-[#c4c6cc]/10 active:scale-95 transition-all outline-none"
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm} 
                className={`px-6 py-2.5 rounded-full font-bold active:scale-95 transition-all shadow-lg outline-none flex items-center gap-2 ${
                  isDestructive 
                    ? 'bg-[#ffb3ae] text-[#261a00] hover:bg-[#ffc2be] shadow-[#ffb3ae]/20' 
                    : 'bg-[#fabd04] text-[#261a00] hover:bg-[#ffc61a] shadow-[#fabd04]/20'
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
