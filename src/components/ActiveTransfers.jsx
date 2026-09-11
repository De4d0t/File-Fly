import React, { useRef, useEffect, useState } from 'react';
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
  Eye,
  Check,
  X,
  Smartphone,
  Laptop,
  Monitor,
  Move,
  GripVertical
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import { formatBytes, formatSpeed, calculateETA } from '../utils/formatters.js';

export default function ActiveTransfers() {
  const { 
    activeTransfer, 
    cancelActiveTransfer, 
    removeSenderFile,
    dismissActiveTransfer, 
    openFile, 
    isHostMachine, 
    isMobileClient,
    myDevice
  } = useFileFly();

  const transferId = activeTransfer?.id;
  const firstFileName = activeTransfer?.firstFileName;
  const isIncoming = activeTransfer?.direction === 'incoming';
  const isCompleted = activeTransfer?.status === 'completed';
  const isIOS = Boolean(typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent || ''));
  const isMobile = Boolean(isMobileClient || isIOS || (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '')));

  const isServerHost = Boolean(
    isHostMachine || 
    myDevice?.isHost || 
    (typeof window !== 'undefined' && (
      window.fileflyDesktop ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      localStorage.getItem('filefly_is_host') === 'true'
    ))
  );

  const autoDownloadedRef = useRef(false);
  const [senderCountdown, setSenderCountdown] = useState(60);

  useEffect(() => {
    if (activeTransfer?.status === 'waiting_approval') {
      setSenderCountdown(60);
      const interval = setInterval(() => {
        setSenderCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [transferId, activeTransfer?.status]);

  useEffect(() => {
    autoDownloadedRef.current = false;
  }, [transferId]);

  // Auto-trigger browser download ONLY on remote clients (phones, tablets, other PCs)
  // Auto-trigger browser download ONLY on remote clients (phones, tablets, other PCs)
  // Server machine ALREADY has files written to disk by the backend; downloading again creates duplicates!
  useEffect(() => {
    if (isCompleted && isIncoming && !isServerHost && transferId && !autoDownloadedRef.current) {
      autoDownloadedRef.current = true;
      try {
        const files = activeTransfer?.files || [];
        if (files.length > 1) {
          // Download each file individually without ZIP compression so phones can open them directly!
          files.forEach((file, index) => {
            setTimeout(() => {
              const targetFileName = file.name || `file_${index}`;
              const link = document.createElement('a');
              link.href = `/api/transfer/download/${transferId}/${index}`;
              link.setAttribute('download', targetFileName);
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                try { document.body.removeChild(link); } catch (_) {}
              }, 1000);
            }, index * 700);
          });
        } else {
          const targetFileName = files[0]?.name || firstFileName || 'file';
          const link = document.createElement('a');
          link.href = `/api/transfer/download/${transferId}/0`;
          link.setAttribute('download', targetFileName);
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            try { document.body.removeChild(link); } catch (_) {}
          }, 1000);
        }
      } catch (err) {
        console.warn('[FileFly] Auto-download error:', err);
      }
    }
  }, [isCompleted, isIncoming, isServerHost, transferId, firstFileName, activeTransfer?.files]);

  // On iOS: Dismiss completed incoming transfer locally after all downloads have been initiated
  useEffect(() => {
    if (isCompleted && isIncoming && isIOS) {
      const fileCount = activeTransfer?.files?.length || 1;
      const delay = fileCount > 1 ? (fileCount * 700) + 1500 : 1500;
      const timer = setTimeout(() => {
        dismissActiveTransfer();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, isIncoming, isIOS, activeTransfer?.files?.length, dismissActiveTransfer]);

  if (!activeTransfer) return null;

  // On iOS: Hide completed incoming modal completely so native iOS download prompt is unobstructed
  if (isIncoming && isCompleted && isIOS) return null;

  const isWaitingApproval = activeTransfer.status === 'waiting_approval';
  const isDeclined = activeTransfer.status === 'declined';
  const isTimeout = activeTransfer.status === 'timeout';
  const isError = activeTransfer.status === 'error';

  const remainingBytes = Math.max(0, (activeTransfer.totalBytes || 0) - (activeTransfer.bytesTransferred || 0));
  const eta = calculateETA(remainingBytes, activeTransfer.speedBps);

  // Helper for file type mini icon
  const getFileIcon = (filename = '') => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (['mp4', 'mkv', 'mov', 'webm', 'avi'].includes(ext)) {
      return <Film className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (['mp3', 'wav', 'flac', 'm4a', 'aac'].includes(ext)) {
      return <Music className="w-4 h-4 text-pink-400 shrink-0" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-4 h-4 text-yellow-400 shrink-0" />;
    }
    if (['exe', 'msi', 'apk'].includes(ext)) {
      return <Package className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
  };

  // Download all files sequentially
  const handleDownloadAll = () => {
    const filesList = activeTransfer?.files || [];
    if (filesList.length === 0) {
      const link = document.createElement('a');
      link.href = `/api/transfer/download/${activeTransfer.id}/0`;
      link.download = activeTransfer.firstFileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    filesList.forEach((file, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = `/api/transfer/download/${activeTransfer.id}/${index}`;
        link.download = file.name || `file_${index}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 400);
    });
  };

  // ══════════════════════════════════════════════════════════════════════
  // 1. DEDICATED CENTERED MODAL FOR INCOMING RECEIVING & COMPLETION
  // ══════════════════════════════════════════════════════════════════════
  if (isIncoming) {
    const filesList = activeTransfer?.files || [
      { name: activeTransfer.firstFileName, size: activeTransfer.totalBytes }
    ];

    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
        <div 
          className={`relative w-full max-w-md rounded-3xl glass-panel p-5 sm:p-6 border shadow-2xl transition-all duration-300 text-right overflow-hidden my-auto max-h-[92vh] flex flex-col ${
            isCompleted 
              ? 'border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.2)]' 
              : isDeclined 
              ? 'border-rose-500/40 shadow-[0_0_60px_rgba(244,63,94,0.15)]'
              : 'border-sky-500/40 shadow-[0_0_60px_rgba(56,189,248,0.15)]'
          }`}
          dir="rtl"
        >
          {/* Subtle Ambient Glow */}
          <div 
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-56 h-28 rounded-full blur-3xl pointer-events-none ${
              isCompleted ? 'bg-emerald-500/20' : isDeclined ? 'bg-rose-500/15' : 'bg-sky-500/15'
            }`} 
          />

          {/* Top Header Bar */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-800/60">
            {!isCompleted ? (
              <span 
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isDeclined
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                    : 'bg-sky-500/15 border border-sky-500/30 text-sky-400 glow-cyan'
                }`}
              >
                {isDeclined ? (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>تم إلغاء الاستلام</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                    </span>
                    <span>جاري استلام الملفات...</span>
                  </>
                )}
              </span>
            ) : (
              <div />
            )}

            {/* Dismiss Button */}
            <button
              onClick={isCompleted ? dismissActiveTransfer : cancelActiveTransfer}
              className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="إغلاق النافذة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── State A: COMPLETED SUCCESS ── */}
          {isCompleted && (
            <div className="flex-1 flex flex-col items-center text-center">
              {/* Animated Success Badge */}
              <div className="relative mb-3 w-20 h-20 flex items-center justify-center animate-in zoom-in-50 duration-300">
                <div className="absolute inset-0 rounded-full bg-emerald-500/15 border border-emerald-400/30 animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                  <Check className="w-8 h-8 stroke-[2.5]" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
                اكتمل استلام الملفات بنجاح!
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 mb-3 max-w-xs leading-relaxed">
                تم استلام <span className="font-bold text-white">{activeTransfer.filesCount} {activeTransfer.filesCount === 1 ? 'ملف' : 'ملفات'}</span> بحجم{' '}
                <span className="font-mono text-emerald-400 font-bold" dir="ltr">{formatBytes(activeTransfer.totalBytes)}</span> من{' '}
                <span className="font-semibold text-white">{activeTransfer.partnerName}</span>.
              </p>

              {/* On Mobile: Clear Confirmation Banner */}
              {isMobile && (
                <div className="w-full p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-center gap-2 mb-3 shadow-inner">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {activeTransfer.batch
                      ? `تم استلام الملف (${activeTransfer.batch.current} من ${activeTransfer.batch.total}) بنجاح.`
                      : filesList.length > 1
                      ? `تم استلام وحفظ ${filesList.length} ملفات بشكل منفصل في تنزيلات هاتفك بنجاح.`
                      : 'تم استلام الملف وحفظه في تنزيلات هاتفك بنجاح.'}
                  </span>
                </div>
              )}

              {/* Card Header Title with FolderOpen Icon */}
              <div className="w-full flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5 px-1">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <FolderOpen className="w-4 h-4 text-emerald-400" />
                  <span>{activeTransfer.batch ? `الملف المستلم (${activeTransfer.batch.current} من ${activeTransfer.batch.total})` : 'الملف المستلم'}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400" dir="ltr">
                  {formatBytes(activeTransfer.totalBytes)}
                </span>
              </div>

              {/* Received Files List */}
              <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-800 p-2.5 mb-2.5 max-h-48 overflow-y-auto space-y-2 text-right">
                {filesList.map((file, idx) => {
                  const resolvedPath = file.savedPath || activeTransfer.savedPath || activeTransfer.files?.[idx]?.savedPath || activeTransfer.historyItem?.savedPath || file.name || activeTransfer.firstFileName;

                  return (
                    <div
                      key={idx}
                      draggable={!isMobile}
                      onDragStart={(e) => {
                        if (isMobile) return;
                        if (window.fileflyDesktop?.startDrag) {
                          e.preventDefault();
                          window.fileflyDesktop.startDrag(resolvedPath);
                        } else {
                          try {
                            const fileIndex = idx !== undefined ? idx : 0;
                            const downloadUrl = `/api/transfer/download/${activeTransfer.id}/${fileIndex}`;
                            const fullUrl = new URL(downloadUrl, window.location.origin).href;
                            const mime = file.type || 'application/octet-stream';
                            const name = file.name || activeTransfer.firstFileName || 'file';
                            e.dataTransfer.setData('DownloadURL', `${mime}:${name}:${fullUrl}`);
                            e.dataTransfer.setData('text/uri-list', fullUrl);
                            e.dataTransfer.setData('text/plain', fullUrl);
                          } catch (err) {
                            console.warn('Drag dataTransfer error:', err);
                          }
                        }
                      }}
                      className={`flex items-center justify-between gap-2.5 p-2 rounded-xl border bg-slate-800/60 border-slate-700/60 transition-all select-none ${
                        !isMobile ? 'hover:bg-slate-800 hover:border-emerald-500/50 cursor-grab active:cursor-grabbing group' : ''
                      }`}
                      title={!isMobile ? 'اسحب هذا الملف بالفأرة وأفلته في سطح المكتب مباشرة' : file.name}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-700/70">
                          {getFileIcon(file.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white truncate" title={file.name}>
                            {file.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                            {formatBytes(file.size || activeTransfer.totalBytes)}
                          </div>
                        </div>
                      </div>

                      {/* On PC: Mouse Drag Handle | On Mobile: Saved Badge & Direct Download Link */}
                      {!isMobile ? (
                        <div 
                          className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center group-hover:bg-emerald-500/25 group-hover:border-emerald-400/60 group-hover:scale-105 transition-all shrink-0 cursor-grab active:cursor-grabbing shadow-sm"
                          title="اسحب هذا الملف بالفأرة وأفلته في سطح المكتب مباشرة"
                        >
                          <Move className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                        </div>
                      ) : (
                        <a
                          href={`/api/transfer/download/${activeTransfer.id}/${idx}`}
                          download={file.name || `file_${idx}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold shrink-0 transition-colors"
                          title="انقر لتنزيل أو فتح هذا الملف"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>تم الحفظ</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Drag Hint - Only on PC / Laptop with mouse */}
              {!isMobile && (
                <div className="w-full text-[11px] text-emerald-300/90 flex items-center justify-center gap-1.5 mb-1 bg-emerald-950/20 py-1.5 px-3 rounded-xl border border-emerald-500/20">
                  <Move className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>اسحب الملف بالفأرة إلى سطح المكتب مباشرة!</span>
                </div>
              )}
            </div>
          )}

          {/* ── State B: TRANSFERRING IN PROGRESS ── */}
          {!isCompleted && !isDeclined && (
            <div className="flex-1 flex flex-col items-center text-center">
              {/* Live Big Percentage Circle */}
              <div className="relative my-2 w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-sky-400 transition-all duration-300 ease-out"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * (activeTransfer.percentage || 0)) / 100}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold font-mono text-white tracking-tight" dir="ltr">
                    {activeTransfer.percentage || 0}%
                  </span>
                  <span className="text-[10px] text-sky-400 font-medium">مكتمل</span>
                </div>
              </div>

              <h4 className="text-base font-bold text-white mb-1">
                جاري استلام الملفات الآن
              </h4>
              <p className="text-xs text-slate-400 mb-4 truncate max-w-xs">
                من جهاز: <span className="text-sky-300 font-semibold">{activeTransfer.partnerName}</span>
              </p>

              {/* High-legibility Linear Progress Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 transition-all duration-200 rounded-full"
                  style={{ width: `${activeTransfer.percentage || 0}%` }}
                />
              </div>

              {/* Real-time Metrics Card */}
              <div className="w-full grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-mono mb-4">
                <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                    <Gauge className="w-3 h-3 text-sky-400" />
                    السرعة الحالية
                  </span>
                  <span className="text-xs font-bold text-white font-mono" dir="ltr">
                    {formatSpeed(activeTransfer.speedBps)}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                    <Clock className="w-3 h-3 text-amber-400" />
                    الوقت المتبقي
                  </span>
                  <span className="text-xs font-bold text-white font-mono" dir="ltr">
                    {eta}
                  </span>
                </div>
              </div>

              {/* Data transferred breakdown */}
              <div className="w-full flex items-center justify-between text-xs text-slate-400 px-1 mb-4 font-mono" dir="ltr">
                <span>{formatBytes(activeTransfer.bytesTransferred)}</span>
                <span className="text-slate-600">/</span>
                <span>{formatBytes(activeTransfer.totalBytes)}</span>
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={cancelActiveTransfer}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-500/15 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 border border-slate-800 text-xs font-medium transition-colors"
              >
                إلغاء الاستلام
              </button>
            </div>
          )}

          {/* ── State C: DECLINED / CANCELLED ── */}
          {isDeclined && (
            <div className="flex-1 flex flex-col items-center text-center py-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
                <XCircle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                تم إلغاء عملية الاستلام
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                تم إلغاء نقل الملف من قبل أحد الطرفين.
              </p>
              <button
                type="button"
                onClick={cancelActiveTransfer}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs font-semibold transition-colors"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // 2. SLEEK FLOATING NOTIFICATION CARD FOR SENDER (OUTGOING)
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed bottom-3 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[420px] max-w-full z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div 
        className={`rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-5 border shadow-2xl transition-all duration-300 ${
          isDeclined || isError
            ? 'border-rose-500/50 shadow-rose-500/20 bg-slate-950/95 glow-red'
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
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                  : isTimeout
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                  : isCompleted
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-tr from-brand-600 to-emerald-500 text-white'
              }`}
            >
              {isDeclined || isError ? (
                <XCircle className="w-5 h-5 text-rose-400 animate-pulse" />
              ) : isTimeout ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <ArrowUpRight className="w-5 h-5 animate-pulse" />
              )}
            </div>

            {/* Title & File Info */}
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                {isDeclined
                  ? 'تم رفض الطلب من قبل المستلم ❌'
                  : isTimeout
                  ? 'انتهت مهلة الانتظار ⚠️'
                  : isError
                  ? 'تعذر إتمام الإرسال ❌'
                  : isCompleted
                  ? 'تم إرسال الملفات بنجاح!'
                  : isWaitingApproval
                  ? 'في انتظار موافقة المستلم...'
                  : `إرسال إلى ${activeTransfer.partnerName}`}
              </div>

              {/* Partner Name & Total Size info */}
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                <span>إلى:</span>
                <span className="text-sky-300 font-semibold px-1.5 py-0.2 rounded bg-sky-500/10 border border-sky-500/20">{activeTransfer.partnerName}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-emerald-400 font-semibold text-[10px]" dir="ltr">
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
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Status: Declined Banner */}
        {isDeclined && (
          <div className="flex items-center gap-2 py-2.5 px-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium animate-in fade-in duration-200">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>قام {activeTransfer.partnerName || 'المستلم'} برفض طلب نقل الملف.</span>
          </div>
        )}

        {/* Status: Timeout Banner */}
        {isTimeout && (
          <div className="flex items-center gap-2 py-2.5 px-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>لم تتم الاستجابة لطلب النقل في الوقت المحدد.</span>
          </div>
        )}

        {/* Status: Waiting for approval with countdown timer bar */}
        {isWaitingApproval && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 mb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                <span>طلب النقل معروض على شاشة المستلم...</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg text-amber-200 shrink-0" dir="ltr">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{senderCountdown}s</span>
              </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="relative w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-amber-500/20">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(senderCountdown / 60) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Outgoing Files List with Cancel (✕) on individual files */}
        {(() => {
          const outgoingFilesList = Array.isArray(activeTransfer.files) && activeTransfer.files.length > 0
            ? activeTransfer.files
            : [{ name: activeTransfer.firstFileName || 'ملف', size: activeTransfer.totalBytes || 0 }];

          if (outgoingFilesList.length === 0 || isDeclined || isTimeout || isCompleted) return null;

          return (
            <div className="mb-2.5">
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>الملفات المختارة للإرسال ({outgoingFilesList.length}):</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {outgoingFilesList.length === 1 ? 'ملف واحد' : `${outgoingFilesList.length} ملفات`}
                </span>
              </div>

              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-2 max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar">
                {outgoingFilesList.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-slate-900/80 flex items-center justify-center shrink-0 border border-slate-700/60">
                        {getFileIcon(file.name)}
                      </div>
                      <span className="truncate text-slate-200 text-xs font-medium" title={file.name}>
                        {file.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400 font-mono text-[10px] bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800" dir="ltr">
                        {formatBytes(file.size)}
                      </span>
                      {/* X button: cancel single file before recipient accepts */}
                      {isWaitingApproval && (
                        <button
                          type="button"
                          onClick={() => removeSenderFile(file.name)}
                          className="w-6 h-6 rounded-lg bg-slate-900/90 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/70 hover:border-red-500/50 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                          title="إلغاء إرسال هذا الملف"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

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

            {/* Metrics Info Row */}
            {!isCompleted ? (
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-0.5">
                <div className="flex items-center gap-1.5" dir="ltr">
                  <span className="font-bold text-white font-mono">
                    {activeTransfer.percentage || 0}%
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">
                    {formatBytes(activeTransfer.bytesTransferred)} / {formatBytes(activeTransfer.totalBytes)}
                  </span>
                </div>

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
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5 pb-1">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم الإرسال بنجاح (100%)</span>
                </span>
                <span className="font-mono text-slate-400 text-[11px] bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800" dir="ltr">
                  {formatBytes(activeTransfer.totalBytes)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
