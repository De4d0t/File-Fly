import React, { useEffect } from 'react';
import { 
  History, 
  X, 
  Download,
  Upload,
  CheckCircle2, 
  Trash2,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  Package,
  File
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import { formatBytes } from '../utils/formatters.js';

function getFileVisuals(filename = '') {
  const ext = (filename || '').split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'avif'].includes(ext)) {
    return {
      Icon: ImageIcon,
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      iconColor: 'text-amber-400',
    };
  }
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv', 'flv', 'm4v'].includes(ext)) {
    return {
      Icon: Film,
      bgColor: 'bg-violet-500/10 border-violet-500/20',
      iconColor: 'text-violet-400',
    };
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus', 'wma'].includes(ext)) {
    return {
      Icon: Music,
      bgColor: 'bg-pink-500/10 border-pink-500/20',
      iconColor: 'text-pink-400',
    };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
    return {
      Icon: Archive,
      bgColor: 'bg-yellow-500/10 border-yellow-500/20',
      iconColor: 'text-yellow-400',
    };
  }
  if (['pdf', 'doc', 'docx', 'txt', 'epub', 'xlsx', 'pptx', 'csv', 'md'].includes(ext)) {
    return {
      Icon: FileText,
      bgColor: 'bg-sky-500/10 border-sky-500/20',
      iconColor: 'text-sky-400',
    };
  }
  if (['exe', 'msi', 'apk', 'dmg', 'deb', 'iso'].includes(ext)) {
    return {
      Icon: Package,
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      iconColor: 'text-emerald-400',
    };
  }
  return {
    Icon: File,
    bgColor: 'bg-slate-800 border-slate-700/60',
    iconColor: 'text-slate-300',
  };
}

export default function HistoryModal() {
  const { 
    isHistoryModalOpen, 
    setIsHistoryModalOpen, 
    history, 
    setHistory,
    isHostMachine, 
    deleteHistoryItem,
    myDevice,
    apiFetch
  } = useFileFly();

  useEffect(() => {
    if (isHistoryModalOpen) {
      const endpoint = isHostMachine 
        ? '/api/history' 
        : `/api/history?clientId=${encodeURIComponent(myDevice?.id || '')}`;

      apiFetch(endpoint)
        .then((r) => r.json())
        .then((data) => {
          if (data.history && Array.isArray(data.history)) {
            const seen = new Set();
            const unique = data.history.filter((item) => {
              if (!item || !item.id || seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
            if (isHostMachine || unique.length > 0) {
              setHistory(unique);
            }
          }
        })
        .catch(() => {});
    }
  }, [isHistoryModalOpen, isHostMachine, myDevice?.id]);

  if (!isHistoryModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-6 border border-slate-700/80 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 sm:pb-4 mb-3.5 sm:mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 shadow-inner">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">سجل النقل</h3>
                {history.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                    {history.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                قائمة بالملفات المنقولة والمستلمة
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsHistoryModalOpen(false)}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-all duration-150 active:scale-95"
            title="إغلاق"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* List of Items */}
        <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto space-y-2.5 sm:space-y-3 pr-0.5">
          {history.length > 0 ? (
            history.map((item, idx) => {
              const isIncoming = item.direction 
                ? item.direction === 'incoming' 
                : (item.recipientName === myDevice?.name || (item.senderName && item.senderName !== myDevice?.name));
              const partner = item.partnerName || (isIncoming ? item.senderName : item.recipientName) || 'جهاز';
              
              // Standard English 12h time string
              const dateStr = item.completedAt
                ? new Date(item.completedAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                : '--';

              const visual = getFileVisuals(item.firstFileName);
              const VisualIcon = visual.Icon;

              return (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 transition-all duration-200 group shadow-sm"
                >
                  {/* Right side in RTL: File Icon & Detailed Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    {/* File Type Avatar */}
                    <div className="shrink-0">
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shadow-sm ${visual.bgColor}`}>
                        <VisualIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${visual.iconColor}`} />
                      </div>
                    </div>

                    {/* File text info */}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      {/* File Name & optional multi-count badge */}
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-semibold text-sm sm:text-[15px] text-slate-100 truncate hover:text-white transition-colors"
                          title={item.firstFileName || 'ملف'}
                        >
                          {item.firstFileName || 'ملف'}
                        </span>
                        {item.filesCount > 1 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px] font-medium shrink-0">
                            +{item.filesCount - 1} ملفات
                          </span>
                        )}
                      </div>

                      {/* Subtitle row: Direction & Device • Time */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="inline-flex items-center gap-1.5 text-slate-300 truncate max-w-[180px] sm:max-w-[240px]">
                          {isIncoming ? (
                            <Download className="w-3.5 h-3.5 text-sky-400 shrink-0" title="ملف مستلم" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-purple-400 shrink-0" title="ملف مرسل" />
                          )}
                          <span className="text-slate-200 font-medium truncate">
                            {partner}
                          </span>
                        </span>

                        <span className="text-slate-600 select-none">•</span>

                        {/* Strict LTR container for time to prevent bidirectional flipping */}
                        <span 
                          dir="ltr" 
                          className="font-mono text-[11px] text-slate-400 shrink-0 inline-block"
                        >
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Left side in RTL: Size, Status & Red Delete Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Size & Status Column */}
                    <div className="flex flex-col items-end gap-1 text-left">
                      <span 
                        dir="ltr" 
                        className="font-mono text-xs font-bold text-slate-200 tracking-tight inline-block"
                      >
                        {formatBytes(item.totalBytes)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>مكتمل</span>
                      </span>
                    </div>

                    {/* Subtle Vertical Divider */}
                    <div className="w-px h-7 bg-slate-800" />

                    {/* Refined Red Delete Button */}
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-600 transition-all duration-200 active:scale-95 shadow-sm group/btn flex items-center justify-center shrink-0"
                      title="حذف من السجل"
                      aria-label="حذف من السجل"
                    >
                      <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-3">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300 mb-1">
                لا توجد عمليات نقل سابقة
              </p>
              <p className="text-xs text-slate-500">
                ستظهر هنا الملفات التي تقوم بإرسالها أو استلامها
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
