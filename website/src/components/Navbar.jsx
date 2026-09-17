'use client';

import { useState, useEffect } from 'react';
import { Download, Github, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { lang, toggleLang, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'py-3 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl shadow-black/50' 
        : 'py-5 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <img 
              src="/icon.svg" 
              alt="FileFly" 
              className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform shrink-0" 
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white font-outfit">FileFly</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  v1.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">{t.nav.tagline}</span>
            </div>
          </a>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Language Switcher Button */}
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all hover:border-slate-700"
              title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* GitHub Repository Link */}
            <a
              href="https://github.com/De4d0t/File-Fly"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-center hover:border-slate-700"
              title="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>

            {/* Main Download CTA Button */}
            <a
              href="#download"
              className="relative inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{t.nav.downloadBtn}</span>
            </a>

          </div>

        </div>
      </div>
    </header>
  );
}
