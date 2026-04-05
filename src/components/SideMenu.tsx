import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { AnimatePresence, motion } from 'motion/react';

interface SideMenuProps {
  roomId?: string | null;
  isLocalMode?: boolean;
  onLeave?: () => void;
}

export default function SideMenu({ roomId, isLocalMode, onLeave }: SideMenuProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />
          <motion.div
            ref={menuRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-[100dvh] w-72 max-w-[80vw] bg-[#041424] border-l border-[#1b2b3b] shadow-2xl z-[100] flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-[#1b2b3b]">
              <h2 className="text-xl font-serif text-[#fabd04] font-bold">{t('app.options')}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#d3e4fa]/60 hover:text-[#d3e4fa] p-1 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-visible p-6 flex flex-col gap-8">
              {/* Room Info */}
              {(roomId || isLocalMode) && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-[#d3e4fa]/40 uppercase tracking-wider">{t('app.room')}</h3>
                  {roomId && roomId !== 'LOCAL_GAME' && (
                    <div className="flex items-center justify-between bg-[#1b2b3b]/50 p-3 rounded-xl border border-[#1b2b3b]">
                      <span className="text-[#d3e4fa]/80">{t('app.code')}</span>
                      <span className="font-mono text-[#fabd04] tracking-widest [font-variant-numeric:slashed-zero] font-bold">
                        #{roomId}
                      </span>
                    </div>
                  )}
                  {isLocalMode && (
                    <div className="flex items-center justify-between bg-[#1b2b3b]/50 p-3 rounded-xl border border-[#1b2b3b]">
                      <span className="text-[#d3e4fa]/80">{t('app.mode')}</span>
                      <span className="text-[#fabd04] font-bold">
                        {t('join.localMode')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Language */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-[#d3e4fa]/40 uppercase tracking-wider">{t('app.language')}</h3>
                <div className="flex justify-start">
                  <LanguageSelector />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            {onLeave && (
              <div className="p-6 border-t border-[#1b2b3b]">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLeave();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#ffb3ae]/10 hover:bg-[#ffb3ae]/20 text-[#ffb3ae] py-3 rounded-xl transition-colors font-bold"
                >
                  <span className="material-symbols-outlined">logout</span>
                  {t('app.leaveRoom')}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[#d3e4fa] hover:bg-[#1b2b3b] p-2 rounded-full transition-colors flex items-center justify-center"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
      {createPortal(drawerContent, document.body)}
    </>
  );
}
