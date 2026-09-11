import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AppWindow, 
  ArrowDownToLine,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

function ComputerIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 3H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h6v2H8c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1h-2v-2h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 11H4V5h16v9z" />
    </svg>
  );
}

function AppleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.87-.9.04-1.99.6-2.63 1.35-.58.65-1.09 1.73-.95 2.76 1 .08 2.04-.49 2.66-1.24z" />
    </svg>
  );
}

function AndroidIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.52 8.92l1.7-2.94a.5.5 0 00-.86-.5l-1.73 3A10.02 10.02 0 0012 7.5c-1.68 0-3.26.4-4.63 1.08L5.64 5.48a.5.5 0 00-.86.5l1.7 2.94C3.78 10.74 2 13.9 2 17.5h20c0-3.6-1.78-6.76-4.48-8.58zM8.5 14a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm7 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
    </svg>
  );
}

function IosShareIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg 
      className={`${className} inline text-sky-400 mx-1 align-text-bottom`} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export default function InstallModal() {
  const { 
    isInstallModalOpen, 
    setIsInstallModalOpen, 
    deferredInstallPrompt, 
    installPwaApp, 
    isAppInstalled 
  } = useFileFly();

  // Detect user platform
  const detectPlatform = () => {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  };

  const [activeTab, setActiveTab] = useState(detectPlatform());
  const [installSuccess, setInstallSuccess] = useState(false);

  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const port = typeof window !== 'undefined' ? window.location.port || '53316' : '53316';

  if (!isInstallModalOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredInstallPrompt) {
      const installed = await installPwaApp();
      if (installed) {
        setInstallSuccess(true);
        setTimeout(() => {
          setIsInstallModalOpen(false);
          setInstallSuccess(false);
        }, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-5 border border-slate-700/80 shadow-2xl animate-in zoom-in-95 duration-200 text-right">
        
        {/* Close Button */}
        <button
          onClick={() => setIsInstallModalOpen(false)}
          className="absolute top-3.5 left-3.5 p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-all duration-150 active:scale-95 z-10"
          title="إغلاق"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3.5 pb-3 border-b border-slate-800/80">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 shadow-inner">
            <AppWindow className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              تثبيت FileFly
            </h3>
            <p className="text-[11px] text-slate-400">
              تشغيل التطبيق في نافذة سريعة ومستقلة بدون متصفح
            </p>
          </div>
        </div>

        {/* Segmented Platform Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800 mb-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('desktop')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150 ${
              activeTab === 'desktop'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ComputerIcon className="w-4 h-4 shrink-0" />
            <span>كمبيوتر</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150 ${
              activeTab === 'ios'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AppleIcon className="w-4 h-4 shrink-0" />
            <span>آيفون</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150 ${
              activeTab === 'android'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AndroidIcon className="w-4 h-4 shrink-0" />
            <span>أندرويد</span>
          </button>
        </div>

        {/* IP Notice on Desktop */}
        {activeTab === 'desktop' && !isLocalhost && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>للتثبيت في Chrome افتح عبر localhost</span>
            </div>
            <a
              href={`http://localhost:${port}`}
              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold border border-amber-500/30 flex items-center gap-1 shrink-0 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>localhost:{port}</span>
            </a>
          </div>
        )}

        {/* One-Click Native Install (When available) */}
        {deferredInstallPrompt && !installSuccess && (
          <button
            onClick={handleNativeInstall}
            className="w-full mb-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>تثبيت التطبيق بنقرة واحدة</span>
          </button>
        )}

        {/* Success Message */}
        {installSuccess && (
          <div className="mb-3 p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>تم التثبيت بنجاح! تم حفظ التطبيق على جهازك.</span>
          </div>
        )}

        {/* Step-by-Step Instructions by Platform */}
        <div className="space-y-2">
          {activeTab === 'desktop' && (
            <>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <span className="text-slate-300 leading-normal">
                  <strong className="text-white">Google Chrome:</strong> من القائمة <span className="font-mono bg-slate-800 px-1 rounded border border-slate-700 text-[10px]">⋮</span> &gt; <strong className="text-sky-300">حفظ ومشاركة</strong> &gt; <strong className="text-sky-300">تثبيت FileFly</strong>.
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <span className="text-slate-300 leading-normal">
                  <strong className="text-white">Microsoft Edge:</strong> القائمة <span className="font-mono bg-slate-800 px-1 rounded border border-slate-700 text-[10px]">...</span> &gt; <strong className="text-sky-300">المزيد من الأدوات (More tools)</strong> &gt; <strong className="text-sky-300">تثبيت هذا الموقع كتطبيق</strong> (أو من شريط العنوان مباشرة).
                </span>
              </div>
            </>
          )}

          {activeTab === 'ios' && (
            <>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <span className="text-slate-300 leading-normal">
                  افتح في <strong className="text-white">Safari</strong> واضغط زر المشاركة <IosShareIcon /> أسفل الشاشة.
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <span className="text-slate-300 leading-normal">
                  مرر للأسفل واضغط على <strong className="text-sky-300">«View More»</strong> (عرض المزيد).
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <span className="text-slate-300 leading-normal">
                  اضغط <strong className="text-sky-300">«Add to Home Screen»</strong> (إضافة للشاشة الرئيسية) ثم <strong className="text-white">Add</strong>.
                </span>
              </div>
            </>
          )}

          {activeTab === 'android' && (
            <>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <span className="text-slate-300 leading-normal">
                  في متصفح <strong className="text-white">Chrome</strong> اضغط زر القائمة <span className="font-mono bg-slate-800 px-1 rounded border border-slate-700 text-[10px]">⋮</span> بأعلى الشاشة.
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <span className="text-slate-300 leading-normal">
                  اضغط على <strong className="text-sky-300">«تثبيت التطبيق» (Install app)</strong> أو <strong className="text-sky-300">«إضافة للشاشة الرئيسية»</strong>.
                </span>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
