'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    const saved = localStorage.getItem('filefly_lang');
    if (saved === 'ar' || saved === 'en') {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    const dir = translations[lang]?.dir || 'rtl';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    localStorage.setItem('filefly_lang', lang);
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = translations[lang] || translations.ar;
  const dir = t.dir;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, dir }}>
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
