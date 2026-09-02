import React from 'react';
import Header from './components/Header.jsx';
import DeviceGrid from './components/DeviceGrid.jsx';
import TransferModal from './components/TransferModal.jsx';
import ActiveTransfers from './components/ActiveTransfers.jsx';
import QrCodeModal from './components/QrCodeModal.jsx';
import HistoryModal from './components/HistoryModal.jsx';
import RenameModal from './components/RenameModal.jsx';
import InstallModal from './components/InstallModal.jsx';
import ServerOfflineModal from './components/ServerOfflineModal.jsx';
import Footer from './components/Footer.jsx';
import { useFileFly } from './context/FileFlyContext.jsx';

export default function App() {
  const { myDevice, isOnline } = useFileFly();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-950 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Soft Ambient Top Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* App Header */}
      <Header />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pt-1 sm:pt-1.5 pb-2 flex flex-col justify-start">
        <DeviceGrid />
      </main>

      {/* Modals and Drawers */}
      <TransferModal />
      <ActiveTransfers />
      <QrCodeModal />
      <HistoryModal />
      <RenameModal />
      <InstallModal />
      <ServerOfflineModal />

      {/* Professional & Minimalist App Footer */}
      <Footer />
    </div>
  );
}
