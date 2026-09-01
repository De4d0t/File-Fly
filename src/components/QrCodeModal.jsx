import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Wifi,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function QrCodeModal() {
  const { isQrModalOpen, setIsQrModalOpen, myDevice, peers, pendingIncomingRequest } = useFileFly();
  const [qrData, setQrData] = useState({ url: '', qrDataUrl: '' });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  
  const initialPeersCountRef = useRef(peers.length);

  useEffect(() => {
    if (isQrModalOpen) {
      initialPeersCountRef.current = peers.length;
      setJustConnected(false);
      setLoading(true);
      fetch('/api/qr')
        .then((res) => res.json())
        .then((data) => {
          setQrData(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isQrModalOpen]);

  // Automatically close modal when a new device connects
  useEffect(() => {
    if (isQrModalOpen && peers.length > initialPeersCountRef.current) {
      setJustConnected(true);
      const timer = setTimeout(() => {
        setIsQrModalOpen(false);
        setJustConnected(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [peers.length, isQrModalOpen, setIsQrModalOpen]);

  // Immediately close QR modal if an incoming file transfer request arrives
  useEffect(() => {
    if (pendingIncomingRequest && isQrModalOpen) {
      setIsQrModalOpen(false);
    }
  }, [pendingIncomingRequest, isQrModalOpen, setIsQrModalOpen]);

  if (!isQrModalOpen) return null;

  const handleCopyLink = () => {
    if (qrData.url) {
      navigator.clipboard.writeText(qrData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 sm:p-8 border border-sky-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center overflow-hidden">
        {/* Success Connection Overlay */}
        {justConnected && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md border border-emerald-500/50 flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 glow-green mb-3">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h4 className="text-xl font-bold text-white mb-1">تم ربط الهاتف بنجاح!</h4>
            <p className="text-xs text-emerald-400">جاري إغلاق النافذة والبدء في النقل...</p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={() => setIsQrModalOpen(false)}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Icon */}
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          ربط هاتف أندرويد أو آيفون
        </h3>
        <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto">
          امسح الباركود بكاميرا هاتفك للاتصال فوراً ونقل الملفات بأقصى سرعة بدون تثبيت أي برامج
        </p>

        {/* QR Code Container */}
        <div className="relative inline-block p-4 rounded-3xl bg-white shadow-2xl mb-5">
          {loading ? (
            <div className="w-56 h-56 flex items-center justify-center text-slate-700 text-xs">
              جاري توليد الباركود...
            </div>
          ) : qrData.qrDataUrl ? (
            <img
              src={qrData.qrDataUrl}
              alt="QR Code"
              className="w-56 h-56 rounded-2xl"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-700 text-xs">
              تعذر تحميل الباركود
            </div>
          )}
        </div>

        {/* URL Link & Copy Button */}
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-900 border border-slate-800 mb-5">
          <span className="text-xs text-sky-400 font-mono flex-1 text-center truncate select-all">
            {qrData.url || `http://${myDevice.ip}:${myDevice.port}`}
          </span>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ الرابط</span>
              </>
            )}
          </button>
        </div>

        {/* Steps Guide */}
        <div className="text-[11px] text-slate-400 bg-slate-900/50 rounded-2xl p-3 text-right space-y-1">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Wifi className="w-3.5 h-3.5 text-brand-400" />
            <span>شرط أساسي:</span>
          </div>
          <p>يجب أن يكون الهاتف متصلاً بنفس شبكة الواي فاي للكمبيوتر.</p>
        </div>
      </div>
    </div>
  );
}
