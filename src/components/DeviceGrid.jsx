import React from 'react';
import { 
  Radio, 
  Smartphone, 
  Laptop, 
  QrCode, 
  Wifi, 
  Sparkles,
  HelpCircle,
  Share2
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import DeviceCard from './DeviceCard.jsx';

export default function DeviceGrid() {
  const { peers, myDevice, isScanning, refreshPeers, setIsQrModalOpen } = useFileFly();

  // Strict multi-layer filter: Guarantee that self device NEVER shows in the grid
  const filteredPeers = (peers || []).filter((peer) => {
    if (!peer || !peer.id) return false;
    // Don't show by current active device ID
    if (myDevice?.id && peer.id === myDevice.id) return false;
    // Don't show by stored localStorage client ID
    const savedClientId = typeof window !== 'undefined' ? localStorage.getItem('filefly_client_id') : null;
    if (savedClientId && peer.id === savedClientId) return false;
    // If this screen is the Host, don't show the host card
    if (myDevice?.isHost && peer.isHost) return false;
    // Don't show if matching name and IP
    if (myDevice?.name && peer.name === myDevice.name && peer.ip === myDevice.ip) return false;
    return true;
  });

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Clickable Animated Radar Icon Box */}
          <button
            onClick={refreshPeers}
            disabled={isScanning}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-sm ${
              isScanning 
                ? 'bg-sky-500/25 border border-sky-400/60 shadow-lg shadow-sky-500/30 ring-2 ring-sky-400/40 glow-cyan' 
                : 'bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 text-sky-400'
            }`}
            title={isScanning ? 'الرادار نشط: جاري فحص الشبكة...' : 'انقر لتشغيل رادار فحص الأجهزة'}
          >
            {isScanning && (
              <span className="absolute -inset-1 rounded-2xl bg-sky-400/20 animate-ping pointer-events-none"></span>
            )}
            <Radio className={`w-4 h-4 text-sky-400 ${isScanning ? 'animate-spin drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'animate-pulse'}`} />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white">
                الأجهزة المكتشفة على الشبكة
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold">
                {filteredPeers.length}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              الأجهزة المتصلة بالشبكة وجاهزة لنقل واستقبال الملفات
            </p>
          </div>
        </div>
      </div>

      {/* Grid or Empty State */}
      {filteredPeers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPeers.map((peer) => (
            <DeviceCard key={peer.id} peer={peer} />
          ))}
        </div>
      ) : (
        /* Empty Radar State */
        <div className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 text-center border border-slate-800/80">
          {/* Radar Background Glow Animation */}
          <div className="relative mx-auto w-40 h-40 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-sky-500/20 animate-ping-slow"></div>
            <div className="absolute inset-4 rounded-full border border-brand-500/20 animate-ping-slow" style={{ animationDelay: '0.8s' }}></div>
            <div className="absolute inset-8 rounded-full border border-sky-400/30"></div>
            
            <div className="relative z-10 w-20 h-20 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-xl shadow-sky-500/10">
              <Radio className="w-9 h-9 text-brand-400 animate-pulse" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            جاري البحث عن أجهزة على الشبكة المحلية...
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            تأكد من أن أجهزتك الأخرى متصلة بنفس شبكة الواي فاي وأن وضع الظهور لديها مفعّل.
          </p>

          {/* Instructions Box */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
            <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/50">
              <div className="text-brand-400 font-bold text-xs mb-1">1. نفس الشبكة</div>
              <div className="text-[11px] text-slate-400">تأكد من اتصال الأجهزة بنفس راوتر الواي فاي.</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/50">
              <div className="text-sky-400 font-bold text-xs mb-1">2. وضع الظهور</div>
              <div className="text-[11px] text-slate-400">تأكد من تفعيل زر "الجهاز مكشوف على الشبكة".</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/50">
              <div className="text-purple-400 font-bold text-xs mb-1">3. هواتف الآيفون والأندرويد</div>
              <div className="text-[11px] text-slate-400">افتح الرابط في المتصفح دون الحاجة لتثبيت أي تطبيق.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
