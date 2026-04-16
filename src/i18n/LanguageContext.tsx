import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from './translations';

export type Language = 'es' | 'en' | 'de' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.es, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('skullking_lang');
    if (saved === 'es' || saved === 'en' || saved === 'de' || saved === 'fr') return saved;
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('de')) return 'de';
    if (browserLang.startsWith('fr')) return 'fr';
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('skullking_lang', language);
  }, [language]);

  const t = useCallback((key: keyof typeof translations.es, params?: Record<string, string | number>) => {
    let text = translations[language][key] || translations['es'][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        // Use a global regex for replacing all occurrences (case sensitive as key)
        const regex = new RegExp(`\\{${k}\\}`, 'g');
        text = text.replace(regex, String(v));
      });
    }
    return text;
  }, [language]);

  const contextValue = React.useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
