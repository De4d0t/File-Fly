import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  QrCode, 
  X, 
  Copy, 
  Check, 
  Wifi, 
  CheckCircle2,
  ExternalLink,
  RotateCw
} from 'lucide-react';
import QRCode from 'qrcode';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function QrCodeModal() {
  const { isQrModalOpen, setIsQrModalOpen, myDevice, peers, pendingIncomingRequest } = useFileFly();
  const [qrData, setQrData] = useState({ url: '', qrDataUrl: '', port: '' });
  const [copiedKey, setCopiedKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  
  const initialPeersCountRef = useRef(peers.length);

  const generateClientQR = async (url) => {
    try {
      return await QRCode.toDataURL(url, {
        margin: 2,
        width: 280,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (err) {
      console.warn('[QR Client Gen Warning]:', err);
      return null;
    }
  };

  const loadQrCode = useCallback(async () => {
    setLoading(true);
    const port = myDevice.port || 53316;
    const hostIp = (myDevice.ip && myDevice.ip !== 'localhost' && myDevice.ip !== '127.0.0.1')
      ? myDevice.ip
      : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
        ? window.location.hostname
        : '127.0.0.1';

    let targetUrl = `http://${hostIp}:${port}`;

    try {
      const res = await fetch('/api/qr');
      if (res.ok) {
        const data = await res.json();
        if (data && data.qrDataUrl) {
          setQrData(data);
          setLoading(false);
          return;
        } else if (data && data.url) {
          targetUrl = data.url;
        }
      }
    } catch (fetchErr) {
      console.warn('[QR] Server fetch unavailable, generating locally:', fetchErr);
    }

    // Fallback: Instant client-side QR generation
    const localDataUrl = await generateClientQR(targetUrl);
    if (localDataUrl) {
      setQrData({
        url: targetUrl,
        qrDataUrl: localDataUrl,
        port,
      });
    }
    setLoading(false);
  }, [myDevice.ip, myDevice.port]);

  useEffect(() => {
    if (isQrModalOpen) {
      initialPeersCountRef.current = peers.length;
      setJustConnected(false);
      loadQrCode();
    }
  }, [isQrModalOpen, loadQrCode]);

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

  const currentUrl = qrData.url || `http://${myDevice.ip}:${myDevice.port || 53316}`;
  const port = qrData.port || myDevice.port || 53316;
  const flyLocalUrl = `http://fly.local:${port}`;

  const handleCopy = (text, key) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-2xl sm:rounded-3xl glass-panel p-5 sm:p-7 border border-sky-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center overflow-hidden my-auto max-h-[92vh] overflow-y-auto">
        {/* Success Connection Overlay */}
        {justConnected && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md border border-emerald-500/50 flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in duration-150">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 glow-green mb-3">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-white mb-1">تم الاتصال بنجاح!</h4>
            <p className="text-xs text-emerald-400">جاري إغلاق النافذة والبدء في النقل...</p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={() => setIsQrModalOpen(false)}
          className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 p-1.5 sm:p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-20"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Title */}
        <div className="mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
            ربط الأجهزة بالباركود
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 max-w-xs mx-auto">
            امسح الباركود بكاميرا هاتفك للاتصال فوراً أو استخدم الروابط المباشرة
          </p>
        </div>

        {/* QR Code Container */}
        <div className="relative inline-block p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white shadow-2xl mb-4">
          {loading ? (
            <div className="w-44 h-44 xs:w-48 xs:h-48 sm:w-52 sm:h-52 flex items-center justify-center text-slate-700 text-xs">
              جاري توليد الباركود...
            </div>
          ) : qrData.qrDataUrl ? (
            <img
              src={qrData.qrDataUrl}
              alt="QR Code"
              className="w-44 h-44 xs:w-48 xs:h-48 sm:w-52 sm:h-52 rounded-xl sm:rounded-2xl"
            />
          ) : (
            <div className="w-44 h-44 xs:w-48 xs:h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center text-slate-700 text-xs gap-2">
              <span>تعذر تحميل الباركود</span>
              <button
                type="button"
                onClick={loadQrCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-sky-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}
        </div>

        {/* Direct Links & Icon-Only Copy Buttons */}
        <div className="space-y-2 mb-3.5">
          {/* IP Direct Link */}
          <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-sky-400 font-mono flex-1 text-center truncate select-all">
              {currentUrl}
            </span>

            <button
              onClick={() => handleCopy(currentUrl, 'ip')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 active:scale-95"
              title="نسخ الرابط"
            >
              {copiedKey === 'ip' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Quick mDNS fallback link */}
          <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-xs text-emerald-400 font-mono flex-1 text-center truncate select-all">
              {flyLocalUrl}
            </span>

            <button
              onClick={() => handleCopy(flyLocalUrl, 'quick')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 active:scale-95"
              title="نسخ الرابط السريع"
            >
              {copiedKey === 'quick' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Wifi Requirement Note */}
        <div className="text-[11px] text-slate-400 bg-slate-900/50 rounded-xl p-2.5 text-center flex items-center justify-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>تأكد من اتصال الأجهزة بنفس شبكة الـ Wi-Fi</span>
        </div>
      </div>
    </div>
  );
}
