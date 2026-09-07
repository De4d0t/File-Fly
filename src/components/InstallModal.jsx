import React, { useState } from 'react';
import { 
  X, 
  Monitor, 
  Smartphone, 
  Apple, 
  CheckCircle2, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  Sparkles, 
  AppWindow, 
  Zap, 
  ShieldCheck, 
  Layers,
  ArrowDownToLine,
  AlertTriangle,
  ExternalLink,
  Chrome
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function InstallModal() {
  const { 
    isInstallModalOpen, 
    setIsInstallModalOpen, 
    deferredInstallPrompt, 
    installPwaApp, 
    isAppInstalled 
  } = useFileFly();

  // Detect user platform
  const detectPlatform = () => {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  };

  const [activeTab, setActiveTab] = useState(detectPlatform());
  const [installSuccess, setInstallSuccess] = useState(false);

  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const port = typeof window !== 'undefined' ? window.location.port || '53316' : '53316';

  if (!isInstallModalOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredInstallPrompt) {
      const installed = await installPwaApp();
      if (installed) {
        setInstallSuccess(true);
        setTimeout(() => {
          setIsInstallModalOpen(false);
          setInstallSuccess(false);
        }, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl glass-panel p-5 sm:p-7 border border-slate-700/80 shadow-2xl animate-in zoom-in-95 duration-200 text-right">
        
        {/* Close Button */}
        <button
          onClick={() => setIsInstallModalOpen(false)}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-all duration-150 active:scale-95 z-10"
          title="إغلاق"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 shadow-inner">
            <AppWindow className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              تثبيت تطبيق FileFly
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تشغيل التطبيق في نافذة مستقلة مع وصول سريع وأداء فائق
            </p>
          </div>
        </div>

        {/* Segmented Platform Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 mb-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('desktop')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'desktop'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Monitor className="w-4 h-4 shrink-0" />
            <span>كمبيوتر</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'ios'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Apple className="w-4 h-4 shrink-0" />
            <span>آيفون / آيباد</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'android'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>أندرويد</span>
          </button>
        </div>

        {/* IP vs Localhost Notice on Desktop */}
        {activeTab === 'desktop' && !isLocalhost && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs mb-4">
            <div className="font-semibold mb-1 flex items-center gap-1.5 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>ملاحظة مهمة لظهور خيار التثبيت في المتصفح:</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px] mb-2.5">
              متصفحات Chrome و Edge تمنع خيار التثبيت إذا كان الرابط برقم IP (مثل 192.168...). لكي يظهر زر التثبيت، افتح الموقع عبر رابط <strong className="text-white">localhost</strong>.
            </p>
            <a
              href={`http://localhost:${port}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/30 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح الصفحة عبر localhost:{port}</span>
            </a>
          </div>
        )}

        {/* One-Click Native Install (When available) */}
        {deferredInstallPrompt && !installSuccess && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-transparent border border-sky-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span>متصفحك يدعم التثبيت المباشر بنقرة واحدة</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تثبيت فوري كبرنامج مستقل على نظامك
              </p>
            </div>

            <button
              onClick={handleNativeInstall}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>تثبيت الآن</span>
            </button>
          </div>
        )}

        {/* Success Message */}
        {installSuccess && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تم التثبيت بنجاح! يمكنك فتح التطبيق من جهازك الآن.</span>
          </div>
        )}

        {/* Step-by-Step Instructions by Platform */}
        <div className="space-y-3 mb-5">
          {activeTab === 'desktop' && (
            <>
              {/* Step 1: Chrome (Save and share) */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  1
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-slate-200 text-sm mb-1 flex items-center gap-1.5">
                    <span>في متصفح Google Chrome</span>
                  </div>
                  <p className="text-slate-400">
                    اضغط على زر القائمة <span className="font-mono font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⋮</span> بأعلى المتصفح &gt; ثم اختر <strong className="text-slate-200">«حفظ ومشاركة» (Save and share)</strong> &gt; ثم اضغط على <strong className="text-sky-300">«تثبيت FileFly...»</strong>.
                  </p>
                </div>
              </div>

              {/* Step 2: Edge (Apps) */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  2
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-slate-200 text-sm mb-1 flex items-center gap-1.5">
                    <span>في متصفح Microsoft Edge</span>
                  </div>
                  <p className="text-slate-400">
                    اضغط على زر القائمة <span className="font-mono font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">...</span> بأعلى المتصفح &gt; ثم اختر <strong className="text-slate-200">«التطبيقات» (Apps)</strong> &gt; ثم اضغط على <strong className="text-sky-300">«تثبيت هذا الموقع كتطبيق»</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3: Guaranteed Fallback Shortcut */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  3
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-slate-200 text-sm mb-1">
                    طريقة بديلة ومضمونة (إنشاء اختصار كنافذة)
                  </div>
                  <p className="text-slate-400">
                    من قائمة المتصفح <span className="font-mono font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⋮</span> &gt; اختر <strong className="text-slate-200">«حفظ ومشاركة»</strong> &gt; ثم <strong className="text-emerald-300">«إنشاء اختصار...» (Create shortcut)</strong> &gt; وضع علامة صح على <strong className="text-emerald-300">[فتح كنافذة Open as window]</strong>.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'ios' && (
            <>
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  1
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-slate-200 text-sm mb-0.5 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-sky-400" />
                    <span>زر المشاركة في Safari</span>
                  </div>
                  <p className="text-slate-400">
                    افتح الرابط في متصفح <strong className="text-slate-200">Safari</strong>، ثم اضغط على زر المشاركة <span className="inline-flex items-center gap-1 text-sky-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-[11px]"><Share2 className="w-3 h-3" /> Share</span> أسفل الشاشة.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  2
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-slate-200 text-sm mb-0.5 flex items-center gap-1.5">
                    <PlusSquare className="w-4 h-4 text-emerald-400" />
                    <span>إضافة إلى الشاشة الرئيسية</span>
                  </div>
                  <p className="text-slate-400">
                    مرر خيارات المشاركة للأسفل واضغط على <strong className="text-emerald-300">«إضافة إلى الشاشة الرئيسية»</strong> (Add to Home Screen).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  3
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-slate-200 text-sm mb-0.5">
                    تأكيد الإضافة
                  </div>
                  <p className="text-slate-400">
                    اضغط على <strong className="text-emerald-300">«إضافة» (Add)</strong> بالأعلى، وسيظهر التطبيق على شاشتك الرئيسية ويعمل بملء الشاشة وبأعلى سلاسة.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'android' && (
            <>
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  1
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-slate-200 text-sm mb-0.5 flex items-center gap-1.5">
                    <MoreVertical className="w-4 h-4 text-sky-400" />
                    <span>قائمة المتصفح</span>
                  </div>
                  <p className="text-slate-400">
                    في متصفح <strong className="text-slate-200">Chrome</strong> أو متصفح سامسونج، اضغط على زر القائمة <span className="font-mono font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⋮</span> أعلى يمين الشاشة.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  2
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-slate-200 text-sm mb-0.5 flex items-center gap-1.5">
                    <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                    <span>تثبيت التطبيق</span>
                  </div>
                  <p className="text-slate-400">
                    اختر <strong className="text-emerald-300">«تثبيت التطبيق» (Install app)</strong> أو <strong className="text-emerald-300">«إضافة إلى الشاشة الرئيسية»</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  3
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-slate-200 text-sm mb-0.5">
                    جاهز للاستخدام
                  </div>
                  <p className="text-slate-400">
                    سيضاف التطبيق إلى درج التطبيقات بهاتفك مع دعم الإشعارات والعمل في نافذة سريعة ومستقلة.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-300 mb-5">
          <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="font-medium text-[11px]">نافذة مستقلة</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-[11px]">أداء فائق السرعة</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-[11px]">محلي وآمن 100%</span>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => setIsInstallModalOpen(false)}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all active:scale-95 shadow-sm border border-slate-700/60"
        >
          إغلاق النافذة
        </button>
      </div>
    </div>
  );
}
