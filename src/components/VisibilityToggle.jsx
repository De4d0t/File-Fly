import React from 'react';
import { Eye, EyeOff, ShieldCheck, Radio } from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function VisibilityToggle() {
  const { myDevice, toggleVisibility } = useFileFly();
  const isVisible = myDevice?.visible;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleVisibility}
        type="button"
        title={isVisible ? 'انقر للتحويل إلى وضع التخفي' : 'انقر لجعل الجهاز مرئياً للجميع'}
        className={`relative group flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-300 ${
          isVisible
            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400 glow-green'
            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-400'
        }`}
      >
        {/* Pulsing indicator light */}
        <span className="relative flex h-3 w-3">
          {isVisible && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-3 w-3 transition-colors duration-300 ${
              isVisible ? 'bg-emerald-500' : 'bg-slate-500'
            }`}
          ></span>
        </span>

        {/* Icon */}
        {isVisible ? (
          <Eye className="w-5 h-5 text-emerald-400 transition-transform group-hover:scale-110" />
        ) : (
          <EyeOff className="w-5 h-5 text-slate-400 transition-transform group-hover:scale-110" />
        )}

        {/* Label & Status */}
        <div className="flex flex-col text-right">
          <span className="text-xs font-semibold">
            {isVisible ? 'الجهاز مكشوف على الشبكة' : 'وضع التخفي (مخفي)'}
          </span>
          <span className="text-[10px] opacity-70">
            {isVisible ? 'يمكن للآخرين اكتشافك' : 'لا يظهر في رادار الآخرين'}
          </span>
        </div>

        {/* Toggle Slider Pill */}
        <div
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
            isVisible ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
              isVisible ? '-translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </button>
    </div>
  );
}
