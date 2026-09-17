'use client';

import { Download, Laptop, Smartphone, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function DownloadSection() {
  const { t, dir } = useLanguage();

  return (
    <section id="download" className="py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="ambient-glow-blue bottom-10 left-1/2 -translate-x-1/2 opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold mb-4">
            {t.download.badge}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            {t.download.title} <span className="text-gradient-cyan">{t.download.titleGradient}</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            {t.download.subtitle}
          </p>
        </div>

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* 1. Windows Download Card (Featured) */}
          <div className="lg:col-span-1 rounded-3xl p-8 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-sky-500/40 shadow-2xl shadow-sky-500/10 flex flex-col justify-between relative group hover:border-sky-400 transition-all">
            
            {/* Recommended Tag */}
            <div className={`absolute -top-3.5 ${dir === 'rtl' ? 'right-6' : 'left-6'} px-3.5 py-1 rounded-full bg-sky-500 text-slate-950 text-xs font-extrabold shadow-md`}>
              {t.download.windowsCard.tag}
            </div>

            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Laptop className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{t.download.windowsCard.title}</h3>
                  <div className="text-xs text-slate-400 font-mono">{t.download.windowsCard.version}</div>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                {t.download.windowsCard.description}
              </p>

              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                {t.download.windowsCard.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <a
                href="https://github.com/De4d0t/File-Fly/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5" />
                <span>{t.download.windowsCard.btn}</span>
              </a>
              <div className="text-[11px] text-slate-500 text-center mt-2 font-mono">
                {t.download.windowsCard.meta}
              </div>
            </div>

          </div>

          {/* 2. Mobile & PWA Card */}
          <div className="lg:col-span-1 glass-card rounded-3xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Smartphone className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{t.download.mobileCard.title}</h3>
                  <div className="text-xs text-slate-400">{t.download.mobileCard.platforms}</div>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                {t.download.mobileCard.description}
              </p>

              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                {t.download.mobileCard.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xs font-bold text-white mb-1">{t.download.mobileCard.hintTitle}</div>
              <div className="text-[12px] text-slate-400 leading-normal">
                {t.download.mobileCard.hintDesc}
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
