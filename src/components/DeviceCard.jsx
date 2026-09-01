import React, { useState, useRef } from 'react';
import { 
  Laptop, 
  Smartphone, 
  Monitor, 
  Send, 
  FolderUp, 
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
  const folderInputRef = useRef(null);

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
      className={`relative group rounded-3xl p-5 transition-all duration-300 border ${
        isDragOver
          ? 'bg-brand-500/20 border-brand-400 shadow-2xl shadow-brand-500/30 scale-[1.03]'
          : 'glass-card hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/10'
      }`}
    >
      {/* Hidden File and Folder Inputs */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        type="file"
        multiple
        webkitdirectory="true"
        directory="true"
        ref={folderInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag Over Overlay Alert */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md rounded-3xl border-2 border-dashed border-brand-400 text-brand-400 animate-pulse">
          <Sparkles className="w-10 h-10 mb-2 animate-bounce" />
          <p className="text-sm font-bold">أفلت الملفات هنا للإرسال فوراً إلى</p>
          <p className="text-xs font-semibold text-white mt-1">{peer.name}</p>
        </div>
      )}

      {/* Card Header & Avatar */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-13 h-13 rounded-2xl ${iconBg} p-3 flex items-center justify-center text-white shadow-lg`}>
            <DeviceIcon className="w-7 h-7" />
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

        {/* Live Signal Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>متصل</span>
        </div>
      </div>

      {/* Drag Hint Subtext */}
      <div className="py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-400 text-center mb-4">
        اسحب وأفلت الملفات مباشرة على هذا الكرت للإرسال
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition-all active:scale-95"
        >
          <FileUp className="w-4 h-4" />
          <span>إرسال ملفات</span>
        </button>

        <button
          type="button"
          onClick={() => folderInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
        >
          <FolderUp className="w-4 h-4 text-amber-400" />
          <span>إرسال مجلد</span>
        </button>
      </div>
    </div>
  );
}
