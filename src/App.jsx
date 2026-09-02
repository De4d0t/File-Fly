import React from 'react';
import Header from './components/Header.jsx';
import DeviceGrid from './components/DeviceGrid.jsx';
import TransferModal from './components/TransferModal.jsx';
import ActiveTransfers from './components/ActiveTransfers.jsx';
import QrCodeModal from './components/QrCodeModal.jsx';
import HistoryModal from './components/HistoryModal.jsx';
import RenameModal from './components/RenameModal.jsx';
import { useFileFly } from './context/FileFlyContext.jsx';
import { Instagram, Globe, Github, Send } from 'lucide-react';

export default function App() {
  const { myDevice, isOnline } = useFileFly();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Soft Ambient Top Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* App Header */}
      <Header />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-6">
        <DeviceGrid />
      </main>

      {/* Modals and Drawers */}
      <TransferModal />
      <ActiveTransfers />
      <QrCodeModal />
      <HistoryModal />
      <RenameModal />

      {/* Footer / Floating Rounded Status Bar */}
      <footer className="max-w-5xl w-full mx-auto px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="w-full rounded-2xl sm:rounded-3xl glass-panel border border-slate-800/80 shadow-xl px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-center gap-2 sm:gap-3 text-xs text-slate-400">
          {/* Telegram */}
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-400/30 transition-all hover:scale-110 active:scale-95"
            title="Telegram (تليغرام)"
          >
            <Send className="w-4 h-4" />
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 border border-transparent hover:border-pink-500/30 transition-all hover:scale-110 active:scale-95"
            title="Instagram (انستغرام)"
          >
            <Instagram className="w-4 h-4" />
          </a>

          {/* Website */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-all hover:scale-110 active:scale-95"
            title="الموقع الإلكتروني"
          >
            <Globe className="w-4 h-4" />
          </a>

          {/* GitHub */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/40 border border-transparent hover:border-slate-600/50 transition-all hover:scale-110 active:scale-95"
            title="GitHub (جيت هب)"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </footer>
    </div>
  );
}
