import React, { useState, useRef, useEffect } from 'react';
import { 
  Laptop, 
  Smartphone, 
  Monitor, 
  UploadCloud
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function DeviceCard({ peer }) {
  const { sendFilesToDevice } = useFileFly();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  // Determine icon, OS badge, and accent gradient
  const getDeviceDetails = (os) => {
    const lower = (os || '').toLowerCase();
    if (lower.includes('ios') || lower.includes('iphone') || lower.includes('ipad')) {
      return {
        icon: Smartphone,
        osLabel: 'iPhone / iPad',
        badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
        iconBg: 'bg-sky-600/20 text-sky-400 border border-sky-500/30',
        accent: 'from-sky-500/20 via-sky-500/5 to-transparent',
        glow: 'hover:shadow-[0_0_28px_rgba(56,189,248,0.13)]',
        dot: 'bg-sky-400',
      };
    }
    if (lower.includes('android')) {
      return {
        icon: Smartphone,
        osLabel: 'Android',
        badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
        iconBg: 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
        accent: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
        glow: 'hover:shadow-[0_0_28px_rgba(52,211,153,0.13)]',
        dot: 'bg-emerald-400',
      };
    }
    if (lower.includes('mac') || lower.includes('darwin')) {
      return {
        icon: Laptop,
        osLabel: 'macOS',
        badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
        iconBg: 'bg-purple-600/20 text-purple-400 border border-purple-500/30',
        accent: 'from-purple-500/20 via-purple-500/5 to-transparent',
        glow: 'hover:shadow-[0_0_28px_rgba(168,85,247,0.13)]',
        dot: 'bg-purple-400',
      };
    }
    if (lower.includes('linux')) {
      return {
        icon: Monitor,
        osLabel: 'Linux',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
        iconBg: 'bg-amber-600/20 text-amber-400 border border-amber-500/30',
        accent: 'from-amber-500/20 via-amber-500/5 to-transparent',
        glow: 'hover:shadow-[0_0_28px_rgba(251,191,36,0.13)]',
        dot: 'bg-amber-400',
      };
    }
    return {
      icon: Monitor,
      osLabel: 'Windows PC',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
      iconBg: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
      accent: 'from-blue-500/20 via-blue-500/5 to-transparent',
      glow: 'hover:shadow-[0_0_28px_rgba(96,165,250,0.13)]',
      dot: 'bg-blue-400',
    };
  };

  const { icon: DeviceIcon, osLabel, badgeColor, iconBg, accent, glow, dot } = getDeviceDetails(peer.os);

  useEffect(() => {
    const handleWindowDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const handleWindowDrop = (e) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    dragCounterRef.current++;
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      sendFilesToDevice(peer, files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length > 0) {
      sendFilesToDevice(peer, e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div
      dir="ltr"
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-w-0 w-full relative group overflow-hidden rounded-2xl transition-all duration-200 text-left cursor-pointer ${
        isDragOver
          ? 'bg-emerald-500/15 border-2 border-dashed border-emerald-400 shadow-2xl scale-[1.02]'
          : `glass-panel ${glow} hover:border-slate-600/80`
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

      {/* Accent gradient bar at top — color derived from OS type */}
      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${accent} opacity-90 pointer-events-none`} />
      {/* Subtle radial glow top-left */}
      <div className={`absolute -top-8 -left-6 w-32 h-32 rounded-full bg-gradient-to-br ${accent} opacity-50 pointer-events-none blur-xl`} />

      {/* Drag Over Overlay Alert */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm rounded-2xl border-2 border-dashed border-emerald-400 text-emerald-400 animate-in fade-in duration-150 p-4">
          <UploadCloud className="w-12 h-12 mb-2 animate-bounce text-emerald-400" />
          <p className="text-sm font-bold text-white">أفلت الملفات للإرسال فوراً إلى</p>
          <p className="text-xs font-semibold text-emerald-400 mt-1">{peer.name}</p>
        </div>
      )}

      {/* Card Body */}
      <div className="relative z-10 p-3.5 sm:p-4">

        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2.5 sm:mb-3">

          {/* Left: Avatar + Name + IP */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Glassy Device Avatar */}
            <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl ${iconBg} flex items-center justify-center shrink-0 shadow-md`}>
              <DeviceIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              {/* tiny online dot on avatar bottom-right */}
              <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dot} border-2 border-slate-900`} />
            </div>

            <div className="min-w-0 flex-1 flex flex-col gap-0.5 sm:gap-1">
              {/* Device Name */}
              <h3 className="font-bold text-xs sm:text-[13px] leading-tight text-white group-hover:text-sky-200 transition-colors truncate" title={peer.name}>
                {peer.name}
              </h3>
              {/* IP Badge */}
              <span className={`inline-flex items-center self-start px-1.5 py-[1.5px] rounded-md border text-[9px] font-mono tracking-wide ${badgeColor}`}>
                {peer.ip}
              </span>
            </div>
          </div>

          {/* Right: OS Pill */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 sm:py-1 rounded-full border text-[9.5px] sm:text-[10px] font-medium shrink-0 shadow-sm ${badgeColor}`}>
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dot}`} />
            </span>
            <span className="truncate max-w-[80px]">{osLabel}</span>
          </div>

        </div>

        {/* Divider */}
        <div className="w-full h-px bg-slate-700/40 mb-3" />

        {/* Interactive Drop & Click Upload Zone */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="w-full relative group/drop overflow-hidden rounded-xl p-3 border border-dashed border-slate-700/80 hover:border-emerald-400/80 bg-slate-900/40 hover:bg-emerald-500/10 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
          title="انقر لاختيار ملفات أو اسحب وأفلت الملفات هنا"
        >
          <UploadCloud className="w-4 h-4 text-emerald-400 group-hover/drop:scale-110 transition-transform shrink-0" />
          <span className="text-xs font-bold text-slate-200 group-hover/drop:text-emerald-300 transition-colors">
            اسحب الملفات هنا أو انقر للاختيار
          </span>
        </button>

      </div>
    </div>
  );
}
