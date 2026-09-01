import React, { useState, useRef } from 'react';
import { 
  Laptop, 
  Smartphone, 
  Monitor, 
  UploadCloud, 
  FileUp, 
  Radio, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function DeviceCard({ peer }) {
  const { sendFilesToDevice } = useFileFly();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Determine icon and OS badge
  const getDeviceDetails = (os) => {
    const lower = (os || '').toLowerCase();
    if (lower.includes('ios') || lower.includes('iphone') || lower.includes('ipad')) {
      return {
        icon: Smartphone,
        osLabel: 'iOS / iPhone',
        badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        iconBg: 'bg-gradient-to-tr from-sky-600 to-indigo-500',
      };
    }
    if (lower.includes('android')) {
      return {
        icon: Smartphone,
        osLabel: 'Android',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
      };
    }
    if (lower.includes('mac') || lower.includes('darwin')) {
      return {
        icon: Laptop,
        osLabel: 'macOS',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        iconBg: 'bg-gradient-to-tr from-purple-600 to-pink-500',
      };
    }
    return {
      icon: Monitor,
      osLabel: 'Windows PC',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-cyan-500',
    };
  };

  const { icon: DeviceIcon, osLabel, badgeColor, iconBg } = getDeviceDetails(peer.os);

  // Handle Drag & Drop directly over this specific card
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      sendFilesToDevice(peer, e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      sendFilesToDevice(peer, e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group overflow-hidden rounded-3xl p-5 transition-all duration-300 border ${
        isDragOver
          ? 'bg-emerald-500/20 border-emerald-400 shadow-2xl shadow-emerald-500/30 scale-[1.02]'
          : 'glass-card hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/10'
      }`}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag Over Overlay Alert */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md rounded-3xl border-2 border-dashed border-emerald-400 text-emerald-400 animate-in fade-in zoom-in-95 duration-150">
          <UploadCloud className="w-12 h-12 mb-2 animate-bounce text-emerald-400" />
          <p className="text-sm font-bold text-white">أفلت الملفات هنا للإرسال فوراً إلى</p>
          <p className="text-xs font-semibold text-emerald-400 mt-1">{peer.name}</p>
        </div>
      )}

      {/* Card Header & Avatar */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl ${iconBg} p-2.5 flex items-center justify-center text-white shadow-lg`}>
            <DeviceIcon className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-bold text-base text-white group-hover:text-sky-300 transition-colors line-clamp-1">
              {peer.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${badgeColor}`}>
                {osLabel}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {peer.ip}
              </span>
            </div>
          </div>
        </div>

        {/* Live Signal Indicator (Polished Emerald Pulse Beacon) */}
        <div 
          className="relative flex items-center justify-center p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm"
          title="الجهاز متصل وجاهز لنقل الملفات"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>
          </span>
        </div>
      </div>

      {/* Interactive Drop & Click Upload Zone */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full relative group/drop overflow-hidden rounded-2xl p-4 border border-dashed border-slate-700/80 hover:border-emerald-400/80 bg-slate-900/40 hover:bg-emerald-500/10 transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-inner"
        title="انقر لاختيار ملفات أو اسحب وأفلت الملفات هنا"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover/drop:bg-emerald-500/25 group-hover/drop:border-emerald-500/40 group-hover/drop:scale-110 group-hover/drop:shadow-lg group-hover/drop:shadow-emerald-500/25 flex items-center justify-center transition-all duration-300">
          <UploadCloud className="w-5 h-5 group-hover/drop:-translate-y-0.5 transition-transform" />
        </div>

        <div className="text-center">
          <p className="text-xs font-bold text-slate-200 group-hover/drop:text-emerald-300 transition-colors">
            اسحب الملفات هنا أو انقر للاختيار
          </p>
          <p className="text-[10px] text-slate-500 group-hover/drop:text-slate-300 mt-0.5 transition-colors">
            نقل فوري وسريع عبر الشبكة
          </p>
        </div>
      </button>
    </div>
  );
}

