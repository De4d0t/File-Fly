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
  Wifi,
  WifiOff,
  Laptop
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import VisibilityToggle from './VisibilityToggle.jsx';

export default function Header() {
  const { 
    myDevice, 
    isOnline, 
    isScanning,
    setIsQrModalOpen, 
    setIsHistoryModalOpen, 
    setIsRenameModalOpen, 
    refreshPeers, 
    openDownloadsFolder 
  } = useFileFly();

  const isDesktop = typeof window !== 'undefined' && Boolean(window.fileflyDesktop);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-400 p-0.5 shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-brand-400 fill-brand-400 animate-pulse-slow" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                FileFly
                <span className="text-xs px-2 py-0.5 font-medium rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  LAN Fast
                </span>
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

        {/* Center: Visibility Toggle */}
        <div className="flex items-center">
          <VisibilityToggle />
        </div>

        {/* Right: Quick Action Buttons (Icons Only) */}
        <div className="flex items-center gap-2">
          {/* Refresh / Scan peers button */}
          <button
            onClick={refreshPeers}
            disabled={isScanning}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm ${
              isScanning
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80'
            }`}
            title={isScanning ? 'جاري فحص الشبكة...' : 'تحديث وفحص الأجهزة على الشبكة'}
          >
            <RefreshCw className={`w-4 h-4 text-sky-400 ${isScanning ? 'animate-spin' : ''}`} />
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
