import React from 'react';
import { 
  Radio, 
  Smartphone, 
  Laptop, 
  QrCode, 
  Wifi, 
  Sparkles,
  Power
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import DeviceCard from './DeviceCard.jsx';

export default function DeviceGrid() {
  const { peers, myDevice, isRadarActive, toggleRadar } = useFileFly();

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
      {/* Main Radar & Discovered Devices Panel */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-10 text-center border border-slate-800/80 shadow-2xl transition-all">
        {/* Clickable Radar Scanner Center */}
        <div className="relative mx-auto w-44 h-44 mb-4 flex items-center justify-center">
          {/* Concentric Sonar Ripple Waves when Radar is Active */}
          {isRadarActive && (
            <>
              <div className="absolute inset-0 rounded-full border border-sky-400/40 animate-radar-ripple pointer-events-none"></div>
              <div 
                className="absolute inset-0 rounded-full border border-emerald-400/35 animate-radar-ripple pointer-events-none" 
                style={{ animationDelay: '1.1s' }}
              ></div>
              <div 
                className="absolute inset-0 rounded-full border border-sky-300/30 animate-radar-ripple pointer-events-none" 
                style={{ animationDelay: '2.2s' }}
              ></div>

              {/* Rotating Sonar Sweep Beam */}
              <div className="absolute inset-2 rounded-full overflow-hidden pointer-events-none animate-radar-sweep">
                <div className="w-1/2 h-1/2 bg-gradient-to-br from-sky-400/25 to-transparent origin-bottom-right rounded-tl-full"></div>
              </div>

              {/* Outer Glow Halo */}
              <div className="absolute inset-4 rounded-full border border-sky-400/20 bg-sky-500/5 backdrop-blur-[2px]"></div>
            </>
          )}

          {/* Central Interactive Button */}
          <button
            onClick={toggleRadar}
            className={`relative z-20 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-2xl group active:scale-95 ${
              isRadarActive
                ? 'bg-slate-900/95 border-2 border-sky-400/80 shadow-sky-500/30 hover:border-sky-300 hover:shadow-sky-400/50 glow-cyan hover:scale-105'
                : 'bg-slate-900/80 border-2 border-slate-700/80 hover:border-slate-500 text-slate-500 hover:text-slate-300 hover:scale-105'
            }`}
            title={isRadarActive ? 'الرادار يعمل (انقر لإيقاف الرادار)' : 'الرادار متوقف (انقر لتشغيل الرادار)'}
          >
            {isRadarActive ? (
              <>
                <Radio className="w-10 h-10 text-sky-400 animate-pulse drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
                <span className="text-[10px] font-bold text-sky-300 mt-1 font-mono tracking-wider">نشط</span>
              </>
            ) : (
              <>
                <Power className="w-8 h-8 text-slate-500 group-hover:text-slate-300 transition-colors" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 mt-1">متوقف</span>
              </>
            )}
          </button>
        </div>

        {/* State Title and Interactive Hint */}
        <div 
          onClick={toggleRadar}
          className="cursor-pointer inline-block transition-transform hover:scale-[1.02] active:scale-95 mb-6"
        >
          <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 flex items-center justify-center gap-2">
            {isRadarActive ? (
              <>
                <span>جاري البحث عن أجهزة على الشبكة المحلية...</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </>
            ) : (
              <span className="text-slate-400">الرادار متوقف حالياً</span>
            )}
          </h3>

          <p className="text-xs text-slate-400 font-medium hover:text-sky-300 transition-colors">
            {isRadarActive 
              ? 'انقر على الدائرة لإيقاف الرادار ⏸️' 
              : 'انقر على الدائرة لتشغيل الرادار والبحث عن الأجهزة 📡'}
          </p>
        </div>

        {/* Bottom Area: Shows Device Cards when discovered, or Guide Cards when empty */}
        <div className="pt-6 border-t border-slate-800/80 text-right">
          {filteredPeers.length > 0 ? (
            /* Discovered Active Devices replacing the bottom cards */
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-sm font-bold text-white">الأجهزة المكتشفة والجاهزة للإرسال:</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
                  {filteredPeers.length} {filteredPeers.length === 1 ? 'جهاز' : 'أجهزة'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPeers.map((peer) => (
                  <DeviceCard key={peer.id} peer={peer} />
                ))}
              </div>
            </div>
          ) : (
            /* 3 Guide Boxes when no devices */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-300">
              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors">
                <div className="text-brand-400 font-bold text-xs mb-1">1. نفس الشبكة</div>
                <div className="text-[11px] text-slate-400">تأكد من اتصال الأجهزة بنفس راوتر الواي فاي.</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors">
                <div className="text-sky-400 font-bold text-xs mb-1">2. وضع الظهور</div>
                <div className="text-[11px] text-slate-400">تأكد من تفعيل زر "الجهاز مكشوف على الشبكة".</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors">
                <div className="text-purple-400 font-bold text-xs mb-1">3. هواتف الآيفون والأندرويد</div>
                <div className="text-[11px] text-slate-400">افتح الرابط في المتصفح دون الحاجة لتثبيت أي تطبيق.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
