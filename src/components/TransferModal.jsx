import React, { useEffect } from 'react';
import { 
  DownloadCloud, 
  Check, 
  X, 
  FileText, 
  HardDrive, 
  ShieldCheck,
  Smartphone,
  Laptop
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import { formatBytes, getFileTypeCategory } from '../utils/formatters.js';
import { playTransferRequestSound } from '../utils/soundEffects.js';

export default function TransferModal() {
  const { pendingIncomingRequest, respondToIncomingRequest } = useFileFly();

  useEffect(() => {
    if (pendingIncomingRequest) {
      playTransferRequestSound();
    }
  }, [pendingIncomingRequest?.id]);

  if (!pendingIncomingRequest) return null;

  const { sender, files, totalBytes } = pendingIncomingRequest;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl glass-panel p-5 sm:p-8 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 animate-in fade-in zoom-in-95 duration-200">
        {/* Glow Header Icon */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 glow-green shrink-0">
            <DownloadCloud className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                طلب استلام ملف جديد
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5 sm:mt-1">
              {sender?.name || 'جهاز غير معروف'}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400">
              يرغب في إرسال {files?.length} ملف ({formatBytes(totalBytes)})
            </p>
          </div>
        </div>

        {/* Files Preview List */}
        <div className="rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 p-3 sm:p-4 mb-4 sm:mb-6 max-h-40 sm:max-h-52 overflow-y-auto space-y-2">
          {files?.map((file, idx) => {
            const { label, color } = getFileTypeCategory(file.name);
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-2.5 p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-800/50 border border-slate-700/40 text-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold border ${color} shrink-0`}>
                    {label}
                  </span>
                  <span className="text-slate-200 font-medium truncate text-[11px] sm:text-xs">
                    {file.name}
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[10px] sm:text-xs shrink-0">
                  {formatBytes(file.size)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => respondToIncomingRequest('accept')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 glow-green"
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>قبول النقل</span>
          </button>

          <button
            type="button"
            onClick={() => respondToIncomingRequest('decline')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-red-500/20 hover:border-red-500/40 text-slate-300 hover:text-red-400 font-semibold text-xs sm:text-sm border border-slate-700 transition-all active:scale-95"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>رفض الطلب</span>
          </button>
        </div>
      </div>
    </div>
  );
}
