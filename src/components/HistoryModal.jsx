import React, { useEffect, useState } from 'react';
import { 
  History, 
  X, 
  Trash2,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  Package,
  File,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Smartphone,
  Laptop,
  Monitor,
  FolderOpen,
  GripVertical
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import { getServerBaseUrl } from '../services/serverDiscovery.js';
import { formatBytes, formatHistoryDateTime } from '../utils/formatters.js';

function getFileVisuals(filename = '') {
  const ext = (filename || '').split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'avif'].includes(ext)) {
    return {
      Icon: ImageIcon,
      category: 'Image',
      ext: ext.toUpperCase(),
      gradient: 'from-amber-500/25 via-orange-500/15 to-amber-600/5',
      border: 'border-amber-500/30 group-hover:border-amber-500/50',
      iconColor: 'text-amber-400',
      tagBg: 'bg-slate-950/95 text-amber-300 border-amber-500/40',
      glow: 'group-hover:shadow-[0_0_24px_rgba(245,158,11,0.2)]',
    };
  }
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv', 'flv', 'm4v'].includes(ext)) {
    return {
      Icon: Film,
      category: 'Video',
      ext: ext.toUpperCase(),
      gradient: 'from-violet-500/25 via-purple-500/15 to-violet-600/5',
      border: 'border-violet-500/30 group-hover:border-violet-500/50',
      iconColor: 'text-violet-400',
      tagBg: 'bg-slate-950/95 text-violet-300 border-violet-500/40',
      glow: 'group-hover:shadow-[0_0_24px_rgba(168,85,247,0.2)]',
    };
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus', 'wma'].includes(ext)) {
    return {
      Icon: Music,
      category: 'Audio',
      ext: ext.toUpperCase(),
      gradient: 'from-pink-500/25 via-rose-500/15 to-pink-600/5',
      border: 'border-pink-500/30 group-hover:border-pink-500/50',
      iconColor: 'text-pink-400',
      tagBg: 'bg-slate-950/95 text-pink-300 border-pink-500/40',
      glow: 'group-hover:shadow-[0_0_24px_rgba(244,63,94,0.2)]',
    };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
    return {
      Icon: Archive,
      category: 'Archive',
      ext: ext.toUpperCase(),
      gradient: 'from-yellow-500/25 via-amber-500/15 to-yellow-600/5',
      border: 'border-yellow-500/30 group-hover:border-yellow-500/50',
      iconColor: 'text-yellow-400',
      tagBg: 'bg-slate-950/95 text-yellow-300 border-yellow-500/40',
      glow: 'group-hover:shadow-[0_0_24px_rgba(234,179,8,0.2)]',
    };
  }
  if (['pdf', 'doc', 'docx', 'txt', 'epub', 'xlsx', 'pptx', 'csv', 'md'].includes(ext)) {
    return {
      Icon: FileText,
      category: 'Document',
      ext: ext.toUpperCase(),
      gradient: 'from-sky-500/25 via-blue-500/15 to-sky-600/5',
      border: 'border-sky-500/30 group-hover:border-sky-500/50',
      iconColor: 'text-sky-400',
      tagBg: 'bg-slate-950/95 text-sky-300 border-sky-500/40',
      glow: 'group-hover:shadow-[0_0_24px_rgba(56,189,248,0.2)]',
    };
  }
  if (['exe', 'msi', 'apk', 'dmg', 'deb', 'iso'].includes(ext)) {
    return {
      Icon: Package,
      category: 'App',
      ext: ext.toUpperCase(),
      gradient: 'from-emerald-500/25 via-teal-500/15 to-emerald-600/5',
      border: 'border-emerald-500/30 group-hover:border-emerald-500/50',
      iconColor: 'text-emerald-400',
      tagBg: 'bg-slate-950/95 text-emerald-300 border-emerald-500/40',
      glow: 'group-hover:shadow-[0_0_24px_rgba(168,85,247,0.2)]',
    };
  }
  return {
    Icon: File,
    category: 'File',
    ext: ext ? ext.toUpperCase() : 'FILE',
    gradient: 'from-slate-800/80 via-slate-800/50 to-slate-800/20',
    border: 'border-slate-700/60 group-hover:border-slate-600',
    iconColor: 'text-slate-300',
    tagBg: 'bg-slate-950/95 text-slate-300 border-slate-700',
    glow: '',
  };
}

function getDeviceIcon(name = '') {
  const lower = (name || '').toLowerCase();
  if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios') || lower.includes('phone') || lower.includes('android')) {
    return Smartphone;
  }
  if (lower.includes('mac') || lower.includes('laptop') || lower.includes('book')) {
    return Laptop;
  }
  return Monitor;
}

