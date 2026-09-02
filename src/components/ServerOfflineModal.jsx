import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  RotateCw, 
  PowerOff,
  X
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function ServerOfflineModal() {
  const { isOnline, isHostMachine, reconnectSocket } = useFileFly();
  const [showModal, setShowModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCompletelyDismissed, setIsCompletelyDismissed] = useState(false);

  useEffect(() => {
    // Host machine (Desktop Electron / localhost) doesn't need this modal
    if (isHostMachine) {
      setShowModal(false);
      return;
    }

    if (isOnline) {
      setShowModal(false);
      setIsDismissed(false);
      setIsCompletelyDismissed(false);
      return;
    }

    // Give a 1.8s grace period on initial load so it doesn't flash during fast socket handshake
    const timer = setTimeout(() => {
      if (!isOnline && !isHostMachine) {
        setShowModal(true);
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [isOnline, isHostMachine]);

  const handleRetry = () => {
    setIsRetrying(true);
    if (reconnectSocket) {
      reconnectSocket();
    }
    setTimeout(() => {
      setIsRetrying(false);
    }, 1200);
  };

  // If host, or online, or user completely dismissed it, do not render
  if (isHostMachine || isOnline || isCompletelyDismissed) return null;

  // If user dismissed modal, show a sleek bottom floating toast banner instead (never blocks the top navbar!)
  if (isDismissed) {
    return (
      <div className="fixed bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex items-center justify-between gap-2 p-2 px-3 sm:px-4 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-200 shadow-2xl backdrop-blur-lg text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-semibold truncate text-[11px] sm:text-xs">السيرفر متوقف على الحاسوب</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="p-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-300 hover:text-white transition-colors"
              title="إعادة الفحص"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsDismissed(false)}
              className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors"
            >
              التفاصيل
            </button>
            <button
              onClick={() => setIsCompletelyDismissed(true)}
              className="p-1.5 rounded-lg hover:bg-rose-900/60 text-rose-400 hover:text-white transition-colors"
              title="إغلاق الإشعار نهائياً"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 sm:p-7 border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.15)] text-center overflow-hidden my-auto max-h-[92vh] overflow-y-auto">
        {/* Subtle Ambient Red Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-20"
          title="تصغير التنبيه"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Icon Container */}
        <div className="relative mx-auto mb-4 w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-rose-500/10 border border-rose-500/25 animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-rose-500/20 to-slate-900 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
            <Laptop className="w-8 h-8 text-rose-400" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <PowerOff className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
          السيرفر متوقف حالياً
        </h3>

        {/* Prominent Message */}
        <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/20 text-rose-200 text-xs sm:text-sm leading-relaxed mb-4">
          يجب تشغيل تطبيق <span className="font-bold text-white">FileFly</span> من جهاز الحاسوب أولاً حتى تعمل الخدمة، وتتمكن من إرسال واستقبال الملفات.
        </div>

        {/* Easy Action Steps */}
        <div className="space-y-2 text-right mb-5">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </span>
            <div className="text-xs">
              <span className="font-semibold text-white block mb-0.5">شغّل التطبيق على الحاسوب</span>
              <span className="text-slate-400">افتح FileFly من سطح المكتب أو شريط المهام على الكمبيوتر.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </span>
            <div className="text-xs">
              <span className="font-semibold text-white block mb-0.5">نفس شبكة الواي فاي (Wi-Fi)</span>
              <span className="text-slate-400">تأكد من اتصال هاتفك والكمبيوتر بنفس راوتر المنزل أو نقطة الاتصال.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </span>
            <div className="text-xs">
              <span className="font-semibold text-white block mb-0.5">اتصال فوري وتلقائي</span>
              <span className="text-slate-400">سيتصل هاتفك تلقائياً وتختفي هذه النافذة فور إقلاع السيرفر.</span>
            </div>
          </div>
        </div>

        {/* Live Status & Auto-Reconnect Pulse */}
        <div className="flex items-center justify-center gap-2 mb-4 text-[11px] text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>جاري محاولة الاتصال التلقائي بالخادم...</span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75"
          >
            <RotateCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'جاري فحص الاتصال...' : 'إعادة المحاولة الآن'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="w-full py-2 px-3 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            تصفح التطبيق بدون اتصال
          </button>
        </div>
      </div>
    </div>
  );
}
