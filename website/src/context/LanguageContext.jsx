'use client';

import { createContext, useContext, useEffect } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  useEffect(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
    try {
      localStorage.removeItem('filefly_lang');
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  const lang = 'en';
  const dir = 'ltr';
  const t = translations.en;

  return (
    <LanguageContext.Provider value={{ lang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
