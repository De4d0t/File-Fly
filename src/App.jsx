import React, { Component } from 'react';
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

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[FileFly ErrorBoundary]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

export default function App() {
  const { myDevice, isOnline } = useFileFly();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-950 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Soft Ambient Top Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* App Header */}
      <Header />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[560px] w-full mx-auto px-3.5 sm:px-4 pt-3.5 sm:pt-4 pb-3.5 sm:pb-4 flex flex-col justify-start">
        <DeviceGrid />
      </main>

      {/* Modals and Drawers */}
      <ErrorBoundary>
        <TransferModal />
        <ActiveTransfers />
        <QrCodeModal />
        <HistoryModal />
        <RenameModal />
        <InstallModal />
        <ServerOfflineModal />
      </ErrorBoundary>

      {/* Professional & Minimalist App Footer */}
      <Footer />
    </div>
  );
}
