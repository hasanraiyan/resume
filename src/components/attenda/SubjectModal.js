'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SUBJECT_COLORS = [
  '#4a86e8',
  '#1f644e',
  '#c94c4c',
  '#e8a34a',
  '#9b59b6',
  '#2ecc71',
  '#e74c3c',
  '#3498db',
  '#f39c12',
  '#1abc9c',
  '#e91e63',
  '#607d8b',
];

export default function SubjectModal({ subject, onSave, onClose }) {
  const [name, setName] = useState(subject?.name || '');
  const [facultyName, setFacultyName] = useState(subject?.facultyName || '');
  const [color, setColor] = useState(subject?.color || SUBJECT_COLORS[0]);
  const [credits, setCredits] = useState(subject?.credits ?? '');
  const [requiredAttendance, setRequiredAttendance] = useState(subject?.requiredAttendance ?? 75);
  const [isActive, setIsActive] = useState(subject?.isActive ?? true);

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      facultyName: facultyName.trim(),
      color,
      credits: credits ? Number(credits) : null,
      requiredAttendance: Number(requiredAttendance),
      isActive,
    });
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#1e3a34]">{subject ? 'Edit Subject' : 'Add Subject'}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#f0f5f2] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-[#7c8e88]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">Subject Name</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Operating Systems"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">
                Faculty Name (optional)
              </label>
              <input
                type="text"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                placeholder="Dr. Sharma"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-lg transition-all cursor-pointer ${
                      color === c ? 'ring-2 ring-offset-2 ring-[#1f644e] scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">
                  Credits (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  placeholder="4"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">
                  Required Attendance %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={requiredAttendance}
                  onChange={(e) => setRequiredAttendance(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#e5e3d8] rounded-full peer peer-checked:bg-[#1f644e] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
              <span className="text-sm text-[#1e3a34]">Active subject</span>
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
                disabled={!name.trim()}
                className="px-5 py-2 text-sm font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {subject ? 'Save' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
