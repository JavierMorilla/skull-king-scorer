import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage, Language } from '../i18n/LanguageContext';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const languages = [
    { code: 'es', name: 'Español', flagUrl: 'https://flagcdn.com/es.svg' },
    { code: 'en', name: 'English', flagUrl: 'https://flagcdn.com/gb.svg' },
    { code: 'de', name: 'Deutsch', flagUrl: 'https://flagcdn.com/de.svg' },
    { code: 'fr', name: 'Français', flagUrl: 'https://flagcdn.com/fr.svg' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const updateCoords = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const portalContent = document.getElementById('lang-portal-content');
        if (portalContent && portalContent.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dropdownMenu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="lang-portal-content"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
          style={{
            position: 'fixed',
            top: coords.top + 8,
            left: coords.left,
            minWidth: '160px',
            zIndex: 'var(--z-dropdown)' as any,
            transformOrigin: 'top right'
          }}
          className="bg-cabin-slate border border-gold/30 rounded-xl shadow-2xl overflow-hidden"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as Language);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-11 ${language === lang.code
                  ? 'bg-gold/10 text-gold'
                  : 'text-ice hover:bg-cabin-slate/80'
                }`}
            >
              <img src={lang.flagUrl} alt={lang.name} className="w-5 h-auto rounded-[2px]" />
              <span className="font-sans text-sm font-bold">{lang.name}</span>
              {language === lang.code && (
                <span className="material-symbols-outlined text-sm ml-auto">check</span>
              )}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-cabin-slate/80 backdrop-blur-md border border-gold/30 px-3 py-2 min-h-11 rounded-xl text-ice hover:bg-cabin-slate transition-colors shadow-lg"
      >
        <img src={currentLang.flagUrl} alt={currentLang.name} className="w-5 h-auto rounded-[2px]" />
        <span className="font-mono text-sm font-bold uppercase tracking-wider hidden sm:block">{currentLang.code}</span>
        <span className="material-symbols-outlined text-sm text-apricot/60">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {createPortal(dropdownMenu, document.body)}
    </div>
  );
}
