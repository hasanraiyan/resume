import { useState, useEffect, useMemo } from 'react';
import { X, Check, Ban } from 'lucide-react';
import { useAttenda } from '@/context/AttendaContext';

const COLLEGE_STATUSES = [
  { value: 'present', label: 'Present', color: 'text-[#1f644e]' },
  { value: 'absent', label: 'Absent', color: 'text-[#c94c4c]' },
  { value: 'holiday', label: 'Holiday', color: 'text-[#4a86e8]' },
  { value: 'closed', label: 'College Closed', color: 'text-[#7c8e88]' },
];

const LECTURE_STATUSES = [
  { value: 'present', label: 'Present', icon: Check, color: 'text-[#1f644e]' },
  { value: 'absent', label: 'Absent', icon: X, color: 'text-[#c94c4c]' },
  { value: 'cancelled', label: 'Cancelled', icon: Ban, color: 'text-[#7c8e88]' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DayDetailModal({
  dateKey,
  day,
  subjects,
  activeSemester,
  onSave,
  onClose,
}) {
  const { getTimetableForSemester, holidays } = useAttenda();

  const isDeclaredHoliday = useMemo(() => {
    return holidays?.some((h) => h.date === dateKey);
  }, [holidays, dateKey]);

  const defaultCollegeStatus = isDeclaredHoliday ? 'holiday' : 'present';

  const dateObj = new Date(dateKey + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();

  const timetable = getTimetableForSemester();
  const slots = timetable?.slots?.[dayOfWeek] || [];

  // Map slots to lectures format
  const defaultLectures = useMemo(() => {
    return slots.map((slot) => {
      const sub = subjects.find((s) => s.id === slot.subjectId);
      return {
        id: slot.id || `slot_${slot.subjectId}_${slot.startTime}`,
        subjectId: slot.subjectId,
        status: 'present',
        startTime: slot.startTime,
        endTime: slot.endTime,
        isExtra: false,
      };
    });
  }, [slots, subjects]);

  const activeLectures = day?.lectures || defaultLectures;

  const [collegeStatus, setCollegeStatus] = useState(
    () => day?.collegeStatus || defaultCollegeStatus
  );
  const [lectureStatuses, setLectureStatuses] = useState(() => {
    const statuses = {};
    activeLectures.forEach((lec) => {
      statuses[lec.id] = lec.status;
    });
    return statuses;
  });
  const [isSaving, setIsSaving] = useState(false);

  const dayName = DAY_NAMES[dateObj.getDay()];
  const dateStr = `${dateObj.getDate()} ${MONTHS[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  const toggleLecture = (lectureId) => {
    setLectureStatuses((prev) => {
      const order = ['present', 'absent', 'cancelled'];
      const current = prev[lectureId] || 'present';
      const nextIdx = (order.indexOf(current) + 1) % order.length;
      return { ...prev, [lectureId]: order[nextIdx] };
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    const lectures = activeLectures.map((lec) => ({
      ...lec,
      status: lectureStatuses[lec.id] || 'present',
    }));
    onSave(dateKey, {
      ...day,
      collegeStatus,
      lectures,
    });
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">{dayName}</p>
              <h2 className="text-lg font-bold text-[#1e3a34]">{dateStr}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#f0f5f2] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-[#7c8e88]" />
            </button>
          </div>

          {/* College Status */}
          <div className="mb-4">
            <p className="text-xs font-bold text-[#7c8e88] mb-2">College</p>
            <div className="flex flex-wrap gap-1.5">
              {COLLEGE_STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    setCollegeStatus(s.value);
                    if (s.value === 'holiday' || s.value === 'closed') {
                      const cancelled = {};
                      activeLectures.forEach((l) => {
                        cancelled[l.id] = 'cancelled';
                      });
                      setLectureStatuses(cancelled);
                    } else if (s.value === 'absent') {
                      const absent = {};
                      activeLectures.forEach((l) => {
                        absent[l.id] = 'absent';
                      });
                      setLectureStatuses(absent);
                    } else if (s.value === 'present') {
                      const present = {};
                      activeLectures.forEach((l) => {
                        present[l.id] = 'present';
                      });
                      setLectureStatuses(present);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    collegeStatus === s.value
                      ? 'bg-[#1f644e] text-white'
                      : 'bg-[#f0f5f2] text-[#7c8e88] hover:bg-[#e5e3d8]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lectures */}
          {activeLectures && activeLectures.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-[#7c8e88] mb-2">Lectures</p>
              <div className="space-y-1.5">
                {activeLectures.map((lec) => {
                  const status = lectureStatuses[lec.id] || 'present';
                  const subject = subjects.find((s) => s.id === lec.subjectId);
                  return (
                    <button
                      key={lec.id}
                      onClick={() => toggleLecture(lec.id)}
                      disabled={collegeStatus === 'holiday' || collegeStatus === 'closed'}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        collegeStatus === 'holiday' || collegeStatus === 'closed'
                          ? 'bg-[#f0f5f2] border-[#e5e3d8] opacity-75 cursor-not-allowed'
                          : 'cursor-pointer'
                      } ${
                        status === 'present'
                          ? 'bg-white border-[#e5e3d8] hover:border-[#1f644e]'
                          : status === 'absent'
                            ? 'bg-[#c94c4c]/5 border-[#c94c4c]/30'
                            : 'bg-[#f0f5f2] border-[#e5e3d8]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {subject && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: subject.color }}
                          />
                        )}
                        <div className="text-left">
                          <p className="text-sm font-bold text-[#1e3a34]">
                            {subject?.name || 'Unknown Subject'}
                          </p>
                          <p className="text-xs text-[#7c8e88]">
                            {lec.startTime}
                            {lec.endTime ? ` - ${lec.endTime}` : ''}
                            {lec.isExtra && (
                              <span className="ml-1.5 text-[#4a86e8] font-bold">Extra</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          LECTURE_STATUSES.find((ls) => ls.value === status)?.color ||
                          'text-[#7c8e88]'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(!activeLectures || activeLectures.length === 0) && (
            <div className="mb-4 p-4 rounded-xl bg-[#fcfbf5] text-center">
              <p className="text-sm text-[#7c8e88]">No lectures scheduled for this day</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-sm font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
