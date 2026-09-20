'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function FAQ() {
  const [openIndices, setOpenIndices] = useState([]);
  const { t } = useLanguage();

  const toggleFAQ = (idx) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const mid = Math.ceil(t.faq.items.length / 2);
  const col1 = t.faq.items.slice(0, mid);
  const col2 = t.faq.items.slice(mid);

  return (
    <section id="faq" className="py-14 sm:py-20 relative">
      <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
            {t.faq.title}
          </h2>
          {t.faq.subtitle && (
            <p className="text-sm sm:text-base text-slate-400 font-normal">
              {t.faq.subtitle}
            </p>
          )}
        </div>

        {/* 2-Column FAQ Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
          
          {/* Column 1 */}
          <div className="space-y-4 sm:space-y-5">
            {col1.map((faq, index) => {
              const idx = index;
              const isOpen = openIndices.includes(idx);
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-300 backdrop-blur-sm overflow-hidden ${
                    isOpen
                      ? 'border-slate-700/90 bg-slate-900/70 shadow-lg shadow-black/30'
                      : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700/80 hover:bg-slate-900/50'
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-3.5 group cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 shrink-0 mt-0.5">
                        0{idx + 1}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-white group-hover:text-sky-300 transition-colors leading-snug">
                        {faq.q}
                      </span>
                    </div>
                    <div className={`w-7 h-7 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center shrink-0 transition-all duration-300 mt-0.5 ${
                      isOpen ? 'rotate-45 text-sky-400 border-sky-500/30 bg-sky-500/10' : 'text-slate-400 group-hover:text-white group-hover:border-slate-700'
                    }`}>
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-300/90 leading-relaxed pt-0 pl-11 sm:pl-12">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Column 2 */}
          <div className="space-y-4 sm:space-y-5">
            {col2.map((faq, index) => {
              const idx = mid + index;
              const isOpen = openIndices.includes(idx);
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-300 backdrop-blur-sm overflow-hidden ${
                    isOpen
                      ? 'border-slate-700/90 bg-slate-900/70 shadow-lg shadow-black/30'
                      : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700/80 hover:bg-slate-900/50'
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-3.5 group cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 shrink-0 mt-0.5">
                        0{idx + 1}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-white group-hover:text-sky-300 transition-colors leading-snug">
                        {faq.q}
                      </span>
                    </div>
                    <div className={`w-7 h-7 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center shrink-0 transition-all duration-300 mt-0.5 ${
                      isOpen ? 'rotate-45 text-sky-400 border-sky-500/30 bg-sky-500/10' : 'text-slate-400 group-hover:text-white group-hover:border-slate-700'
                    }`}>
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-300/90 leading-relaxed pt-0 pl-11 sm:pl-12">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
