import React from 'react';
import { 
  History, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FolderOpen, 
  FileText, 
  CheckCircle2, 
  Calendar,
  DownloadCloud,
  Play
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import { formatBytes } from '../utils/formatters.js';

export default function HistoryModal() {
  const { isHistoryModalOpen, setIsHistoryModalOpen, history, openDownloadsFolder, openFile, isHostMachine } = useFileFly();

  if (!isHistoryModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl glass-panel p-6 sm:p-8 border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={() => setIsHistoryModalOpen(false)}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">سجل النقل</h3>
              <p className="text-xs text-slate-400">
                {isHostMachine ? 'قائمة بالملفات المنقولة ومجلد الحفظ' : 'الملفات المستلمة محفوظة في تنزيلات جهازك'}
              </p>
            </div>
          </div>

          {isHostMachine && (
            <button
              onClick={openDownloadsFolder}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>فتح المجلد</span>
            </button>
          )}
        </div>

        {/* List of Items */}
        <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
          {history.length > 0 ? (
            history.map((item, idx) => {
              const isIncoming = item.direction === 'incoming';
              const dateStr = item.completedAt
                ? new Date(item.completedAt).toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '--';

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                        isIncoming ? 'bg-sky-600' : 'bg-brand-600'
                      }`}
                    >
                      {isIncoming ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <div className="font-bold text-sm text-white truncate">
                        {item.firstFileName}
                        {item.filesCount > 1 && ` (+${item.filesCount - 1} ملفات)`}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{isIncoming ? `من: ${item.partnerName}` : `إلى: ${item.partnerName}`}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-left ml-1">
                      <div className="font-mono text-xs font-bold text-white">
                        {formatBytes(item.totalBytes)}
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>مكتمل</span>
                      </div>
                    </div>

                    {/* Option 1: Open / Play File */}
                    <button
                      onClick={() => openFile(item)}
                      className="p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/30 text-sky-300 hover:text-white border border-sky-500/30 transition-all active:scale-95 shadow-sm"
                      title="تشغيل أو فتح الملف"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-sky-400" />
                    </button>

                    {/* Option 2: Open Containing Folder or Download */}
                    {isHostMachine ? (
                      <button
                        onClick={openDownloadsFolder}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 transition-all active:scale-95 shadow-sm"
                        title="فتح مجلد التنزيلات"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </button>
                    ) : item.id && (
                      <a
                        href={`/api/transfer/download/${item.id}/0`}
                        download={item.firstFileName}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/40 transition-all active:scale-95 shadow-sm"
                        title="تحميل الملف إلى جهازك"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              لا توجد عمليات نقل سابقة بعد
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
