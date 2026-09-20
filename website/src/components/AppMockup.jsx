'use client';

import { Laptop, Smartphone, QrCode, ArrowLeftRight, UploadCloud, FolderArchive, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AppMockup() {
  const { t, dir } = useLanguage();

  return (
    <section className="relative pt-2 pb-14 sm:pt-4 sm:pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Background Soft Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-transparent blur-3xl -z-10" />

      {/* Main Two-Device Showcase Container */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl shadow-black/80 backdrop-blur-xl p-5 sm:p-8 md:p-10 overflow-hidden">
        
        {/* Two-Device Grid with Visual Bridge */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
          
          {/* 1. PC Card (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 flex flex-col justify-between h-full shadow-lg">
            
            {/* Window Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{t.preview.pcTitle}</h3>
                  <span className="text-[11px] text-emerald-400 font-medium">{t.preview.pcStatus}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-700 inline-block" />
                <span className="w-2 h-2 rounded-full bg-slate-700 inline-block" />
                <span className="w-2 h-2 rounded-full bg-slate-700 inline-block" />
              </div>
            </div>

            {/* QR Connection Block */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-white p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                {/* Clean Representative QR Matrix */}
                <svg viewBox="0 0 24 24" className="w-full h-full fill-slate-950" shapeRendering="crispEdges">
                  <path d="M2 2h7v7H2V2zm2 2v3h3V4H4zm11-2h7v7h-7V2zm2 2v3h3V4h-3zM2 15h7v7H2v-7zm2 2v3h3v-3H4zm14-2h1v1h-1v-1zm-3 0h2v2h-2v-2zm5 0h1v3h-1v-3zm-5 3h1v2h-1v-2zm2 0h2v1h-2v-1zm2 1h2v2h-2v-2zm-4 1h1v1h-1v-1zm-4-9h2v2h-2V9zm4 0h1v2h-1V9zm-2 2h2v2h-2v-2zm4-2h2v2h-2V9zm-2 4h1v1h-1v-1zm4 1h1v2h-1v-2zm-3 2h2v1h-2v-1z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                  <QrCode className="w-3.5 h-3.5 text-sky-400" />
                  <span>Direct Pairing QR</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t.preview.qrHint}
                </p>
              </div>
            </div>

            {/* Drag & Drop Target Area */}
            <div className="p-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/40 text-center flex flex-col items-center justify-center gap-2">
              <FolderArchive className="w-6 h-6 text-sky-400/80" />
              <span className="text-xs font-medium text-slate-300">
                {t.preview.dropZone}
              </span>
            </div>

          </div>

          {/* 2. Middle Direct Bridge (1 col) */}
          <div className="lg:col-span-1 flex lg:flex-col items-center justify-center gap-2 py-2">
            <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-sky-500/40 to-transparent" />
            <div className="w-9 h-9 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-500/20">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-sky-500/40 to-transparent" />
          </div>

          {/* 3. Phone Card (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 flex flex-col justify-between h-full shadow-lg">
            
            {/* Phone Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{t.preview.phoneTitle}</h3>
                  <span className="text-[11px] text-emerald-400 font-medium">{t.preview.phoneStatus}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                Web PWA
              </span>
            </div>

            {/* Mobile Browser Simulation */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400 text-[11px]">http://192.168.1.15:53316</span>
                <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </span>
              </div>
              
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-200">Send Photos & Videos</span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Direct
                </span>
              </div>
            </div>

            {/* Hint Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center">
              <p className="text-xs text-slate-400 font-medium">
                {t.preview.phoneHint}
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