export default function HistoryModal() {
  const { 
    isHistoryModalOpen, 
    setIsHistoryModalOpen, 
    history, 
    setHistory,
    isHostMachine, 
    isMobileClient,
    clearHistory,
    deleteHistoryItem,
    openFile,
    openFolder,
    myDevice,
    apiFetch
  } = useFileFly();

  const [failedImages, setFailedImages] = useState(() => new Set());

  const handleDragStart = (e, item) => {
    if (isMobileClient) return;

    const fileName = item.firstFileName || item.name || 'file';
    const resolvedPath = item.savedPath || item.filePath || (item.files && item.files[0]?.savedPath) || fileName;

    // 1. Electron Native Desktop Drag & Drop to Windows Desktop / Explorer
    if (typeof window !== 'undefined' && window.fileflyDesktop?.startDrag) {
      e.preventDefault();
      window.fileflyDesktop.startDrag(resolvedPath);
      return;
    }

    // 2. Web Browser (Chrome/Edge/Chromium) DownloadURL Drag & Drop to Windows Desktop / Explorer
    try {
      const baseUrl = getServerBaseUrl();
      const fileIndex = 0;
      const downloadUrl = `${baseUrl}/api/transfer/download/${encodeURIComponent(item.id || 'history')}/${fileIndex}?fileName=${encodeURIComponent(fileName)}&filePath=${encodeURIComponent(item.savedPath || '')}`;
      const fullUrl = new URL(downloadUrl, window.location.origin).href;
      const visual = getFileVisuals(fileName);
      const mime = visual.category === 'Image' ? 'image/*' : 'application/octet-stream';

      e.dataTransfer.setData('DownloadURL', `${mime}:${fileName}:${fullUrl}`);
      e.dataTransfer.setData('text/uri-list', fullUrl);
      e.dataTransfer.setData('text/plain', fullUrl);
      e.dataTransfer.effectAllowed = 'copyMove';
    } catch (err) {
      console.warn('History card drag dataTransfer error:', err);
    }
  };

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

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isHistoryModalOpen) {
        setIsHistoryModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryModalOpen, setIsHistoryModalOpen]);

  if (!isHistoryModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl glass-panel border border-slate-700/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        
        {/* Header (Arabic title & description as requested) */}
        <div className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-slate-800/90 shrink-0 bg-slate-950/40">
          <div className="flex items-center justify-between gap-3" dir="rtl">
            {/* Title & Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-violet-500/25 to-indigo-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0 shadow-inner">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    سجل النقل
                  </h3>
                  {history.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/25">
                      {history.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  سجل خاص بالملفات المنقولة والمستلمة عبر الشبكة المحلية
                </p>
              </div>
            </div>

            {/* Header Close Action */}
            <div className="flex items-center" dir="ltr">
              {/* Close Button */}
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-sm"
                title="إغلاق"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>


        {/* List of Items (English Cards with Two-Tier Layout) */}
        <div 
          className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 custom-scrollbar min-h-[220px]"
          dir="ltr"
        >
          {history.length > 0 ? (
            history.map((item, idx) => {
              const isIncoming = item.direction 
                ? item.direction === 'incoming' 
                : (item.recipientName === myDevice?.name || (item.senderName && item.senderName !== myDevice?.name));
              
              const myName = myDevice?.name || 'My Device';
              const sender = item.senderName || (isIncoming ? (item.partnerName || 'Peer') : myName);
              const recipient = item.recipientName || (isIncoming ? myName : (item.partnerName || 'Peer'));
              
              const isMeSender = sender === myName || sender === myDevice?.name || sender === 'جهازي';
              const isMeRecipient = recipient === myName || recipient === myDevice?.name || recipient === 'جهازي';

              // Timestamp formatted: YYYY-M-D | 12:14 am
              const rawTimestamp = item.completedAt || item.timestamp || item.createdAt;
              const dateStr = formatHistoryDateTime(rawTimestamp);

              const visual = getFileVisuals(item.firstFileName);
              const VisualIcon = visual.Icon;
              const SenderIcon = getDeviceIcon(sender);
              const RecipientIcon = getDeviceIcon(recipient);

              // Image thumbnail handling
              const isImage = visual.category === 'Image';
              const itemKey = item.id || `${item.firstFileName || 'file'}_${idx}`;
              const hasFailed = failedImages.has(itemKey);

              const baseUrl = getServerBaseUrl();
              const queryParams = new URLSearchParams();
              if (item.firstFileName) queryParams.set('fileName', item.firstFileName);
              if (item.savedPath) queryParams.set('filePath', item.savedPath);
              const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

              const thumbnailUrl = isImage && !hasFailed
                ? `${baseUrl}/api/transfer/view/${encodeURIComponent(item.id || 'current')}/0${queryString}`
                : null;

              return (
                <div
                  key={item.id || idx}
                  draggable={!isMobileClient}
                  onDragStart={(e) => handleDragStart(e, item)}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-slate-800/90 hover:border-slate-700/80 transition-all duration-150 group shadow-md hover:shadow-xl select-none ${
                    !isMobileClient ? 'cursor-grab active:cursor-grabbing hover:border-sky-500/40' : ''
                  }`}
                  title={!isMobileClient ? 'اسحب هذا الملف وأفلته في سطح المكتب مباشرة' : undefined}
                >
                  {/* Top Tier: File Profile & Metrics */}
                  <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    
                    {/* Left side: Grip + Avatar + File Metadata */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      
                      {/* Grip handle indicator (Desktop only) */}
                      {!isMobileClient && (
                        <div 
                          className="text-slate-600 group-hover:text-sky-400 group-hover:scale-110 transition-all shrink-0 cursor-grab active:cursor-grabbing"
                          title="اسحب هذا الملف لسطح المكتب مباشرة"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                      )}

                      {/* Avatar with Extension Micro-Tag / Image Thumbnail */}
                      <div 
                        className={`relative shrink-0 ${openFile && (item.savedPath || isIncoming || isHostMachine) ? 'cursor-pointer' : ''}`}
                        onClick={openFile && (item.savedPath || isIncoming || isHostMachine) ? (e) => { e.stopPropagation(); openFile(item); } : undefined}
                        title={thumbnailUrl ? 'انقر لعرض الصورة' : (openFile && (item.savedPath || isIncoming || isHostMachine) ? 'انقر لفتح الملف مباشرة' : undefined)}
                      >
                        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${visual.gradient} border ${visual.border} ring-1 ring-white/5 flex items-center justify-center transition-all duration-200 ${visual.glow} overflow-hidden shadow-inner`}>
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={item.firstFileName || 'Image'}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                              onError={() => {
                                setFailedImages((prev) => {
                                  const next = new Set(prev);
                                  next.add(itemKey);
                                  return next;
                                });
                              }}
                            />
                          ) : (
                            <VisualIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${visual.iconColor} drop-shadow-sm`} />
                          )}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider border shadow-sm pointer-events-none select-none z-10 ${visual.tagBg}`}>
                          {visual.ext}
                        </span>
                      </div>

                      {/* File Name & Badges */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="font-bold text-sm sm:text-[15px] text-white truncate group-hover:text-sky-300 transition-colors"
                            title={item.firstFileName || 'File'}
                          >
                            {item.firstFileName || 'File'}
                          </span>
                          {item.filesCount > 1 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/25 text-[10px] font-semibold shrink-0">
                              +{item.filesCount - 1} files
                            </span>
                          )}
                        </div>

                        {/* Subtitle row: File Size */}
                        <div className="mt-1">
                          <span className="font-mono text-xs font-semibold text-slate-400">
                            {formatBytes(item.totalBytes)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Action Buttons */}
                    <div 
                      className="flex items-center gap-1.5 sm:gap-2 shrink-0"
                      onMouseDown={(e) => e.stopPropagation()}
                    >

                      {/* Open containing folder (Show in folder on PC) */}
                      {isHostMachine && (
                        <button
                          draggable={false}
                          onClick={(e) => {
                            e.stopPropagation();
                            openFolder(item);
                          }}
                          className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 hover:border-slate-600 transition-all duration-150 active:scale-90 flex items-center justify-center opacity-85 group-hover:opacity-100"
                          title="فتح المجلد الموجود به الملف (عرض في المستكشف)"
                          aria-label="فتح المجلد الموجود به الملف"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete item action */}
                      <button
                        draggable={false}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(item.id);
                        }}
                        className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/40 transition-all duration-150 active:scale-90 flex items-center justify-center opacity-75 group-hover:opacity-100"
                        title="حذف من السجل"
                        aria-label="حذف من السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Tier: Route & Timestamp Ledger Strip */}
                  <div className="px-3 sm:px-3.5 py-2 bg-slate-950/70 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px] sm:text-xs">
                    {/* Route Flow */}
                    <div className="inline-flex items-center gap-1.5 text-slate-300 font-medium truncate max-w-[240px] sm:max-w-[320px]">
                      {/* Sender Chip */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-slate-300 shadow-xs">
                        <SenderIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[85px] sm:max-w-[120px]" title={sender}>
                          {sender} {isMeSender && <span className="text-[10px] text-slate-300 font-medium">(You)</span>}
                        </span>
                      </span>

                      <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />

                      {/* Recipient Chip - Exact matching unified color */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-slate-300 shadow-xs">
                        <RecipientIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[85px] sm:max-w-[120px]" title={recipient}>
                          {recipient} {isMeRecipient && <span className="text-[10px] text-slate-300 font-medium">(You)</span>}
                        </span>
                      </span>
                    </div>

                    {/* Date & Time Badge */}
                    <div 
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/80 border border-slate-800/70 text-slate-400 font-mono text-[10.5px] sm:text-[11px] shrink-0 shadow-xs"
                      title="Completion date and time"
                    >
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-14 text-center flex flex-col items-center justify-center" dir="rtl">
              <div className="w-14 h-14 rounded-3xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-3.5 shadow-inner">
                <History className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-slate-200 mb-1">
                لا توجد عمليات نقل سابقة
              </p>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                ستظهر هنا الملفات والمستندات التي تقوم بإرسالها أو استلامها عبر الشبكة المحلية.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
