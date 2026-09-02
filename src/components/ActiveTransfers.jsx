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
  Play
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

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom-6 duration-300">
      <div 
        className={`rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-5 border shadow-2xl transition-all duration-300 ${
          isDeclined || isError
            ? 'border-red-500/50 shadow-red-500/20 bg-slate-950/95 glow-red'
            : isTimeout
            ? 'border-amber-500/50 shadow-amber-500/20 bg-slate-950/95'
            : isCompleted
            ? 'border-emerald-500/50 shadow-emerald-500/20 glow-green'
            : 'border-sky-500/40 shadow-sky-500/20 glow-cyan'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                isDeclined || isError
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                  : isTimeout
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                  : isCompleted
                  ? 'bg-emerald-600 text-white'
                  : isIncoming
                  ? 'bg-gradient-to-tr from-sky-600 to-indigo-500'
                  : 'bg-gradient-to-tr from-brand-600 to-emerald-500'
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

            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
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

              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                {activeTransfer.firstFileName}
                {activeTransfer.filesCount > 1 && ` (+${activeTransfer.filesCount - 1})`}
              </div>
            </div>
          </div>

          {/* Dismiss / Cancel button */}
          <button
            onClick={cancelActiveTransfer}
            className="p-1 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
            title="إغلاق"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Status: Declined Banner */}
        {isDeclined && (
          <div className="flex items-center gap-2 py-3 px-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-in fade-in duration-200">
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
          <div className="flex items-center gap-2 py-3 px-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>لم تتم الاستجابة لطلب النقل في الوقت المحدد.</span>
          </div>
        )}

        {/* Status: Waiting for approval indicator */}
        {isWaitingApproval && (
          <div className="flex items-center gap-2 py-3 px-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>طلب النقل معروض على شاشة المستلم للموافقة...</span>
          </div>
        )}

        {/* Status: Transferring or Completed Progress */}
        {!isWaitingApproval && !isDeclined && !isTimeout && !isError && (
          <>
            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-sky-500 via-brand-500 to-emerald-400'
                }`}
                style={{ width: `${activeTransfer.percentage || 0}%` }}
              />
            </div>

            {/* Metrics Grid */}
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-1">
                <span className="font-bold text-white font-mono">
                  {activeTransfer.percentage || 0}%
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono">
                  {formatBytes(activeTransfer.bytesTransferred)} / {formatBytes(activeTransfer.totalBytes)}
                </span>
              </div>

              {/* Speedometer and ETA */}
              {!isCompleted && (
                <div className="flex items-center gap-2 font-mono">
                  <div className="flex items-center gap-1 text-sky-400 font-semibold">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>{formatSpeed(activeTransfer.speedBps)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>{eta}</span>
                  </div>
                </div>
              )}

              {isCompleted && isIncoming && (
                <div className="flex items-center gap-2">
                  {isHostMachine ? (
                    <>
                      {/* Option 1: Open / Play File */}
                      <button
                        onClick={() => openFile(activeTransfer)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-bold text-sky-300 hover:text-white transition-all shadow-sm active:scale-95 glow-cyan"
                        title="تشغيل أو فتح الملف المستلم مباشرة"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-sky-400" />
                        <span>فتح الملف</span>
                      </button>

                      {/* Option 2: Open Containing Folder */}
                      <button
                        onClick={() => openDownloadsFolder(activeTransfer)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:text-white transition-all shadow-sm active:scale-95 glow-green"
                        title="فتح مجلد التنزيلات وتحديد الملف المستلم في Windows Explorer"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                        <span>فتح المجلد</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Mobile Save & Download */}
                      <a
                        href={`/api/transfer/download/${activeTransfer.id}/0`}
                        download={activeTransfer.firstFileName}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 glow-green"
                        title="حفظ وتنزيل الملف في الهاتف"
                      >
                        <DownloadCloud className="w-4 h-4 text-slate-950" />
                        <span>حفظ في الهاتف</span>
                      </a>

                      {/* Mobile Preview / View */}
                      <a
                        href={`/api/transfer/view/${activeTransfer.id}/0`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all active:scale-95"
                        title="معاينة الملف في المتصفح"
                      >
                        <Play className="w-3.5 h-3.5 text-sky-400 fill-current" />
                        <span>معاينة</span>
                      </a>
                    </>
                  )}
                </div>
              )}

              {isCompleted && !isIncoming && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم التسليم</span>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
