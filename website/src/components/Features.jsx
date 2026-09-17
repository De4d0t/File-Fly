'use client';

import { Zap, ShieldCheck, WifiOff, QrCode, FolderArchive, Infinity as InfinityIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Features() {
  const { t, dir } = useLanguage();

  const icons = [Zap, ShieldCheck, WifiOff, QrCode, FolderArchive, InfinityIcon];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold mb-4">
            {t.features.badge}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            {t.features.title} <br />
            <span className="text-gradient-cyan">{t.features.titleGradient}</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            {t.features.subtitle}
          </p>
        </div>

        {/* Unified Minimalist Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.items.map((item, idx) => {
            const Icon = icons[idx] || Zap;
            return (
              <div
                key={idx}
                className="glass-card rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/30 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-500/15 transition-all shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 group-hover:border-slate-700 transition-colors">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-sky-300 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
