import React, { useState, useRef } from 'react';
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

  // Determine icon and OS badge
  const getDeviceDetails = (os) => {
    const lower = (os || '').toLowerCase();
    if (lower.includes('ios') || lower.includes('iphone') || lower.includes('ipad')) {
      return {
        icon: Smartphone,
        osLabel: 'iPhone / iPad',
        badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        iconBg: 'bg-sky-600/20 text-sky-400 border border-sky-500/30',
      };
    }
    if (lower.includes('android')) {
      return {
        icon: Smartphone,
        osLabel: 'Android',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        iconBg: 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
      };
    }
    if (lower.includes('mac') || lower.includes('darwin')) {
      return {
        icon: Laptop,
        osLabel: 'macOS',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        iconBg: 'bg-purple-600/20 text-purple-400 border border-purple-500/30',
      };
    }
    return {
      icon: Monitor,
      osLabel: 'Windows PC',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      iconBg: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
    };
  };

  const { icon: DeviceIcon, osLabel, badgeColor, iconBg } = getDeviceDetails(peer.os);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      sendFilesToDevice(peer, e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      sendFilesToDevice(peer, e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div
      dir="ltr"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 transition-all duration-200 border text-left ${
        isDragOver
          ? 'bg-sky-500/15 border-sky-400 shadow-xl scale-[1.01]'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 shadow-lg'
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
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl sm:rounded-3xl border-2 border-dashed border-sky-400 text-sky-400 p-4">
          <UploadCloud className="w-10 h-10 mb-2 animate-bounce text-sky-400" />
          <p className="text-sm font-bold text-white">Drop files to send to</p>
          <p className="text-xs font-semibold text-sky-400 mt-0.5">{peer.name}</p>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
            <DeviceIcon className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors truncate">
              {peer.name}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
              <span className={`text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-md border ${badgeColor}`}>
                {osLabel}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {peer.ip}
              </span>
            </div>
          </div>
        </div>

        {/* Online Indicator with pulsing ring */}
        <span className="relative flex h-2 w-2 mt-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      {/* Direct Drop / Pick Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-xl sm:rounded-2xl py-2.5 sm:py-3 px-3 border border-dashed border-sky-500/30 hover:border-sky-400 bg-sky-500/5 hover:bg-sky-500/15 text-sky-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] group/btn shadow-sm"
      >
        <UploadCloud className="w-4 h-4 text-sky-400 group-hover/btn:-translate-y-0.5 transition-transform shrink-0" />
        <span className="text-xs font-bold text-slate-200 group-hover/btn:text-white">
          Choose Files to Send
        </span>
      </button>
    </div>
  );
}
