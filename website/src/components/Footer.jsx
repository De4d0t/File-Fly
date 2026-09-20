'use client';

import { Github } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="py-6 sm:py-10 px-4 sm:px-6 text-slate-400 relative">
      <div className="max-w-4xl lg:max-w-5xl mx-auto rounded-2xl sm:rounded-3xl bg-slate-950/90 border border-slate-800/80 backdrop-blur-xl shadow-xl px-5 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
        
        {/* Brand & Rights Info */}
        <div className="flex items-center gap-3">
          <img 
            src="/icon.svg" 
            alt="FileFly" 
            width="32" 
            height="32" 
            className="w-8 h-8 object-contain drop-shadow-md shrink-0" 
          />
          <div className="flex flex-col">
            <span className="text-base font-black text-white font-outfit leading-tight">FileFly</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>{t.footer.developedBy}</span>
              <a
                href="https://github.com/De4d0t"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 font-bold transition-colors"
              >
                De4d0t
              </a>
              <span>• {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium">
          <a href="#how-it-works" className="hover:text-white transition-colors">
            {t.nav.howItWorks}
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            {t.nav.features}
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            {t.nav.faq}
          </a>
          <a
            href="https://github.com/De4d0t/File-Fly"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>

      </div>
    </footer>
  );
}
