'use client';

import { useState, useEffect } from 'react';
import { Laptop, Smartphone, CheckCircle2, Film, FileText, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AppMockup() {
  const { t, dir } = useLanguage();
  const [progress, setProgress] = useState(64);
  const [speed, setSpeed] = useState(78.4);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 15;
        return prev + 1;
      });
      setSpeed((prev) => +(70 + Math.random() * 18).toFixed(1));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const peers = [
    { id: 1, name: 'iPhone 16 Pro', type: 'mobile', status: t.mockup.connected },
    { id: 2, name: 'Galaxy S24 Ultra', type: 'mobile', status: t.mockup.connected },
    { id: 3, name: 'MacBook Air M2', type: 'laptop', status: t.mockup.ready },
  ];

  return (
    <section className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Decorative Outer Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-transparent blur-3xl -z-10" />

      {/* Main Glass Mockup Container */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl shadow-black/80 backdrop-blur-2xl overflow-hidden transition-all">
        
        {/* Window Titlebar */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
              <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
              <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
            </div>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">{t.mockup.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              {t.mockup.radarActive}
            </span>
          </div>
        </div>

        {/* Mockup Body */}
        <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Simulated Radar Stage */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[380px] p-6 rounded-2xl bg-gradient-to-b from-slate-900/50 to-slate-950/80 border border-slate-800/80 overflow-hidden">
            
            {/* Pulsing Radar Rings */}
            <div className="absolute w-72 h-72 rounded-full border border-sky-500/10 animate-ping pointer-events-none" style={{ animationDuration: '4s' }} />
            <div className="absolute w-60 h-60 rounded-full border border-sky-500/15 pointer-events-none" />
            <div className="absolute w-44 h-44 rounded-full border border-dashed border-sky-500/25 pointer-events-none animate-spin" style={{ animationDuration: '25s' }} />
            <div className="absolute w-28 h-28 rounded-full border border-sky-500/20 pointer-events-none" />

            {/* Central Host Device */}
            <div className="relative z-10 flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 p-0.5 shadow-xl shadow-sky-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white">
                  <Laptop className="w-8 h-8 text-sky-400" />
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs font-extrabold text-white block">{t.mockup.hostDevice}</span>
                <span className="text-[10px] text-slate-400 font-mono">192.168.1.10</span>
              </div>
            </div>

            {/* Discovered Peer Devices Array */}
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 w-full">
              {peers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 transition-all hover:scale-105 cursor-pointer shadow-lg group"
                >
                  <div className="w-12 h-12 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-200 flex items-center justify-center mb-2 shadow-md group-hover:border-sky-500/40 group-hover:text-sky-400 transition-colors">
                    {peer.type === 'mobile' ? (
                      <Smartphone className="w-6 h-6" />
                    ) : (
                      <Laptop className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{peer.name}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span className="text-[10px] text-slate-400">{peer.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>{t.mockup.radarHint}</span>
            </div>
          </div>

          {/* Right Column: Live Activity Card */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Active Transfer Card */}
            <div className="glass-card p-5 rounded-2xl border-sky-500/30 bg-slate-900/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wide">{t.mockup.transferring}</span>
                </div>
                <span className="text-xs font-bold font-mono text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                  {speed} MB/s
                </span>
              </div>

              {/* File Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
                  <Film className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white truncate">Holiday_Trip_4K_HDR.mp4</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>1.84 GB</span>
                    <span>•</span>
                    <span className="text-sky-300">{t.mockup.transferDetails}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">{t.mockup.progressLabel}: {progress}%</span>
                  <span className="text-slate-300">{t.mockup.timeRemaining}</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-300 shadow-sm shadow-sky-400/50"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Completed Transfer Notification Item */}
            <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-slate-800 bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{t.mockup.completedTitle}</div>
                  <div className="text-[11px] text-slate-400">{t.mockup.completedSub}</div>
                </div>
              </div>
              <span className="text-[11px] text-sky-400 font-bold">{t.mockup.completedBadge}</span>
            </div>

            {/* Clipboard Sharing Card */}
            <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{t.mockup.clipboardTitle}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[180px]">https://filefly.app/share...</div>
                </div>
              </div>
              <span className="text-[11px] text-slate-300 font-medium bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                {t.mockup.clipboardCopied}
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
