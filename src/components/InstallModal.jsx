import React, { useState } from 'react';
import { 
  X, 
  DownloadCloud, 
  Zap, 
  Laptop, 
  Smartphone, 
  Apple, 
  Check, 
  Share, 
  PlusSquare, 
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function InstallModal() {
  const { 
    isInstallModalOpen, 
    setIsInstallModalOpen, 
    deferredInstallPrompt, 
    installPwaApp, 
    isAppInstalled,
    isMobileClient 
  } = useFileFly();

  // Detect exact user platform
  const detectPlatform = () => {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  };

  const detected = detectPlatform();
  const [activeTab, setActiveTab] = useState(detected);
  const [showOtherPlatforms, setShowOtherPlatforms] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

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

  // Get dynamic header details tailored to current device
  const getDeviceHeader = () => {
    if (activeTab === 'ios') {
      return {
        title: 'تثبيت FileFly على الآيفون / الآيباد',
        subtitle: 'إضافة التطبيق إلى شاشتك الرئيسية ليعمل بملء الشاشة وبسرعة فائقة بدون متجر App Store',
        badge: '📱 نظام Apple iOS',
        badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        Icon: Apple,
      };
    }
    if (activeTab === 'android') {
      return {
        title: 'تثبيت FileFly على الأندرويد',
        subtitle: 'تثبيت التطبيق على هاتفك مع دعم الإشعارات والعمل في نافذة مستقلة خفيفة 0 MB',
        badge: '🤖 نظام Android',
        badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        Icon: Smartphone,
      };
    }
    return {
      title: 'تثبيت FileFly على الكمبيوتر',
      subtitle: 'تشغيل البرنامج في نافذة مستقلة مع أيقونة على سطح المكتب وشريط المهام',
      badge: '💻 كمبيوتر (Windows / Mac)',
      badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      Icon: Laptop,
    };
  };

  const deviceHeader = getDeviceHeader();
  const HeaderIcon = deviceHeader.Icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl glass-panel p-5 sm:p-6 border border-sky-500/30 shadow-2xl animate-in zoom-in-95 duration-200 text-right overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => setIsInstallModalOpen(false)}
          className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 p-1.5 sm:p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dynamic Modal Header Tailored to Device */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <HeaderIcon className="w-6 h-6 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {deviceHeader.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${deviceHeader.badgeColor}`}>
                {deviceHeader.badge}
              </span>
              <span className="text-[10px] text-slate-400">تثبيت فوري بدون تنزيل</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
          {deviceHeader.subtitle}
        </p>

        {/* Native 1-Click Install Button (When browser supports instant install) */}
        {deferredInstallPrompt && !installSuccess && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/15 via-brand-500/15 to-emerald-500/15 border border-sky-500/30">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                متصفحك يدعم التثبيت المباشر بنقرة واحدة!
              </span>
            </div>
            <button
              onClick={handleNativeInstall}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-brand-600 hover:from-sky-400 hover:to-brand-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 glow-cyan"
            >
              <DownloadCloud className="w-4 h-4 animate-bounce" />
              <span>تثبيت التطبيق الآن على هذا الجهاز</span>
            </button>
          </div>
        )}

        {installSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>تم التثبيت بنجاح! ستجد FileFly في برامج جهازك.</span>
          </div>
        )}

        {/* Optional Other Platform Selector (Hidden by default, expandable on demand) */}
        {showOtherPlatforms && (
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 mb-4 text-xs font-semibold animate-in fade-in duration-150">
            <button
              onClick={() => setActiveTab('ios')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ios'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>آيفون / آيباد</span>
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'android'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>أندرويد</span>
            </button>
            <button
              onClick={() => setActiveTab('desktop')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'desktop'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>كمبيوتر</span>
            </button>
          </div>
        )}

        {/* Platform-Specific Step-by-Step Instructions */}
        <div className="space-y-3 text-xs text-slate-300 mb-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
          {activeTab === 'ios' && (
            <>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p className="flex items-center gap-1.5 flex-wrap leading-relaxed">
                  في متصفح Safari، اضغط على زر المشاركة 
                  <span className="inline-flex items-center gap-1 text-sky-300 bg-slate-800 px-2 py-0.5 rounded font-mono font-bold border border-slate-700">
                    <Share className="w-3.5 h-3.5" /> Share
                  </span>
                  في أسفل الشاشة.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p className="flex items-center gap-1.5 flex-wrap leading-relaxed">
                  مرر الخيارات للأسفل واختر 
                  <span className="inline-flex items-center gap-1 text-emerald-300 bg-slate-800 px-2 py-0.5 rounded font-bold border border-slate-700">
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-400" /> إضافة إلى الشاشة الرئيسية
                  </span>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-relaxed">
                  اضغط على <strong className="text-white">«إضافة» (Add)</strong> في الزاوية العلوية، وسيظهر FileFly كـ تطبيق مستقل على شاشتك فوراً!
                </p>
              </div>
            </>
          )}

          {activeTab === 'android' && (
            <>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-relaxed">
                  افتح قائمة خيارات المتصفح <span className="font-mono text-emerald-300 font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⋮</span> في الزاوية العلوية لمتصفح Chrome أو Samsung.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-relaxed">
                  اضغط على <strong className="text-emerald-300">«تثبيت التطبيق» (Install app)</strong> أو <strong className="text-emerald-300">«إضافة إلى الشاشة الرئيسية»</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-relaxed">
                  سيضاف التطبيق إلى شاشتك الرئيسية ويعمل بسرعة فائقة مع دعم كامل للاهتزاز والإشعارات!
                </p>
              </div>
            </>
          )}

          {activeTab === 'desktop' && (
            <>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-relaxed">
                  من شريط العنوان أعلى متصفح <strong>Chrome</strong> أو <strong>Edge</strong>، اضغط على أيقونة التثبيت <span className="font-mono text-sky-300 font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">💻⊕</span>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-relaxed">
                  أو افتح قائمة الخيارات <span className="font-mono text-sky-300 font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⋮</span> واختر <strong>«تثبيت FileFly»</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-relaxed">
                  سيفتح البرنامج فوراً في نافذة خاصة به مستقلة وتظهر أيقونته على سطح المكتب!
                </p>
              </div>
            </>
          )}
        </div>

        {/* Benefits Badges */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-4">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>يعمل بدون إنترنت (محلياً)</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>إشعارات واهتزاز فوري</span>
          </div>
        </div>

        {/* Toggle Other Platforms */}
        <div className="mb-3 text-center">
          <button
            type="button"
            onClick={() => setShowOtherPlatforms(!showOtherPlatforms)}
            className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <span>{showOtherPlatforms ? 'إخفاء الأجهزة الأخرى' : 'تثبيت على جهاز أو نظام آخر؟'}</span>
            {showOtherPlatforms ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => setIsInstallModalOpen(false)}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
        >
          حسناً، فهمت
        </button>
      </div>
    </div>
  );
}
