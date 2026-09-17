'use client';

import { Zap, ShieldCheck, WifiOff, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Hero() {
  const { t, dir } = useLanguage();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Ambient Glows - Subtle and Single-Toned */}
      <div className="ambient-glow-blue top-1/4 -right-40 opacity-70" />
      <div className="ambient-glow-cyan top-1/3 -left-40 opacity-50" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.15] sm:leading-[1.15] mb-6 text-white max-w-5xl mx-auto">
          {t.hero.titleLine1}
          <br />
          <span className="text-gradient-cyan">{t.hero.titleLine2}</span>{' '}
          <span className="inline-block relative">
            {t.hero.titleLine3}
            <svg className="absolute -bottom-2 right-0 left-0 w-full text-sky-500/30 -z-10" viewBox="0 0 300 12" fill="none">
              <path d="M1 9C50 3 150 1 299 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          {t.hero.description}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center mb-16 mx-auto">
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-base border border-slate-800 hover:border-slate-700 shadow-lg backdrop-blur-md transition-all group"
          >
            <Smartphone className="w-5 h-5 text-sky-400" />
            <span>{t.hero.howItWorksBtn}</span>
            {dir === 'rtl' ? (
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </a>
        </div>

        {/* Unified Minimalist Feature Badges Strip (Single Accent Palette) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-right sm:text-center">
          <div className="glass-card p-3.5 rounded-2xl flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
              <div className="text-sm font-bold text-white">{t.hero.metrics.speed}</div>
              <div className="text-[11px] text-slate-400">{t.hero.metrics.speedSub}</div>
            </div>
          </div>

          <div className="glass-card p-3.5 rounded-2xl flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
              <div className="text-sm font-bold text-white">{t.hero.metrics.privacy}</div>
              <div className="text-[11px] text-slate-400">{t.hero.metrics.privacySub}</div>
            </div>
          </div>

          <div className="glass-card p-3.5 rounded-2xl flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
              <div className="text-sm font-bold text-white">{t.hero.metrics.noInternet}</div>
              <div className="text-[11px] text-slate-400">{t.hero.metrics.noInternetSub}</div>
            </div>
          </div>

          <div className="glass-card p-3.5 rounded-2xl flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
              <div className="text-sm font-bold text-white">{t.hero.metrics.zeroInstall}</div>
              <div className="text-[11px] text-slate-400">{t.hero.metrics.zeroInstallSub}</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
