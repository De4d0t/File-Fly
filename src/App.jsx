import React from 'react';
import Header from './components/Header.jsx';
import DeviceGrid from './components/DeviceGrid.jsx';
import DropZone from './components/DropZone.jsx';
import TransferModal from './components/TransferModal.jsx';
import ActiveTransfers from './components/ActiveTransfers.jsx';
import QrCodeModal from './components/QrCodeModal.jsx';
import HistoryModal from './components/HistoryModal.jsx';
import RenameModal from './components/RenameModal.jsx';
import { useFileFly } from './context/FileFlyContext.jsx';
import { Wifi, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  const { myDevice, isOnline } = useFileFly();

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* App Header */}
      <Header />

      {/* Global Drag & Drop listener */}
      <DropZone />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <DeviceGrid />
      </main>

      {/* Modals and Drawers */}
      <TransferModal />
      <ActiveTransfers />
      <QrCodeModal />
      <HistoryModal />
      <RenameModal />

      {/* Footer / Status Bar */}
      <footer className="w-full border-t border-slate-800/80 glass-panel py-3 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span>
              {isOnline ? 'الخادم المحلي نشط وجاهز لنقل الملفات' : 'جاري الاتصال بالخادم المحلي...'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-slate-400">IP: {myDevice.ip}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span>سرعة شبكة محلية قصوى (LAN/Wi-Fi)</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>نقل مباشر 100% بدون إنترنت</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
