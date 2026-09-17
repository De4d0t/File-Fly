'use client';

import { Github, ArrowUp, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 text-slate-400 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/60">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/icon.svg" alt="FileFly" className="w-10 h-10 object-contain drop-shadow-md shrink-0" />
              <span className="text-2xl font-black text-white font-outfit">FileFly</span>
            </div>
            
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              {t.footer.description}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                {t.footer.privacyBadge}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                {t.footer.speedBadge}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{t.footer.quickLinks}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors">{t.nav.features}</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">{t.nav.howItWorks}</a>
              </li>
              <li>
                <a href="#download" className="hover:text-white transition-colors">{t.nav.download}</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">{t.nav.faq}</a>
              </li>
            </ul>
          </div>

          {/* Developer & Community */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{t.footer.devCommunity}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://github.com/De4d0t/File-Fly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span>{t.footer.githubRepo}</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/De4d0t/File-Fly/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t.footer.releases}
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/De4d0t/File-Fly/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t.footer.issues}
                </a>
              </li>
              <li>
                <span className="text-xs text-slate-500 font-mono">{t.footer.license}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <span>{t.footer.developedBy}</span>
            <a
              href="https://github.com/De4d0t"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 font-bold transition-colors"
            >
              De4d0t
            </a>
            <span>• {t.footer.rights} {new Date().getFullYear()}</span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
          >
            <span>{t.footer.backToTop}</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
