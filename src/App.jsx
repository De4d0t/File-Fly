import React from 'react';
import Header from './components/Header.jsx';
import DeviceGrid from './components/DeviceGrid.jsx';
import TransferModal from './components/TransferModal.jsx';
import ActiveTransfers from './components/ActiveTransfers.jsx';
import QrCodeModal from './components/QrCodeModal.jsx';
import HistoryModal from './components/HistoryModal.jsx';
import RenameModal from './components/RenameModal.jsx';
import { useFileFly } from './context/FileFlyContext.jsx';
import { Globe } from 'lucide-react';

const TelegramIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.05-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.44 3.8-1.63 4.59-1.91 5.11-1.92.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.21-.04.34z" />
  </svg>
);

const InstagramIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const GitHubIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z" />
  </svg>
);

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
        <div className="w-full rounded-2xl sm:rounded-3xl glass-panel border border-slate-800/80 shadow-xl px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-xs text-slate-400" dir="ltr">
          {/* Developed By Ahmed Al-Jaberi */}
          <div className="flex items-center gap-1.5 font-sans text-slate-300 select-none">
            <span className="font-semibold text-slate-200 tracking-wide text-[11.5px] sm:text-xs">
              Developed By Ahmed Al-Jaberi
            </span>
          </div>

          <span className="hidden sm:inline-block text-slate-700">|</span>

          {/* Social Media Icons (Exact same style & colors as GPS project) */}
          <div className="flex items-center gap-1">
            {/* Telegram */}
            <a
              href="https://t.me/YYxYY"
              target="_blank"
              rel="noopener noreferrer"
              title="قناة التليجرام (@YYxYY)"
              className="w-6 h-6 rounded-md hover:bg-[#229ED9]/15 text-slate-400 hover:text-[#229ED9] flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
            >
              <TelegramIcon className="w-3.5 h-3.5" />
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/3BF"
              target="_blank"
              rel="noopener noreferrer"
              title="حساب الانستغرام (@3BF)"
              className="w-6 h-6 rounded-md hover:bg-[#E1306C]/15 text-slate-400 hover:text-[#E1306C] flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
            >
              <InstagramIcon className="w-3.5 h-3.5" />
            </a>

            {/* Website */}
            <a
              href="https://iq-cyborg.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              title="الموقع الإلكتروني (iq-cyborg.vercel.app)"
              className="w-6 h-6 rounded-md hover:bg-sky-500/15 text-slate-400 hover:text-sky-400 flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/de4d0t"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub (@de4d0t)"
              className="w-6 h-6 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
            >
              <GitHubIcon className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
