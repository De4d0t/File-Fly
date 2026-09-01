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
  const { peers, myDevice, isScanning, setIsQrModalOpen } = useFileFly();

  return (
    <div className="w-full">
      {/* Active LAN Scanning Alert Banner */}
      {isScanning && (
        <div className="mb-6 flex items-center justify-between p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-medium animate-pulse">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-spin text-sky-400" />
            <span>جاري فحص جميع عناوين الشبكة المحلية (LAN Auto-Scan) لاكتشاف الأجهزة المتاحة...</span>
          </div>
          <span className="text-[11px] font-mono opacity-70">Port 53316</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              الأجهزة المكتشفة على الشبكة
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {peers.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              جميع الأجهزة المتصلة بنفس شبكة الواي فاي ووضع الظهور لديها مفعّل
            </p>
          </div>
        </div>

        {/* Quick QR Connect Button */}
        <button
          onClick={() => setIsQrModalOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500/10 to-brand-500/10 hover:from-sky-500/20 hover:to-brand-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-all group shadow-sm"
        >
          <QrCode className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
          <span>ربط هاتف أندرويد أو آيفون</span>
        </button>
      </div>

      {/* Grid or Empty State */}
      {peers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {peers.map((peer) => (
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
            تأكد من أن جهازك الآخر (كمبيوتر، هاتف أندرويد، أو آيفون) متصل بنفس شبكة الواي فاي وأن تطبيق FileFly مفتوح لديه.
          </p>

          {/* Action to connect phone */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition-all active:scale-95"
            >
              <QrCode className="w-5 h-5" />
              <span>إظهار رمز QR لمسحه بالهاتف</span>
            </button>
          </div>

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
