import React, { useState, useEffect } from 'react';
import { UploadCloud, FileUp, Sparkles, Send } from 'lucide-react';
import { useFileFly } from '../context/FileFlyContext.jsx';

export default function DropZone() {
  const { peers, sendFilesToDevice } = useFileFly();
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        setIsWindowDragging(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsWindowDragging(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      dragCounter = 0;
      setIsWindowDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        if (peers.length === 1) {
          // If only 1 peer is online, automatically send to that peer!
          sendFilesToDevice(peers[0], e.dataTransfer.files);
        } else if (peers.length > 1) {
          // Show device selector modal for dropped files
          setDroppedFiles(e.dataTransfer.files);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [peers, sendFilesToDevice]);

  const handleSelectPeerForDroppedFiles = (peer) => {
    if (droppedFiles) {
      sendFilesToDevice(peer, droppedFiles);
      setDroppedFiles(null);
    }
  };

  return (
    <>
      {/* Full Window Drag Overlay */}
      {isWindowDragging && (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md border-4 border-dashed border-brand-400">
          <div className="p-6 rounded-3xl bg-slate-900 border border-brand-500/40 shadow-2xl flex flex-col items-center text-center animate-bounce">
            <UploadCloud className="w-16 h-16 text-brand-400 mb-3" />
            <h3 className="text-xl font-bold text-white mb-1">أفلت الملفات الآن!</h3>
            <p className="text-xs text-slate-300">
              {peers.length === 1
                ? `سيتم إرسال الملفات مباشرة إلى ${peers[0].name}`
                : 'أفلت الملفات لاختيار الجهاز المستلم'}
            </p>
          </div>
        </div>
      )}

      {/* Peer Selector Modal if multiple peers exist on drop */}
      {droppedFiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">اختر الجهاز المستلم</h3>
                <p className="text-xs text-slate-400">
                  تم تحديد {droppedFiles.length} ملف للإرسال
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {peers.map((peer) => (
                <button
                  key={peer.id}
                  onClick={() => handleSelectPeerForDroppedFiles(peer)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl glass-card hover:border-brand-500/40 transition-all text-right group"
                >
                  <div>
                    <div className="font-bold text-sm text-white group-hover:text-brand-300">
                      {peer.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{peer.ip}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-brand-400 font-semibold">
                    <span>إرسال</span>
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setDroppedFiles(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </>
  );
}
