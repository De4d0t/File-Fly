'use client';

import { Laptop, QrCode, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HowItWorks() {
  const { t, dir } = useLanguage();
  const stepIcons = [Laptop, QrCode, Zap];

  return (
    <section id="how-it-works" className="py-12 sm:py-16 relative overflow-hidden">
      <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
            {t.howItWorks.title}{' '}
            <span className="text-gradient-cyan">{t.howItWorks.titleHighlight}</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            {t.howItWorks.subtitle}
          </p>
        </div>

        {/* Steps Grid (3 Equal Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 w-full">
          {t.howItWorks.steps.map((step, idx) => {
            const Icon = stepIcons[idx] || QrCode;
            return (
              <div
                key={idx}
                className="relative rounded-2xl p-6 flex flex-col justify-between border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all duration-200"
              >
                {/* Top Row: Step Number + Icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                    0{step.num}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {step.description}
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
