'use client';

import { useLanguage } from '../context/LanguageContext';

export default function Hero() {
  const { t, dir } = useLanguage();

  return (
    <section className="relative pt-28 pb-8 sm:pt-36 sm:pb-12 overflow-hidden">
      {/* Subtle Ambient Background Glows */}
      <div className="ambient-glow-blue top-1/4 -right-32 opacity-40" />
      <div className="ambient-glow-cyan top-1/3 -left-32 opacity-30" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Clear, Bold Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2] mb-5 text-white">
          {t.hero.title}
          <br />
          <span className="text-gradient-cyan">{t.hero.titleHighlight}</span>
        </h1>

        {/* Concise Description */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
          {t.hero.description}
        </p>

        {/* Main Action Block */}
        <div className="flex flex-col items-center justify-center gap-3.5 mb-2">
          <a
            href="/api/download"
            download
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-base shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M0 0h11.2v11.2H0zm12.8 0H24v11.2H12.8zM0 12.8h11.2V24H0zm12.8 0H24V24H12.8z" />
            </svg>
            <span>{t.hero.downloadWindows}</span>
          </a>
        </div>

      </div>
    </section>
  );
}
