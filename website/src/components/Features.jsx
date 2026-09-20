'use client';

import { Zap, WifiOff, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Features() {
  const { t } = useLanguage();
  const featureIcons = [Zap, WifiOff, ShieldCheck];

  return (
    <section id="features" className="py-12 sm:py-16 relative">
      <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
            {t.features.title}{' '}
            <span className="text-gradient-cyan">{t.features.titleHighlight}</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            {t.features.subtitle}
          </p>
        </div>

        {/* Features 3-Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {t.features.items.map((feat, idx) => {
            const Icon = featureIcons[idx] || Zap;
            return (
              <div
                key={idx}
                className="rounded-2xl p-6 border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-all flex flex-col justify-start"
              >
                <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 shrink-0 shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
