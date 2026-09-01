import React, { useState, useEffect } from 'react';
import { Edit3, X, Check, Laptop } from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function RenameModal() {
  const { isRenameModalOpen, setIsRenameModalOpen, myDevice, updateDeviceName } = useFileFly();
  const [name, setName] = useState('');

  useEffect(() => {
    if (isRenameModalOpen && myDevice?.name) {
      setName(myDevice.name);
    }
  }, [isRenameModalOpen, myDevice]);

  if (!isRenameModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      updateDeviceName(name.trim());
      setIsRenameModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl glass-panel p-6 border border-sky-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setIsRenameModalOpen(false)}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">تعديل اسم الجهاز</h3>
            <p className="text-[11px] text-slate-400">هذا الاسم سيظهر للأجهزة الأخرى على الشبكة</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              اسم جهازك
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: كمبيوتر أحمد، لابتوب العمل..."
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>حفظ الاسم</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRenameModalOpen(false)}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
