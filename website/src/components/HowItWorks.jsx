'use client';

import { QrCode, Wifi, Send, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HowItWorks() {
  const { t, dir } = useLanguage();
  const stepIcons = [QrCode, Wifi, Send];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-slate-900/20 border-y border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold mb-4">
            {t.howItWorks.badge}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            {t.howItWorks.title} <span className="text-gradient-cyan">{t.howItWorks.titleGradient}</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            {t.howItWorks.subtitle}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {t.howItWorks.steps.map((step, idx) => {
            const Icon = stepIcons[idx] || QrCode;
            return (
              <div
                key={idx}
                className="relative glass-card rounded-3xl p-8 flex flex-col justify-between group hover:border-sky-500/30 transition-all duration-300"
              >
                {/* Step Number Top Badge */}
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-4xl font-black text-slate-800 group-hover:text-slate-700 font-outfit transition-colors">
                    {step.num}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-sky-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Step Indicator */}
                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center gap-2 text-xs font-semibold text-sky-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t.howItWorks.stepBadge}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
