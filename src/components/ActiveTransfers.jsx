import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Gauge, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  FolderOpen,
  DownloadCloud,
  Play,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  Package,
  File
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import { formatBytes, formatSpeed, calculateETA } from '../utils/formatters.js';

export default function ActiveTransfers() {
  const { activeTransfer, cancelActiveTransfer, openDownloadsFolder, openFile, isHostMachine } = useFileFly();

  if (!activeTransfer) return null;

  const isIncoming = activeTransfer.direction === 'incoming';
  const isWaitingApproval = activeTransfer.status === 'waiting_approval';
  const isCompleted = activeTransfer.status === 'completed';
  const isDeclined = activeTransfer.status === 'declined';
  const isTimeout = activeTransfer.status === 'timeout';
  const isError = activeTransfer.status === 'error';

  const remainingBytes = Math.max(0, (activeTransfer.totalBytes || 0) - (activeTransfer.bytesTransferred || 0));
  const eta = calculateETA(remainingBytes, activeTransfer.speedBps);

  // Helper for file type mini icon
  const getFileIcon = (filename = '') => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic'].includes(ext)) {
      return <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (['mp4', 'mkv', 'mov', 'webm', 'avi'].includes(ext)) {
      return <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    }
    if (['mp3', 'wav', 'flac', 'm4a', 'aac'].includes(ext)) {
      return <Music className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    }
    if (['exe', 'msi', 'apk'].includes(ext)) {
      return <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[420px] max-w-full z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div 
        className={`rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-5 border shadow-2xl transition-all duration-300 ${
          isDeclined || isError
            ? 'border-red-500/50 shadow-red-500/20 bg-slate-950/95 glow-red'
            : isTimeout
            ? 'border-amber-500/50 shadow-amber-500/20 bg-slate-950/95'
            : isCompleted
            ? 'border-emerald-500/50 shadow-emerald-500/20 bg-slate-950/95 glow-green'
            : 'border-sky-500/40 shadow-sky-500/20 bg-slate-950/95 glow-cyan'
        }`}
        dir="rtl"
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Status Avatar */}
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isDeclined || isError
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                  : isTimeout
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                  : isCompleted
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/20'
                  : isIncoming
                  ? 'bg-gradient-to-tr from-sky-600 to-indigo-500 text-white'
                  : 'bg-gradient-to-tr from-brand-600 to-emerald-500 text-white'
              }`}
            >
              {isDeclined || isError ? (
                <XCircle className="w-5 h-5 text-red-400 animate-pulse" />
              ) : isTimeout ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : isIncoming ? (
                <ArrowDownLeft className="w-5 h-5 animate-pulse" />
              ) : (
                <ArrowUpRight className="w-5 h-5 animate-pulse" />
              )}
            </div>

            {/* Title & File Info */}
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                {isDeclined
                  ? activeTransfer.isReceiverDeclined
                    ? 'تم رفض استلام الملف ❌'
                    : 'تم رفض الطلب من قبل المستلم ❌'
                  : isTimeout
                  ? 'انتهت مهلة الانتظار ⚠️'
                  : isError
                  ? 'تعذر إتمام النقل ❌'
                  : isCompleted
                  ? 'اكتمل النقل بنجاح! 🎉'
                  : isWaitingApproval
                  ? 'في انتظار موافقة المستلم...'
                  : isIncoming
                  ? `استقبال من ${activeTransfer.partnerName}`
                  : `إرسال إلى ${activeTransfer.partnerName}`}
              </div>

              {/* File details pill with mini-icon */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-300 overflow-hidden">
                <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800 shrink-0">
                  {getFileIcon(activeTransfer.firstFileName)}
                  <span className="truncate max-w-[150px] font-medium text-slate-200" title={activeTransfer.firstFileName}>
                    {activeTransfer.firstFileName}
                  </span>
                  {activeTransfer.filesCount > 1 && (
                    <span className="text-[10px] text-sky-400 font-mono">
                      (+{activeTransfer.filesCount - 1})
                    </span>
                  )}
                </span>
                
                {/* File size in clean LTR mono */}
                <span className="text-slate-400 font-mono text-[10px] shrink-0" dir="ltr">
                  {formatBytes(activeTransfer.totalBytes)}
                </span>
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={cancelActiveTransfer}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="إغلاق"
          >
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Status: Declined Banner */}
        {isDeclined && (
          <div className="flex items-center gap-2 py-2.5 px-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-in fade-in duration-200">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>
              {activeTransfer.isReceiverDeclined
                ? 'لقد قمت برفض استقبال هذا الملف.'
                : `قام ${activeTransfer.partnerName || 'المستلم'} برفض طلب نقل الملف.`}
            </span>
          </div>
        )}

        {/* Status: Timeout Banner */}
        {isTimeout && (
          <div className="flex items-center gap-2 py-2.5 px-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>لم تتم الاستجابة لطلب النقل في الوقت المحدد.</span>
          </div>
        )}

        {/* Status: Waiting for approval */}
        {isWaitingApproval && (
          <div className="flex items-center gap-2 py-2.5 px-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>طلب النقل معروض على شاشة المستلم للموافقة...</span>
          </div>
        )}

        {/* Status: Active Transfer Progress Bar & Live Metrics */}
        {!isWaitingApproval && !isDeclined && !isTimeout && !isError && (
          <div className="space-y-2.5">
            {/* Progress Bar with Moving Gradient Shimmer */}
            <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-sky-500 via-brand-500 to-emerald-400'
                }`}
                style={{ width: `${activeTransfer.percentage || 0}%` }}
              />
            </div>

            {/* Metrics Info Row (Transferring State) */}
            {!isCompleted && (
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-0.5">
                {/* Bytes Transferred Progress (Always LTR to avoid broken text wrapping) */}
                <div className="flex items-center gap-1.5" dir="ltr">
                  <span className="font-bold text-white font-mono">
                    {activeTransfer.percentage || 0}%
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">
                    {formatBytes(activeTransfer.bytesTransferred)} / {formatBytes(activeTransfer.totalBytes)}
                  </span>
                </div>

                {/* Speed & ETA */}
                <div className="flex items-center gap-2" dir="ltr">
                  <div className="flex items-center gap-1 text-sky-400 font-semibold text-[11px]">
                    <Gauge className="w-3 h-3" />
                    <span>{formatSpeed(activeTransfer.speedBps)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                    <Clock className="w-3 h-3" />
                    <span>{eta}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Completed Transfer Stats Banner */}
            {isCompleted && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5 pb-1">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم النقل بنجاح (100%)</span>
                </span>
                <span className="font-mono text-slate-400 text-[11px] bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800" dir="ltr">
                  {formatBytes(activeTransfer.totalBytes)}
                </span>
              </div>
            )}

            {/* Dedicated Action Buttons Row (Full Width, Never Wraps Text) */}
            {isCompleted && isIncoming && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {isHostMachine ? (
                  <>
                    {/* Option 1: Open / Play File */}
                    <button
                      onClick={() => openFile(activeTransfer)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-brand-600 hover:from-sky-400 hover:to-brand-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 glow-cyan"
                      title="تشغيل أو فتح الملف المستلم مباشرة"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-white shrink-0" />
                      <span className="whitespace-nowrap">فتح الملف</span>
                    </button>

                    {/* Option 2: Open Containing Folder */}
                    <button
                      onClick={() => openDownloadsFolder(activeTransfer)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-emerald-500/40 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                      title="فتح مجلد التنزيلات وتحديد الملف المستلم"
                    >
                      <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="whitespace-nowrap">فتح المجلد</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Mobile Save & Download */}
                    <a
                      href={`/api/transfer/download/${activeTransfer.id}/0`}
                      download={activeTransfer.firstFileName}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 glow-green"
                      title="حفظ وتنزيل الملف في الهاتف"
                    >
                      <DownloadCloud className="w-4 h-4 text-white shrink-0" />
                      <span className="whitespace-nowrap">حفظ في الهاتف</span>
                    </a>

                    {/* Mobile Preview / View */}
                    <a
                      href={`/api/transfer/view/${activeTransfer.id}/0`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                      title="معاينة الملف في المتصفح"
                    >
                      <Play className="w-3.5 h-3.5 text-sky-400 fill-current shrink-0" />
                      <span className="whitespace-nowrap">معاينة الملف</span>
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
