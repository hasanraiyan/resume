'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3 mb-5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                destructive ? 'bg-[#fef2f2]' : 'bg-[#f0f5f2]'
              }`}
            >
              <AlertTriangle
                className={`w-4.5 h-4.5 ${destructive ? 'text-[#c94c4c]' : 'text-[#1f644e]'}`}
              />
            </div>
            <div className="min-w-0">
              <h2 id="confirm-dialog-title" className="font-bold text-[#1e3a34]">
                {title}
              </h2>
              {message && <p className="text-sm text-[#7c8e88] mt-1">{message}</p>}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2 text-sm font-bold text-white rounded-xl transition-colors cursor-pointer ${
                destructive ? 'bg-[#c94c4c] hover:bg-[#b13d3d]' : 'bg-[#1f644e] hover:bg-[#17503e]'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
