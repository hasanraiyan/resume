'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function HolidayModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('manual');

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    onSave({ name: name.trim(), date, type });
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
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#1e3a34]">Add Holiday</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#f0f5f2] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-[#7c8e88]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">Holiday Name</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Durga Puja"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('manual')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    type === 'manual'
                      ? 'bg-[#1f644e] text-white'
                      : 'bg-[#f0f5f2] text-[#7c8e88] hover:bg-[#e5e3d8]'
                  }`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setType('college')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    type === 'college'
                      ? 'bg-[#1f644e] text-white'
                      : 'bg-[#f0f5f2] text-[#7c8e88] hover:bg-[#e5e3d8]'
                  }`}
                >
                  College
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !date}
                className="px-5 py-2 text-sm font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e] disabled:opacity-50 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
