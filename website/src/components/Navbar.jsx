'use client';

import { useState, useEffect } from 'react';
import { Github, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      dir="ltr"
      className="fixed top-3 sm:top-4 left-0 right-0 z-50 px-4 sm:px-6 transition-all duration-300 pointer-events-none"
    >
      <div className={`max-w-4xl lg:max-w-5xl mx-auto px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl sm:rounded-full transition-all duration-300 pointer-events-auto ${
        scrolled 
          ? 'bg-slate-950/90 backdrop-blur-2xl border border-slate-800 shadow-2xl shadow-black/80' 
          : 'bg-slate-950/70 backdrop-blur-xl border border-slate-800/70 shadow-lg shadow-black/40'
      }`}>
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <img 
              src="/icon.svg" 
              alt="FILE FLY" 
              width="40"
              height="40"
              className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform shrink-0" 
            />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white font-outfit leading-tight">FILE FLY</span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">{t.nav.tagline}</span>
            </div>
          </a>

          {/* Right Action Items */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Personal Website */}
            <a
              href="https://iq-cyborg.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-center hover:border-slate-700 active:scale-95"
              title="الموقع الإلكتروني (iq-cyborg.vercel.app)"
            >
              <Globe className="w-4 h-4" />
            </a>

            {/* Instagram Link */}
            <a
              href="https://instagram.com/3BF"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-center hover:border-slate-700 active:scale-95"
              title="Instagram (@3BF)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>

            {/* Telegram Link */}
            <a
              href="https://t.me/YYxYY"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-center hover:border-slate-700 active:scale-95"
              title="Telegram (@YYxYY)"
            >
              <svg viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4">
                <path d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.7c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284.8l-101.4-31.6c-22.1-6.9-22.4-22.1 4.6-32.7L422.6 77.1c18.4-6.9 24.1 4.1 24.1 21.5z" />
              </svg>
            </a>

            {/* GitHub Repository Link */}
            <a
              href="https://github.com/De4d0t/File-Fly"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-center hover:border-slate-700 active:scale-95"
              title="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>

          </div>

        </div>
      </div>
    </header>
  );
}
