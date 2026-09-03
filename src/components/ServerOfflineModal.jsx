import React, { useState, useEffect } from 'react';
import { Laptop, PowerOff, Radio } from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function ServerOfflineModal() {
  const { isOnline, isHostMachine, reconnectSocket } = useFileFly();
  const [showModal, setShowModal] = useState(false);
  const [discoveredServer, setDiscoveredServer] = useState(null);

  useEffect(() => {
    // Host machine (Desktop Electron / localhost) doesn't need this modal
    if (isHostMachine) {
      setShowModal(false);
      return;
    }

    if (isOnline) {
      setShowModal(false);
      setDiscoveredServer(null);
      return;
    }

    // Give a 1s grace period on initial load so it doesn't flash during fast socket handshake
    const timer = setTimeout(() => {
      if (!isOnline && !isHostMachine) {
        setShowModal(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOnline, isHostMachine]);

  // Proactive HTTP Health Probe while offline (Bypasses browser WebSocket penalty box)
  useEffect(() => {
    if (isOnline || isHostMachine) return;

    const checkHealth = async () => {
      try {
        const host = window.location.hostname || 'localhost';
        const port = window.location.port === '5173' ? '53316' : (window.location.port || '53316');
        const res = await fetch(`http://${host}:${port}/api/health?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'ok') {
            // Server is confirmed back online! Reload to clear socket pools cleanly
            window.location.reload();
          }
        }
      } catch (_) {}
    };

    const interval = setInterval(checkHealth, 2000);
    return () => clearInterval(interval);
  }, [isOnline, isHostMachine]);

  // Search for new server on alternate hostnames (e.g. fly.local or filefly.local)
  useEffect(() => {
    if (isOnline || isHostMachine) return;

    const probeAlternatives = async () => {
      const candidates = ['fly.local', 'filefly.local'];
      for (const cand of candidates) {
        if (cand === window.location.hostname) continue;
        try {
          const res = await fetch(`http://${cand}:53316/api/health?_t=${Date.now()}`, {
            cache: 'no-store',
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.status === 'ok') {
              setDiscoveredServer({ host: cand, ...data });
              break;
            }
          }
        } catch (_) {}
      }
    };

    const timer = setTimeout(probeAlternatives, 3500);
    return () => clearTimeout(timer);
  }, [isOnline, isHostMachine]);

  // If host, or online, do not render
  if (isHostMachine || isOnline || !showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl glass-panel p-5 sm:p-6 border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.15)] text-center overflow-hidden my-auto">
        {/* Subtle Ambient Red Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Icon Container */}
        <div className="relative mx-auto mb-3.5 w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-rose-500/10 border border-rose-500/25 animate-pulse" />
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-b from-rose-500/20 to-slate-900 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
            <Laptop className="w-6 h-6 text-rose-400" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <PowerOff className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2.5 tracking-tight">
          السيرفر متوقف حالياً
        </h3>

        {/* Concise Red Description Box with Wi-Fi Note */}
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs sm:text-sm leading-relaxed mb-4 text-center space-y-2">
          <p>
            يجب تشغيل تطبيق <span className="font-bold text-white">FileFly</span> على جهاز الحاسوب أولاً لبدء الخدمة وإرسال واستقبال الملفات.
          </p>
          <p className="text-rose-300/90 text-[11px] sm:text-xs pt-2 border-t border-rose-500/20 leading-normal">
            تأكد أيضاً من اتصال هاتفك والكمبيوتر <span className="font-semibold text-white">بنفس شبكة الواي فاي (Wi-Fi)</span> لتتمكن الأجهزة من العثور على بعضها.
          </p>
        </div>

        {/* Discovered New Server Alert (If running on alternate computer) */}
        {discoveredServer && (
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs mb-3 space-y-2 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-300">
              <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
              <span>تم العثور على سيرفر نشط جديد!</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.replace(`http://${discoveredServer.host}:53316`)}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              التحويل إلى السيرفر الجديد ({discoveredServer.name || discoveredServer.host})
            </button>
          </div>
        )}

        {/* Live Status & Auto-Reconnect Pulse */}
        <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>جاري البحث والاتصال التلقائي بالسيرفر...</span>
        </div>
      </div>
    </div>
  );
}
