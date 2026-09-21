'use client';

import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-8 sm:py-12 px-4 sm:px-6 text-slate-400 relative">
      <div className="max-w-4xl lg:max-w-5xl mx-auto rounded-2xl sm:rounded-full bg-slate-950/85 border border-slate-800/80 backdrop-blur-2xl shadow-xl shadow-black/50 px-5 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-4">
        
        {/* Navigation Links */}
        <div className="flex items-center gap-5 sm:gap-8 text-xs sm:text-sm font-medium">
          <a 
            href="#how-it-works" 
            className="text-slate-400 hover:text-white transition-colors duration-200"
          >
            {t.nav.howItWorks}
          </a>
          <a 
            href="#features" 
            className="text-slate-400 hover:text-white transition-colors duration-200"
          >
            {t.nav.features}
          </a>
          <a 
            href="#faq" 
            className="text-slate-400 hover:text-white transition-colors duration-200"
          >
            {t.nav.faq}
          </a>
        </div>

        {/* Back to Top Action */}
        <button
          onClick={scrollToTop}
          title="Scroll to Top"
          aria-label="Scroll to top"
          className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700 transition-all duration-200 flex items-center gap-1.5 text-xs font-medium active:scale-95 shrink-0"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Top</span>
        </button>

      </div>
    </footer>
  );
}
