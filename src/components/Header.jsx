import React from 'react';
import { 
  Zap, 
  QrCode, 
  History, 
  FolderOpen, 
  RefreshCw, 
  Edit3, 
  Minus, 
  Square, 
  X,
  Eye,
  EyeOff,
  Radio,
  Laptop
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function Header() {
  const { 
    myDevice, 
    isOnline, 
    isScanning,
    toggleVisibility,
    setIsQrModalOpen, 
    setIsHistoryModalOpen, 
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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      {/* Desktop Window Controls Bar (for Electron) */}
      {isDesktop && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950/60 border-b border-slate-800/40 text-xs text-slate-400 app-drag-region">
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

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-400 p-0.5 shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-brand-400 fill-brand-400 animate-pulse-slow" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                FileFly
              </h1>
            </div>

            {/* Device Name with Rename Button */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                اسم جهازك:
              </span>
              <button
                onClick={() => setIsRenameModalOpen(true)}
                className="group flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                title="انقر لتغيير اسم الجهاز"
              >
                <span>{myDevice?.name || 'جهازي'}</span>
                <Edit3 className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>

        {/* Unified Glass Action Toolbar */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg shadow-black/20">
          {/* Visibility Toggle Icon Button */}
          <button
            onClick={toggleVisibility}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center relative hover:scale-105 active:scale-95 shadow-sm ${
              isVisible
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-400 glow-green'
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-400'
            }`}
            title={isVisible ? 'الجهاز مكشوف على الشبكة (مرئي - انقر للإخفاء)' : 'وضع التخفي - مخفي (انقر للظهور)'}
          >
            {isVisible ? (
              <>
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Eye className="w-4 h-4 text-emerald-400" />
              </>
            ) : (
              <>
                <span className="absolute top-1 right-1 inline-flex rounded-full h-1.5 w-1.5 bg-slate-500"></span>
                <EyeOff className="w-4 h-4 text-slate-400" />
              </>
            )}
          </button>

          {/* Radar / Scan Button with rich spinning & glowing effects */}
          <button
            onClick={refreshPeers}
            disabled={isScanning}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center relative hover:scale-105 active:scale-95 shadow-sm ${
              isScanning
                ? 'bg-sky-500/25 border-sky-400/60 text-sky-300 shadow-lg shadow-sky-500/30 ring-2 ring-sky-400/40 glow-cyan'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80 hover:border-sky-500/30'
            }`}
            title={isScanning ? 'الرادار نشط: جاري فحص الشبكة...' : 'تشغيل رادار فحص الأجهزة على الشبكة'}
          >
            {isScanning && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
              </span>
            )}
            <Radio className={`w-4 h-4 text-sky-400 ${isScanning ? 'animate-spin drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : ''}`} />
          </button>

          {/* QR Code Quick Connect for Mobile */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm"
            title="ربط الهاتف عبر رمز QR"
          >
            <QrCode className="w-4 h-4 text-brand-400" />
          </button>

          {/* History button */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm"
            title="سجل الملفات المنقولة"
          >
            <History className="w-4 h-4 text-purple-400" />
          </button>

          {/* Open Downloads Folder */}
          <button
            onClick={openDownloadsFolder}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm"
            title="فتح مجلد التنزيلات"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
