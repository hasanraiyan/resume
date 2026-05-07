'use client';

import { useState, useEffect, useRef } from 'react';
import { Pencil, Check } from 'lucide-react';

export default function RenameModal({ type, item, onConfirm, onClose }) {
  const currentName = type === 'file' ? item.filename : item.name;
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      onClose();
      return;
    }
    setIsSaving(true);
    await onConfirm(trimmed);
    setIsSaving(false);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-[#f0f5f2] rounded-xl">
              <Pencil className="w-4 h-4 text-[#1f644e]" />
            </div>
            <h2 className="font-bold text-[#1e3a34]">Rename {type}</h2>
          </div>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10 mb-5"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e] disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
