import React from 'react';
import { 
  Zap, 
  QrCode, 
  FolderOpen, 
  RefreshCw, 
  Edit3, 
  Minus, 
  Square, 
  X,
  Eye,
  EyeOff,
  Radio,
  Laptop,
  Smartphone,
  DownloadCloud
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function Header() {
  const { 
    myDevice, 
    isOnline, 
    isHostMachine,
    isMobileClient,
    isScanning,
    isRadarActive,
    toggleRadar,
    toggleVisibility,
    setIsQrModalOpen, 
    setIsRenameModalOpen, 
    refreshPeers, 
    openDownloadsFolder 
  } = useFileFly();

  const isDesktop = typeof window !== 'undefined' && Boolean(window.fileflyDesktop);
  const isVisible = myDevice?.visible;

  const handleMinimize = () => window.fileflyDesktop?.minimizeWindow();
  const handleMaximize = () => window.fileflyDesktop?.maximizeWindow();
  const handleClose = () => window.fileflyDesktop?.closeWindow();

  return (
    <header className="w-full">
      {/* Desktop Window Controls Bar (for Electron) */}
      {isDesktop && (
        <div className="w-full flex items-center justify-between px-4 py-1.5 bg-slate-950/80 border-b border-slate-800/40 text-xs text-slate-400 app-drag-region">
          <div className="flex items-center gap-2 app-no-drag">
            <Zap className="w-3.5 h-3.5 text-brand-400 fill-brand-400" />
            <span className="font-semibold text-slate-300">FileFly Desktop</span>
            <span className="text-[10px] text-slate-500">v1.0</span>
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
              onClick={handleMaximize}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
              title="تكبير"
            >
              <Square className="w-3.5 h-3.5" />
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

      {/* Main Rounded Navbar (Exact Same Width as Radar Box) */}
      <div className="max-w-5xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="rounded-2xl sm:rounded-3xl glass-panel border border-slate-800/80 shadow-xl px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Device Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-400 p-0.5 shadow-lg shadow-brand-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-brand-400 fill-brand-400 animate-pulse-slow" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  FileFly
                </h1>
              </div>

              {/* Device Name with Rename Button */}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 shrink-0">
                  {isMobileClient ? (
                    <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                  ) : (
                    <Laptop className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                  )}
                  جهازك:
                </span>
                <button
                  onClick={() => setIsRenameModalOpen(true)}
                  className="group flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors truncate"
                  title="انقر لتغيير اسم الجهاز"
                >
                  <span className="truncate max-w-[85px] xs:max-w-[120px] sm:max-w-[180px]">{myDevice?.name || 'جهازي'}</span>
                  <Edit3 className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Unified Glass Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800 shrink-0">
            {/* Visibility Toggle Icon Button */}
            <button
              onClick={toggleVisibility}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all flex items-center justify-center relative hover:scale-105 active:scale-95 ${
                isVisible
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-400 glow-green'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-400'
              }`}
              title={isVisible ? 'الجهاز مكشوف على الشبكة (مرئي - انقر للإخفاء)' : 'وضع التخفي - مخفي (انقر للظهور)'}
            >
              {isVisible ? (
                <Eye className="w-4 h-4 text-emerald-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* QR Code Quick Connect for Mobile */}
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center hover:scale-105 active:scale-95"
              title="ربط الهاتف عبر رمز QR"
            >
              <QrCode className="w-4 h-4 text-brand-400" />
            </button>

            {/* Download Windows App Button (Visible on Desktop / Tablets) */}
            {!isMobileClient && (
              <a
                href="/api/download-app/windows"
                download="FileFly.exe"
                className="hidden sm:flex p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 hover:text-white border border-sky-500/30 transition-all items-center justify-center hover:scale-105 active:scale-95 group glow-cyan"
                title="تحميل تطبيق FileFly المحمول للكمبيوتر (.exe تشغيل مباشر بدون تثبيت)"
              >
                <DownloadCloud className="w-4 h-4 text-sky-400 group-hover:animate-bounce" />
              </a>
            )}

            {/* Open Downloads Folder */}
            <button
              onClick={openDownloadsFolder}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center hover:scale-105 active:scale-95"
              title="فتح مجلد التنزيلات"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
