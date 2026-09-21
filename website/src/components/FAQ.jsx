'use client';

import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function FAQ() {
  const { t } = useLanguage();

  return (
    <section id="faq" className="py-16 sm:py-24 relative overflow-hidden">
      {/* Subtle Background Glow Accent */}
      <div className="ambient-glow-cyan top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none" />

      <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3">
            {t.faq.title}
          </h2>
          {t.faq.subtitle && (
            <p className="text-sm sm:text-base text-slate-400 font-normal max-w-lg mx-auto leading-relaxed">
              {t.faq.subtitle}
            </p>
          )}
        </div>

        {/* Stacked Accordion List using Native Details & Summary */}
        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
          {t.faq.items.map((faq, idx) => (
            <details
              key={idx}
              open={idx === 0}
              className="group rounded-2xl border border-slate-800/80 bg-slate-900/30 hover:border-slate-700/80 hover:bg-slate-900/50 open:border-sky-500/40 open:bg-slate-900/80 open:shadow-xl open:shadow-sky-500/5 open:ring-1 open:ring-sky-500/20 transition-all duration-200 backdrop-blur-xl overflow-hidden"
            >
              <summary className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3 sm:gap-3.5">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors shrink-0 bg-slate-900/80 text-slate-500 border-slate-800 group-hover:text-slate-300 group-open:bg-sky-500/15 group-open:text-sky-400 group-open:border-sky-500/30">
                    0{idx + 1}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-200 group-hover:text-white group-open:text-white transition-colors leading-snug">
                    {faq.q}
                  </span>
                </div>

                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 bg-slate-900/80 text-slate-400 border-slate-800 group-hover:text-white group-hover:border-slate-700 group-open:bg-sky-500/15 group-open:text-sky-400 group-open:border-sky-500/30 group-open:rotate-180">
                  <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                </div>
              </summary>

              <div className="px-4 sm:px-5 pb-5 pt-2 text-xs sm:text-sm text-slate-300/90 leading-relaxed border-t border-slate-800/50 pl-4 sm:pl-[3.75rem]">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

      </div>
    </section>
  );
}
