import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { AnimatePresence, motion } from 'motion/react';
import { Haptics, NotificationType } from '@capacitor/haptics';

interface SideMenuProps {
  roomId?: string | null;
  isLocalMode?: boolean;
  onLeave?: () => void;
  onOpenPrivacy?: () => void;
}

export default function SideMenu({ roomId, isLocalMode, onLeave, onOpenPrivacy }: SideMenuProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
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

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText('http://skull-king-scorer-mu.vercel.app/');
      setShowCopied(true);
      Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

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
                aria-label={t('app.close')}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              {/* Language */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-[#d3e4fa]/40 uppercase tracking-wider">{t('app.language')}</h3>
                <div className="flex justify-start">
                  <LanguageSelector />
                </div>
              </div>

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

              {/* Spacer to push content down */}
              <div className="flex-1" />

              {/* Get App */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-[#d3e4fa]/40 uppercase tracking-wider">{t('app.getApp')}</h3>
                
                <div className="relative group">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.javiermorilla.skullking"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 135 40" className="w-full h-auto drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="21.8" y1="33.29" x2="5.017" y2="16.508" gradientTransform="matrix(1 0 0 -1 0 42)">
                          <stop offset="0" stopColor="#00a0ff"/>
                          <stop offset=".007" stopColor="#00a1ff"/>
                          <stop offset=".26" stopColor="#00beff"/>
                          <stop offset=".512" stopColor="#00d2ff"/>
                          <stop offset=".76" stopColor="#00dfff"/>
                          <stop offset="1" stopColor="#00e3ff"/>
                        </linearGradient>
                        <linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="33.834" y1="21.999" x2="9.637" y2="21.999" gradientTransform="matrix(1 0 0 -1 0 42)">
                          <stop offset="0" stopColor="#ffe000"/>
                          <stop offset=".409" stopColor="#ffbd00"/>
                          <stop offset=".775" stopColor="orange"/>
                          <stop offset="1" stopColor="#ff9c00"/>
                        </linearGradient>
                        <linearGradient id="SVGID_3_" gradientUnits="userSpaceOnUse" x1="24.827" y1="19.704" x2="2.069" y2="-3.054" gradientTransform="matrix(1 0 0 -1 0 42)">
                          <stop offset="0" stopColor="#ff3a44"/>
                          <stop offset="1" stopColor="#c31162"/>
                        </linearGradient>
                        <linearGradient id="SVGID_4_" gradientUnits="userSpaceOnUse" x1="7.297" y1="41.824" x2="17.46" y2="31.661" gradientTransform="matrix(1 0 0 -1 0 42)">
                          <stop offset="0" stopColor="#32a071"/>
                          <stop offset=".069" stopColor="#2da771"/>
                          <stop offset=".476" stopColor="#15cf74"/>
                          <stop offset=".801" stopColor="#06e775"/>
                          <stop offset="1" stopColor="#00f076"/>
                        </linearGradient>
                      </defs>
                      <path d="M130 40H5c-2.8 0-5-2.2-5-5V5c0-2.8 2.2-5 5-5h125c2.8 0 5 2.2 5 5v30c0 2.8-2.2 5-5 5z"/>
                      <path fill="#a6a6a6" d="M130 .8c2.3 0 4.2 1.9 4.2 4.2v30c0 2.3-1.9 4.2-4.2 4.2H5C2.7 39.2.8 37.3.8 35V5C.8 2.7 2.7.8 5 .8h125m0-.8H5C2.2 0 0 2.3 0 5v30c0 2.8 2.2 5 5 5h125c2.8 0 5-2.2 5-5V5c0-2.7-2.2-5-5-5z"/>
                      <path fill="#fff" stroke="#ffffff" strokeWidth=".2" strokeMiterlimit="10" d="M47.4 10.2c0 .8-.2 1.5-.7 2-.6.6-1.3.9-2.2.9-.9 0-1.6-.3-2.2-.9-.6-.6-.9-1.3-.9-2.2 0-.9.3-1.6.9-2.2.6-.6 1.3-.9 2.2-.9.4 0 .8.1 1.2.3.4.2.7.4.9.7l-.5.5c-.4-.5-.9-.7-1.6-.7-.6 0-1.2.2-1.6.7-.5.4-.7 1-.7 1.7s.2 1.3.7 1.7c.5.4 1 .7 1.6.7.7 0 1.2-.2 1.7-.7.3-.3.5-.7.5-1.2h-2.2v-.8h2.9v.4zM52 7.7h-2.7v1.9h2.5v.7h-2.5v1.9H52v.8h-3.5V7H52v.7zM55.3 13h-.8V7.7h-1.7V7H57v.7h-1.7V13zM59.9 13V7h.8v6h-.8zM64.1 13h-.8V7.7h-1.7V7h4.1v.7H64V13zM73.6 12.2c-.6.6-1.3.9-2.2.9-.9 0-1.6-.3-2.2-.9-.6-.6-.9-1.3-.9-2.2s.3-1.6.9-2.2c.6-.6 1.3-.9 2.2-.9.9 0 1.6.3 2.2.9.6.6.9 1.3.9 2.2 0 .9-.3 1.6-.9 2.2zm-3.8-.5c.4.4 1 .7 1.6.7.6 0 1.2-.2 1.6-.7.4-.4.7-1 .7-1.7s-.2-1.3-.7-1.7c-.4-.4-1-.7-1.6-.7-.6 0-1.2.2-1.6.7-.4.4-.7 1-.7 1.7s.2 1.3.7 1.7zM75.6 13V7h.9l2.9 4.7V7h.8v6h-.8l-3.1-4.9V13h-.7z"/>
                      <path fill="#fff" d="M68.1 21.8c-2.4 0-4.3 1.8-4.3 4.3 0 2.4 1.9 4.3 4.3 4.3s4.3-1.8 4.3-4.3c0-2.6-1.9-4.3-4.3-4.3zm0 6.8c-1.3 0-2.4-1.1-2.4-2.6s1.1-2.6 2.4-2.6c1.3 0 2.4 1 2.4 2.6 0 1.5-1.1 2.6-2.4 2.6zm-9.3-6.8c-2.4 0-4.3 1.8-4.3 4.3 0 2.4 1.9 4.3 4.3 4.3s4.3-1.8 4.3-4.3c0-2.6-1.9-4.3-4.3-4.3zm0 6.8c-1.3 0-2.4-1.1-2.4-2.6s1.1-2.6 2.4-2.6c1.3 0 2.4 1 2.4 2.6 0 1.5-1.1 2.6-2.4 2.6zm-11.1-5.5v1.8H52c-.1 1-.5 1.8-1 2.3-.6.6-1.6 1.3-3.3 1.3-2.7 0-4.7-2.1-4.7-4.8s2.1-4.8 4.7-4.8c1.4 0 2.5.6 3.3 1.3l1.3-1.3c-1.1-1-2.5-1.8-4.5-1.8-3.6 0-6.7 3-6.7 6.6 0 3.6 3.1 6.6 6.7 6.6 2 0 3.4-.6 4.6-1.9 1.2-1.2 1.6-2.9 1.6-4.2 0-.4 0-.8-.1-1.1h-6.2zm45.4 1.4c-.4-1-1.4-2.7-3.6-2.7s-4 1.7-4 4.3c0 2.4 1.8 4.3 4.2 4.3 1.9 0 3.1-1.2 3.5-1.9l-1.4-1c-.5.7-1.1 1.2-2.1 1.2s-1.6-.4-2.1-1.3l5.7-2.4-.2-.5zm-5.8 1.4c0-1.6 1.3-2.5 2.2-2.5.7 0 1.4.4 1.6.9l-3.8 1.6zM82.6 30h1.9V17.5h-1.9V30zm-3-7.3c-.5-.5-1.3-1-2.3-1-2.1 0-4.1 1.9-4.1 4.3s1.9 4.2 4.1 4.2c1 0 1.8-.5 2.2-1h.1v.6c0 1.6-.9 2.5-2.3 2.5-1.1 0-1.9-.8-2.1-1.5l-1.6.7c.5 1.1 1.7 2.5 3.8 2.5 2.2 0 4-1.3 4-4.4V22h-1.8v.7zm-2.2 5.9c-1.3 0-2.4-1.1-2.4-2.6s1.1-2.6 2.4-2.6c1.3 0 2.3 1.1 2.3 2.6s-1 2.6-2.3 2.6zm24.4-11.1h-4.5V30h1.9v-4.7h2.6c2.1 0 4.1-1.5 4.1-3.9s-2-3.9-4.1-3.9zm.1 6h-2.7v-4.3h2.7c1.4 0 2.2 1.2 2.2 2.1-.1 1.1-.9 2.2-2.2 2.2zm11.5-1.8c-1.4 0-2.8.6-3.3 1.9l1.7.7c.4-.7 1-.9 1.7-.9 1 0 1.9.6 2 1.6v.1c-.3-.2-1.1-.5-1.9-.5-1.8 0-3.6 1-3.6 2.8 0 1.7 1.5 2.8 3.1 2.8 1.3 0 1.9-.6 2.4-1.2h.1v1h1.8v-4.8c-.2-2.2-1.9-3.5-4-3.5zm-.2 6.9c-.6 0-1.5-.3-1.5-1.1 0-1 1.1-1.3 2-1.3.8 0 1.2.2 1.7.4-.2 1.2-1.2 2-2.2 2zm10.5-6.6l-2.1 5.4h-.1l-2.2-5.4h-2l3.3 7.6-1.9 4.2h1.9l5.1-11.8h-2zm-16.8 8h1.9V17.5h-1.9V30z"/>
                      <g>
                        <path fill="url(#SVGID_1_)" d="M10.4 7.5c-.3.3-.4.8-.4 1.4V31c0 .6.2 1.1.5 1.4l.1.1L23 20.1v-.2L10.4 7.5z"/>
                        <path fill="url(#SVGID_2_)" d="M27 24.3l-4.1-4.1V19.9l4.1-4.1.1.1 4.9 2.8c1.4.8 1.4 2.1 0 2.9l-5 2.7z"/>
                        <path fill="url(#SVGID_3_)" d="M27.1 24.2L22.9 20 10.4 32.5c.5.5 1.2.5 2.1.1l14.6-8.4"/>
                        <path fill="url(#SVGID_4_)" d="M27.1 15.8L12.5 7.5c-.9-.5-1.6-.4-2.1.1L22.9 20l4.2-4.2z"/>
                        <path opacity=".2" d="M27 24.1l-14.5 8.2c-.8.5-1.5.4-2 0l-.1.1.1.1c.5.4 1.2.5 2 0L27 24.1z"/>
                        <path opacity=".12" d="M10.4 32.3c-.3-.3-.4-.8-.4-1.4v.1c0 .6.2 1.1.5 1.4v-.1h-.1zM32 21.3l-5 2.8.1.1 4.9-2.8c.7-.4 1-.9 1-1.4 0 .5-.4.9-1 1.3z"/>
                        <path opacity=".25" fill="#fff" d="M12.5 7.6L32 18.7c.6.4 1 .8 1 1.3 0-.5-.3-1-1-1.4L12.5 7.5c-1.4-.8-2.5-.2-2.5 1.4V9c0-1.5 1.1-2.2 2.5-1.4z"/>
                      </g>
                    </svg>
                  </a>
                </div>

                <button
                  onClick={handleCopyUrl}
                  className="flex items-center justify-between bg-[#1b2b3b]/50 hover:bg-[#1b2b3b] p-3 rounded-xl border border-[#1b2b3b] transition-all group w-full"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#c4c6cc] group-hover:text-[#d3e4fa] transition-colors">share</span>
                    <span className="text-[#d3e4fa]/90 text-sm font-medium">{t('app.share')}</span>
                  </div>
                  {showCopied && (
                    <motion.span 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-mono text-[#fabd04] font-bold uppercase tracking-widest"
                    >
                      {t('app.copied')}
                    </motion.span>
                  )}
                </button>
              </div>

              {/* Support */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-[#d3e4fa]/40 uppercase tracking-wider">{t('app.support')}</h3>
                <a
                  href="https://ko-fi.com/morigoll"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-[#1b2b3b]/50 hover:bg-[#1b2b3b] p-3 rounded-xl border border-[#1b2b3b] transition-all group"
                >
                  <div className="w-6 h-6 group-hover:scale-110 transition-transform flex items-center justify-center">
                    <svg 
                      id="Layer_1" 
                      data-name="Layer 1" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 504.36 504.36"
                      className="w-full h-full"
                    >
                      <defs>
                        <linearGradient id="ko-fi-gradient" x1="163.6" y1="2319.39" x2="216.72" y2="2482.47" gradientTransform="translate(4.26 -2219.68)" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stopColor="#ff4ea3"/>
                          <stop offset="1" stopColor="#ff5e5b"/>
                        </linearGradient>
                      </defs>
                      <title>ko-fi</title>
                      <circle fill="#00b9fe" cx="252.18" cy="252.18" r="252.18"/>
                      <g id="Layer_1-2" data-name="Layer 1-2">
                        <g id="Layer_1-3" data-name="Layer 1-3">
                          <path 
                            fill="#fff" 
                            stroke="#000" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="1.14" 
                            d="M380.19,276.5A196.26,196.26,0,0,1,352,277.78V185.62h19.2a38.37,38.37,0,0,1,32,15.36,45.65,45.65,0,0,1,10.24,29.44A42.87,42.87,0,0,1,380.19,276.5Zm79.37-64a83.86,83.86,0,0,0-37.13-57.61A98.23,98.23,0,0,0,366.11,137H84.49a16.37,16.37,0,0,0-14.08,15.36v3.84s-1.28,124.17,1.28,192a42.11,42.11,0,0,0,42.24,39.68s129.29,0,190.73-1.28h9c35.84-9,38.4-42.24,38.4-60.16C422.43,329,472.36,279.06,459.56,212.5Z"
                          />
                          <path 
                            fill="#ff5e5b" 
                            d="M208.66,334.11c3.84,1.28,5.12,0,5.12,0s44.8-41,65.28-65.29c17.92-21.76,19.2-56.32-11.52-70.4s-56.32,15.36-56.32,15.36a50.44,50.44,0,0,0-70.41-7.68l-1.28,1.28c-15.36,16.64-10.24,44.8,1.28,60.16a771.87,771.87,0,0,0,65.29,64Z"
                          />
                          <path 
                            fill="url(#ko-fi-gradient)" 
                            d="M211.22,335.39a4.75,4.75,0,0,0,3.84-1.28s44.8-41,65.28-65.29c17.92-21.76,19.2-56.32-11.52-70.4s-56.32,15.36-56.32,15.36a50.44,50.44,0,0,0-70.41-7.68l-1.28,1.28c-15.36,16.64-10.24,44.8,1.28,60.16a799.58,799.58,0,0,0,66.57,65.29C208.66,335.39,209.94,335.39,211.22,335.39Z"
                          />
                        </g>
                      </g>
                    </svg>
                  </div>
                  <span className="text-[#d3e4fa]/90 text-sm font-medium">{t('app.donate')}</span>
                </a>
              </div>

              {/* Privacy Policy */}
              <div className="flex flex-col gap-3">
                <a
                  href="/privacy"
                  onClick={(e) => {
                    const isApp = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
                    if (!isApp && !window.location.href.includes('localhost')) {
                       // En web, mejor abrir en pestaña nueva
                       e.preventDefault();
                       window.open('/privacy', '_blank');
                    }
                  }}
                  className="flex items-center gap-3 bg-[#1b2b3b]/30 hover:bg-[#1b2b3b]/50 p-3 rounded-xl border border-[#1b2b3b] transition-all group text-left w-full"
                >
                  <span className="material-symbols-outlined text-[#d3e4fa]/40 group-hover:text-[#fabd04] transition-colors">description</span>
                  <span className="text-[#d3e4fa]/80 text-sm">{t('app.privacy')}</span>
                </a>
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
        aria-label={t('app.options')}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
      {createPortal(drawerContent, document.body)}
    </>
  );
}
