'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function SemesterModal({ semester, onSave, onClose }) {
  const [name, setName] = useState(semester?.name || '');
  const [startDate, setStartDate] = useState(semester?.startDate || '');
  const [endDate, setEndDate] = useState(semester?.endDate || '');
  const [requiredAttendance, setRequiredAttendance] = useState(semester?.requiredAttendance ?? 75);
  const [weeklyHolidays, setWeeklyHolidays] = useState(semester?.weeklyHolidays || [0]);
  const [institutionName, setInstitutionName] = useState(semester?.institutionName || '');

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toggleDay = (day) => {
    setWeeklyHolidays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      startDate,
      endDate,
      requiredAttendance: Number(requiredAttendance),
      weeklyHolidays: weeklyHolidays.sort(),
      institutionName: institutionName.trim(),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
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
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#1e3a34]">
              {semester ? 'Edit Semester' : 'New Semester'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#f0f5f2] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-[#7c8e88]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">Semester Name</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g., "Semester VI"'
                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">
                Institution Name (optional)
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Your college name"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
                />
              </div>
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

            <div>
              <label className="text-xs font-bold text-[#7c8e88] mb-1.5 block">
                Weekly Holidays
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => {
                  const isSelected = weeklyHolidays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1f644e] text-white'
                          : 'bg-[#f0f5f2] text-[#7c8e88] hover:bg-[#e5e3d8]'
                      }`}
                    >
                      {day.label.slice(0, 3)}
                    </button>
                  );
                })}
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
                disabled={!name.trim()}
                className="px-5 py-2 text-sm font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {semester ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
