import React, { useEffect, useState } from 'react';
import { 
  DownloadCloud, 
  Check, 
  X, 
  FileText, 
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  Package,
  Code2,
  File,
  Smartphone,
  Laptop,
  Monitor,
  Volume2,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import { formatBytes } from '../utils/formatters.js';
import { 
  playTransferRequestSound, 
  playTransferAcceptedSound, 
  playDeclinedSound 
} from '../utils/soundEffects.js';

export default function TransferModal() {
  const { pendingIncomingRequest, respondToIncomingRequest, myDevice } = useFileFly();
  const [timeLeft, setTimeLeft] = useState(60);

  // Play rich crystal sound when request first arrives
  useEffect(() => {
    if (pendingIncomingRequest) {
      playTransferRequestSound();
      setTimeLeft(60);

      // Auto-countdown timer (60 seconds timeout)
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            respondToIncomingRequest('decline');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [pendingIncomingRequest?.id]);

  if (!pendingIncomingRequest) return null;

  const { sender, files, totalBytes } = pendingIncomingRequest;

  // Helper to pick device icon
  const getDeviceIcon = (os = '') => {
    const lower = (os || '').toLowerCase();
    if (lower.includes('ios') || lower.includes('iphone') || lower.includes('ipad') || lower.includes('android')) {
      return <Smartphone className="w-5 h-5 text-sky-400" />;
    }
    if (lower.includes('mac') || lower.includes('win') || lower.includes('laptop') || lower.includes('desktop')) {
      return <Laptop className="w-5 h-5 text-sky-400" />;
    }
    return <Monitor className="w-5 h-5 text-sky-400" />;
  };

  // Helper to determine recipient device type (e.g. Desktop, Android, iPhone, etc.)
  const getRecipientDeviceType = () => {
    if (typeof window !== 'undefined' && Boolean(window.fileflyDesktop)) return 'Desktop';
    const os = (myDevice?.os || '').toLowerCase();
    if (os.includes('win') || os.includes('desktop') || os.includes('pc')) return 'Desktop';
    if (os.includes('mac')) return 'Mac';
    if (os.includes('ios') || os.includes('iphone') || os.includes('ipad')) return 'iOS';
    if (os.includes('android')) return 'Android';
    if (os.includes('linux')) return 'Linux';
    return 'Desktop';
  };

  const getRecipientIcon = () => {
    const os = (myDevice?.os || '').toLowerCase();
    if (os.includes('ios') || os.includes('iphone') || os.includes('ipad') || os.includes('android')) {
      return <Smartphone className="w-5 h-5 text-emerald-400" />;
    }
    if (os.includes('mac') || os.includes('win') || os.includes('laptop') || os.includes('desktop') || Boolean(window?.fileflyDesktop)) {
      return <Laptop className="w-5 h-5 text-emerald-400" />;
    }
    return <Monitor className="w-5 h-5 text-emerald-400" />;
  };

  // Helper to pick rich file type icon & tag
  const getFileBadge = (filename = '') => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'bmp'].includes(ext)) {
      return {
        icon: <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />,
        label: 'صورة',
        tagClass: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      };
    }
    if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv', '3gp'].includes(ext)) {
      return {
        icon: <Film className="w-4 h-4 text-purple-400 shrink-0" />,
        label: 'فيديو',
        tagClass: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
      };
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus'].includes(ext)) {
      return {
        icon: <Music className="w-4 h-4 text-pink-400 shrink-0" />,
        label: 'صوت',
        tagClass: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
      };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz', 'iso'].includes(ext)) {
      return {
        icon: <Archive className="w-4 h-4 text-yellow-400 shrink-0" />,
        label: 'أرشيف',
        tagClass: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
      };
    }
    if (['exe', 'msi', 'apk', 'dmg', 'deb'].includes(ext)) {
      return {
        icon: <Package className="w-4 h-4 text-emerald-400 shrink-0" />,
        label: 'تطبيق',
        tagClass: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
      };
    }
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'cpp', 'java'].includes(ext)) {
      return {
        icon: <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />,
        label: 'كود',
        tagClass: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
      };
    }
    if (['pdf', 'doc', 'docx', 'txt', 'epub', 'xlsx', 'pptx'].includes(ext)) {
      return {
        icon: <FileText className="w-4 h-4 text-sky-400 shrink-0" />,
        label: 'مستند',
        tagClass: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
      };
    }

    return {
      icon: <File className="w-4 h-4 text-slate-400 shrink-0" />,
      label: 'ملف',
      tagClass: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
    };
  };

  const handleAccept = () => {
    playTransferAcceptedSound();
    respondToIncomingRequest('accept');
  };

  const handleDecline = () => {
    playDeclinedSound();
    respondToIncomingRequest('decline');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Glow Ambient behind modal */}
      <div className="absolute w-[360px] h-[360px] bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none -z-10 animate-pulse-slow" />

      <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl glass-panel p-5 sm:p-7 border border-emerald-500/40 shadow-2xl shadow-emerald-500/15 animate-in zoom-in-95 duration-200 text-right overflow-hidden">
        
        {/* Top Floating Sound & Security Badges */}
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold glow-green">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              طلب استلام ملف جديد
            </span>

            <button
              onClick={() => playTransferRequestSound()}
              className="p-1 px-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-1 text-[11px]"
              title="إعادة تشغيل صوت التنبيه"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span className="hidden xs:inline">صوت التنبيه</span>
            </button>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1 text-slate-400 font-mono text-xs bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className={timeLeft <= 10 ? 'text-red-400 font-bold animate-pulse' : 'text-slate-300'}>
              {timeLeft} ثانية
            </span>
          </div>
        </div>

        {/* Device-to-Device Wireless Beam Graphic */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800 mb-4">
          <div className="flex items-center justify-between gap-2">
            
            {/* Sender Device Avatar */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/10">
                {getDeviceIcon(sender?.os)}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>المرسل</span>
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {sender?.name || 'جهاز متصل'}
                </div>
                <div className="text-[10px] text-sky-400 font-mono">
                  {sender?.os ? sender.os.toUpperCase() : 'WIFI'}
                </div>
              </div>
            </div>

            {/* Wireless Connecting Pulse Beam (Flows from Sender on right to Recipient on left) */}
            <div className="flex flex-col items-center justify-center px-2 sm:px-3 shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-l from-emerald-500/15 to-teal-500/25 border border-emerald-500/40 shadow-md shadow-emerald-500/15">
                <ArrowLeft className="w-4 h-4 text-emerald-400 animate-pulse drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              </div>
              <span className="text-[9px] text-slate-400 font-medium mt-1 whitespace-nowrap">
                نقل محلي مباشر
              </span>
            </div>

            {/* Recipient Device Avatar */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end text-left">
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                  <span>المستلم</span>
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {myDevice?.name || 'جهازي'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-semibold uppercase tracking-wider">
                  {getRecipientDeviceType()}
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                {getRecipientIcon()}
              </div>
            </div>

          </div>
        </div>

        {/* Transfer Stats Bar (Files Count & Total Size) */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between px-3">
            <span className="text-xs text-slate-400">إجمالي الحجم:</span>
            <span className="text-xs font-bold text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded-md text-emerald-300">
              {formatBytes(totalBytes)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between px-3">
            <span className="text-xs text-slate-400">عدد الملفات:</span>
            <span className="text-xs font-bold text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded-md text-sky-300">
              {files?.length || 0} ملف
            </span>
          </div>
        </div>

        {/* Files Preview List */}
        <div className="mb-5">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>قائمة الملفات المرسلة:</span>
            <span className="text-[11px] text-slate-500 font-mono">معاينة آمنة</span>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-2.5 max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar">
            {files?.map((file, idx) => {
              const { icon, label, tagClass } = getFileBadge(file.name);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-900/80 flex items-center justify-center shrink-0 border border-slate-700/60">
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-200 font-medium truncate text-xs">
                        {file.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${tagClass}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-slate-400 font-mono text-[11px] shrink-0 bg-slate-900/60 px-2 py-1 rounded-md">
                    {formatBytes(file.size)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Countdown Progress Bar */}
        <div className="relative w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          />
        </div>

        {/* Hero Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleAccept}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 glow-green"
          >
            <Check className="w-5 h-5" />
            <span>قبول واستلام الملفات</span>
          </button>

          <button
            type="button"
            onClick={handleDecline}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-red-500/15 hover:border-red-500/40 text-slate-300 hover:text-red-400 font-semibold text-sm border border-slate-800 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
            <span>رفض الطلب</span>
          </button>
        </div>

      </div>
    </div>
  );
}
