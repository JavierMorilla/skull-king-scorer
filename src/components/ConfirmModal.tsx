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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#000f1e]/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            className="bg-[#1b2b3b] border border-[#44474c]/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <h3 className="font-serif text-2xl font-bold text-[#d3e4fa] mb-2">{title}</h3>
            <p className="font-sans text-[#c4c6cc] mb-8">{message}</p>
            <div className="flex gap-3">
              <button 
                onClick={onCancel} 
                className="flex-1 py-3 rounded-xl font-sans font-semibold text-[#d3e4fa] bg-[#263647] hover:bg-[#2b3b4b] active:scale-95 transition-all"
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm} 
                className={`flex-1 py-3 rounded-xl font-sans font-bold active:scale-95 transition-all ${
                  isDestructive 
                    ? 'bg-[#93000a] text-[#ffdad6] hover:bg-[#ba1a1a]' 
                    : 'bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] hover:scale-[0.98]'
                }`}
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
