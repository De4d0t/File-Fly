import { 
  Zap, 
  QrCode, 
  Minus, 
  X,
  DownloadCloud,
  History
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function Header() {
  const { 
    isHostMachine,
    setIsQrModalOpen, 
    setIsInstallModalOpen,
    deferredInstallPrompt,
    isAppInstalled,
    installPwaApp,
    setIsHistoryModalOpen
  } = useFileFly();

  const isDesktop = typeof window !== 'undefined' && Boolean(window.fileflyDesktop);

  const getInstallButtonInfo = () => {
    if (typeof navigator === 'undefined') return { label: 'تثبيت التطبيق', shortLabel: 'تثبيت' };
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) {
      return { label: 'تثبيت على الآيفون', shortLabel: 'تثبيت', platform: 'ios' };
    }
    if (/Android/i.test(ua)) {
      return { label: 'تثبيت على الأندرويد', shortLabel: 'تثبيت', platform: 'android' };
    }
    return { label: 'تثبيت على الكمبيوتر', shortLabel: 'تثبيت', platform: 'desktop' };
  };

  const installInfo = getInstallButtonInfo();

  const handleInstallClick = async () => {
    if (deferredInstallPrompt) {
      const installed = await installPwaApp();
      if (!installed) {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  const handleMinimize = () => window.fileflyDesktop?.minimizeWindow();
  const handleClose = () => window.fileflyDesktop?.closeWindow();

  return (
    <header className="w-full">
      {/* Desktop Window Controls Bar (for Electron) */}
      {isDesktop && (
        <div className="w-full flex items-center justify-between px-4 py-1 bg-slate-950/90 border-b border-slate-800/40 text-xs text-slate-400 app-drag-region" dir="ltr">
          <div className="flex items-center gap-2 app-no-drag">
            <Zap className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
            <span className="font-semibold text-slate-200">FileFly Server</span>
            <span className="text-[10px] text-slate-500 font-mono">v1.0</span>
          </div>

          <div className="flex items-center gap-1 app-no-drag">
            <button
              onClick={handleMinimize}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
              title="تصغير"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-red-500/80 rounded text-slate-400 hover:text-white transition-colors"
              title="إغلاق"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Rounded Navbar */}
      <div className="max-w-[560px] w-full mx-auto px-3.5 sm:px-4 pt-3 sm:pt-4">
        <div 
          className="rounded-2xl sm:rounded-3xl glass-panel px-4 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-3 sm:gap-4"
          dir="ltr"
        >
          
          {/* Left Side: Upgraded Brand Logo & Stylized Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 select-none">
            {/* Aerodynamic Gradient Logo Avatar */}
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-400 to-blue-600 p-[1.5px] shadow-lg shadow-sky-500/35 shrink-0 group transition-transform hover:scale-105 active:scale-95">
              <div className="w-full h-full bg-gradient-to-b from-sky-400 to-blue-600 rounded-[9px] flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white drop-shadow-md group-hover:rotate-6 transition-transform duration-300" />
              </div>
            </div>

            {/* Distinctive Stylized Stacked Brand Typography */}
            <div 
              className="flex flex-col justify-center select-none leading-none group cursor-default"
              style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}
            >
              <span 
                className="text-[13.5px] sm:text-[15.5px] font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-200 drop-shadow-[0_0_12px_rgba(56,189,248,0.55)] leading-none transition-all duration-300 group-hover:drop-shadow-[0_0_16px_rgba(56,189,248,0.8)]"
                style={{ letterSpacing: '0.22em', marginRight: '-0.22em' }}
              >
                FLY
              </span>
              <span 
                className="text-[12.5px] sm:text-[14.5px] font-extrabold text-white/95 uppercase leading-none mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] transition-colors duration-300 group-hover:text-white"
                style={{ letterSpacing: '0.12em', marginRight: '-0.12em' }}
              >
                FILE
              </span>
            </div>
          </div>

          {/* Right Side: Action Buttons Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg shrink-0">

            {/* QR Code Connect for Mobile */}
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm"
              title="ربط الهاتف عبر رمز QR"
            >
              <QrCode className="w-4 h-4 text-sky-400" />
            </button>

            {/* Dynamic Platform-Specific Install Button */}
            {!isAppInstalled && !isDesktop && (
              <button
                onClick={handleInstallClick}
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm"
                title={installInfo.label}
              >
                <DownloadCloud className="w-4 h-4 text-sky-400" />
              </button>
            )}

            {/* History Modal */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm"
              title="سجل النقل والملفات"
            >
              <History className="w-4 h-4 text-sky-400" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
