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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            className="bg-surface rounded-3xl p-6 max-w-sm w-full elevation-3"
          >
            <h3 className="text-2xl font-bold text-on-surface mb-4">{title}</h3>
            <p className="text-on-surface-variant mb-8">{message}</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={onCancel} 
                className="px-6 py-2.5 rounded-full font-medium text-primary hover:bg-primary/10 active:bg-primary/20 transition-colors"
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm} 
                className={`px-6 py-2.5 rounded-full font-medium transition-colors ${
                  isDestructive 
                    ? 'bg-error text-on-error hover:bg-error/90 active:bg-error/80' 
                    : 'bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/80'
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
