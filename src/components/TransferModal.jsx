import React from 'react';
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

export default function TransferModal() {
  const { pendingIncomingRequest, respondToIncomingRequest } = useFileFly();

  if (!pendingIncomingRequest) return null;

  const { sender, files, totalBytes } = pendingIncomingRequest;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 animate-in fade-in zoom-in-95 duration-200">
        {/* Glow Header Icon */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 glow-green">
            <DownloadCloud className="w-8 h-8 animate-bounce" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                طلب استلام ملف جديد
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              {sender?.name || 'جهاز غير معروف'}
            </h3>
            <p className="text-xs text-slate-400">
              يرغب في إرسال {files?.length} ملف ({formatBytes(totalBytes)})
            </p>
          </div>
        </div>

        {/* Files Preview List */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 mb-6 max-h-52 overflow-y-auto space-y-2.5">
          {files?.map((file, idx) => {
            const { label, color } = getFileTypeCategory(file.name);
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${color}`}>
                    {label}
                  </span>
                  <span className="text-slate-200 font-medium truncate">
                    {file.name}
                  </span>
                </div>
                <span className="text-slate-400 font-mono shrink-0">
                  {formatBytes(file.size)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => respondToIncomingRequest('accept')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 glow-green"
          >
            <Check className="w-5 h-5" />
            <span>قبول النقل</span>
          </button>

          <button
            type="button"
            onClick={() => respondToIncomingRequest('decline')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-red-500/20 hover:border-red-500/40 text-slate-300 hover:text-red-400 font-semibold text-sm border border-slate-700 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
            <span>رفض الطلب</span>
          </button>
        </div>
      </div>
    </div>
  );
}
