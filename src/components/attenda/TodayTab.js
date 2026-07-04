'use client';

import { useAttenda } from '@/context/AttendaContext';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { formatTime12H } from '@/utils/string';
import { Check, X, Ban, Plus, Save, Calendar, Building2, Edit3, AlertCircle } from 'lucide-react';
import AddExtraClassModal from '@/components/attenda/AddExtraClassModal';
import DayDetailModal from '@/components/attenda/DayDetailModal';

const COLLEGE_STATUSES = [
  {
    value: 'present',
    label: 'Present',
    icon: Check,
    color: 'text-[#1f644e]',
    bg: 'bg-[#1f644e]/10',
  },
  { value: 'absent', label: 'Absent', icon: X, color: 'text-[#c94c4c]', bg: 'bg-[#c94c4c]/10' },
  {
    value: 'holiday',
    label: 'Holiday',
    icon: Calendar,
    color: 'text-[#4a86e8]',
    bg: 'bg-[#4a86e8]/10',
  },
  {
    value: 'closed',
    label: 'College Closed',
    icon: Building2,
    color: 'text-[#7c8e88]',
    bg: 'bg-[#7c8e88]/10',
  },
];

const LECTURE_STATUSES = [
  { value: 'present', label: 'Present', icon: Check, color: 'text-[#1f644e]' },
  { value: 'absent', label: 'Absent', icon: X, color: 'text-[#c94c4c]' },
  { value: 'cancelled', label: 'Cancelled', icon: Ban, color: 'text-[#7c8e88]' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TodayTab() {
  const {
    activeSemester,
    activeSemesterId,
    todaysLectures,
    getTodayStatus,
    getSavedDay,
    saveToday,
    saveDayRecord,
    allDays,
    subjects,
    holidays,
  } = useAttenda();

  const [collegeStatus, setCollegeStatus] = useState('present');
  const [lectureStatuses, setLectureStatuses] = useState({});
  const [extraLectures, setExtraLectures] = useState([]);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showMissedDayModal, setShowMissedDayModal] = useState(false);
  const [missedDayDate, setMissedDayDate] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const today = new Date();
  const formatDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dateKey = formatDateKey(today);
  const dayName = DAYS[today.getDay()];
  const dateStr = `${today.getDate()} ${MONTHS[today.getMonth()]}`;

  // Holidays set for quick lookup
  const holidaysSet = useMemo(() => {
    return new Set((holidays || []).map((h) => h.date));
  }, [holidays]);

  // Compute missed days: past weekdays without attendance records
  const missedDays = useMemo(() => {
    if (!activeSemester?.startDate) return [];

    const today = new Date();
    const startDate = new Date(activeSemester.startDate + 'T00:00:00');
    const weeklyHolidays = activeSemester.weeklyHolidays || [];

    const result = [];
    const current = new Date(startDate);

    while (current < today) {
      const dk = formatDateKey(current);
      const dayOfWeek = current.getDay();

      // Skip weekly holidays (e.g. Sunday)
      if (!weeklyHolidays.includes(dayOfWeek)) {
        // Skip declared holidays
        if (!holidaysSet.has(dk)) {
          // Skip days that already have a record
          if (!allDays[dk]) {
            result.push(dk);
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [activeSemester, allDays, holidaysSet]);

  // Was today already saved? Sync with context changes (e.g. saved from Calendar tab).
  // Only re-run when context data changes — NOT on isSaved changes (to avoid overriding Edit).
  useEffect(() => {
    const existing = getTodayStatus();
    if (existing) {
      setCollegeStatus(existing.collegeStatus || 'present');
      setLectureStatuses(
        (existing.lectures || []).reduce((acc, lec) => {
          acc[lec.id] = lec.status;
          return acc;
        }, {})
      );
      setExtraLectures(existing.lectures?.filter((l) => l.isExtra) || []);
      setIsSaved(true);
    } else if (todaysLectures.length > 0) {
      // Pre-fill present for scheduled lectures
      const initial = {};
      todaysLectures.forEach((lec) => {
        initial[lec.id] = 'present';
      });
      setLectureStatuses(initial);
    }
  }, [getTodayStatus, todaysLectures]);

  // Pre-fill when timetable loads and no existing day saved
  useEffect(() => {
    if (!isSaved && todaysLectures.length > 0 && Object.keys(lectureStatuses).length === 0) {
      const initial = {};
      todaysLectures.forEach((lec) => {
        initial[lec.id] = 'present';
      });
      setLectureStatuses(initial);
    }
  }, [todaysLectures, isSaved, lectureStatuses]);

  // When collegeStatus changes, pre-fill all lecture statuses accordingly
  const handleCollegeStatus = useCallback(
    (status) => {
      setCollegeStatus(status);
      if (status === 'absent') {
        const absentStatuses = {};
        todaysLectures.forEach((lec) => {
          absentStatuses[lec.id] = 'absent';
        });
        extraLectures.forEach((lec) => {
          absentStatuses[lec.id] = 'absent';
        });
        setLectureStatuses(absentStatuses);
      } else if (status === 'present' && !isSaved) {
        // Pre-fill present
        const presentStatuses = {};
        todaysLectures.forEach((lec) => {
          presentStatuses[lec.id] = 'present';
        });
        extraLectures.forEach((lec) => {
          presentStatuses[lec.id] = 'present';
        });
        setLectureStatuses(presentStatuses);
      } else if ((status === 'holiday' || status === 'closed') && !isSaved) {
        // Pre-fill cancelled
        const cancelledStatuses = {};
        todaysLectures.forEach((lec) => {
          cancelledStatuses[lec.id] = 'cancelled';
        });
        extraLectures.forEach((lec) => {
          cancelledStatuses[lec.id] = 'cancelled';
        });
        setLectureStatuses(cancelledStatuses);
      }
    },
    [todaysLectures, extraLectures, isSaved]
  );

  const toggleLectureStatus = useCallback((lectureId) => {
    setLectureStatuses((prev) => {
      const statusOrder = ['present', 'absent', 'cancelled'];
      const current = prev[lectureId] || 'present';
      const nextIdx = (statusOrder.indexOf(current) + 1) % statusOrder.length;
      return { ...prev, [lectureId]: statusOrder[nextIdx] };
    });
  }, []);

  const handleAddExtra = useCallback(
    (subjectId, startTime, endTime) => {
      const subject = subjects.find((s) => s.id === subjectId);
      const newLecture = {
        id: `extra_${Date.now()}`,
        subjectId,
        startTime,
        endTime,
        name: subject?.name || 'Extra Class',
        subjectColor: subject?.color || '#4a86e8',
        isExtra: true,
        status: 'present',
      };
      setExtraLectures((prev) => [...prev, newLecture]);
      setLectureStatuses((prev) => ({ ...prev, [newLecture.id]: 'present' }));
      setShowExtraModal(false);
    },
    [subjects]
  );

  const handleSave = useCallback(() => {
    // Build lectures array
    const scheduled = todaysLectures.map((lec) => ({
      id: lec.id,
      subjectId: lec.subjectId,
      status: lectureStatuses[lec.id] || 'present',
      isExtra: false,
      startTime: lec.startTime,
      endTime: lec.endTime,
    }));

    const extra = extraLectures.map((lec) => ({
      id: lec.id,
      subjectId: lec.subjectId,
      status: lectureStatuses[lec.id] || 'present',
      isExtra: true,
      startTime: lec.startTime,
      endTime: lec.endTime,
    }));

    saveToday({
      collegeStatus,
      lectures: [...scheduled, ...extra],
      notes: '',
    });

    setSaved(true);
    setIsSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [todaysLectures, extraLectures, lectureStatuses, collegeStatus, saveToday]);

  const handleOpenMissedDay = useCallback((dateKey) => {
    setMissedDayDate(dateKey);
    setShowMissedDayModal(true);
  }, []);

  const handleSaveMissedDay = useCallback(
    (dateKey, dayData) => {
      saveDayRecord(dateKey, dayData);
      setShowMissedDayModal(false);
      setMissedDayDate(null);
    },
    [saveDayRecord]
  );

  const isWeeklyHoliday = activeSemester?.weeklyHolidays?.includes(today.getDay());

  // Don't show on holidays
  if (isWeeklyHoliday && !isSaved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#4a86e8]/10 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-[#4a86e8]" />
        </div>
        <p className="text-lg font-bold text-[#1e3a34]">It&apos;s {dayName}!</p>
        <p className="text-sm text-[#7c8e88] mt-1">Weekly holiday — no classes today.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 mb-6 pb-4 pt-6">
      {/* Date Header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">{dayName}</p>
        <h1 className="text-2xl font-bold text-[#1e3a34] mt-0.5">{dateStr}</h1>
        <p className="text-sm text-[#7c8e88] mt-0.5">{activeSemester?.name}</p>
      </div>

      {/* Step 1: College Status */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-3">College</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COLLEGE_STATUSES.map((s) => {
            const isActive = collegeStatus === s.value;
            return (
              <button
                key={s.value}
                onClick={() => handleCollegeStatus(s.value)}
                disabled={isSaved}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? `${s.bg} ${s.color} border-transparent`
                    : 'bg-white border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1e3a34]'
                } ${isSaved ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Lecture Statuses */}
      {(collegeStatus === 'present' || collegeStatus === 'absent') &&
        (todaysLectures.length > 0 || extraLectures.length > 0) && (
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-3">
              Today&apos;s Lectures
            </p>
            <div className="space-y-2">
              {todaysLectures.map((lec) => {
                const status = lectureStatuses[lec.id] || 'present';
                const statusInfo = LECTURE_STATUSES.find((s) => s.value === status);
                const StatusIcon = statusInfo?.icon || Check;
                return (
                  <button
                    key={lec.id}
                    onClick={() => !isSaved && toggleLectureStatus(lec.id)}
                    disabled={isSaved}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSaved ? 'opacity-70 cursor-not-allowed' : 'hover:border-[#1f644e]'
                    } ${
                      status === 'present'
                        ? 'bg-white border-[#e5e3d8]'
                        : status === 'absent'
                          ? 'bg-[#c94c4c]/5 border-[#c94c4c]/30'
                          : 'bg-[#f0f5f2] border-[#e5e3d8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: lec.subjectColor }}
                      />
                      <div className="text-left">
                        <p className="text-sm font-bold text-[#1e3a34]">{lec.subjectName}</p>
                        <p className="text-xs text-[#7c8e88]">
                          {formatTime12H(lec.startTime)}{' '}
                          {lec.endTime ? `- ${formatTime12H(lec.endTime)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-sm font-bold ${statusInfo?.color}`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      <span>{statusInfo?.label || 'Present'}</span>
                    </div>
                  </button>
                );
              })}
              {extraLectures.map((lec) => {
                const status = lectureStatuses[lec.id] || 'present';
                const statusInfo = LECTURE_STATUSES.find((s) => s.value === status);
                const StatusIcon = statusInfo?.icon || Check;
                return (
                  <button
                    key={lec.id}
                    onClick={() => !isSaved && toggleLectureStatus(lec.id)}
                    disabled={isSaved}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSaved ? 'opacity-70 cursor-not-allowed' : 'hover:border-[#1f644e]'
                    } ${
                      status === 'present'
                        ? 'bg-white border-[#e5e3d8]'
                        : status === 'absent'
                          ? 'bg-[#c94c4c]/5 border-[#c94c4c]/30'
                          : 'bg-[#f0f5f2] border-[#e5e3d8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: lec.subjectColor || '#4a86e8' }}
                      />
                      <div className="text-left">
                        <p className="text-sm font-bold text-[#1e3a34]">
                          {lec.name || 'Extra Class'}
                        </p>
                        <p className="text-xs text-[#7c8e88]">
                          {formatTime12H(lec.startTime)}{' '}
                          {lec.endTime ? `- ${formatTime12H(lec.endTime)}` : ''}
                          <span className="ml-1.5 text-[#4a86e8] font-bold">Extra</span>
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-sm font-bold ${statusInfo?.color}`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      <span>{statusInfo?.label || 'Present'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {/* College is absent banner */}
      {collegeStatus === 'absent' && (
        <div className="mb-6 p-4 rounded-xl bg-[#c94c4c]/5 border border-[#c94c4c]/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#c94c4c]" />
            <p className="text-sm font-bold text-[#c94c4c]">
              College status: Absent (e.g. missed biometric)
            </p>
          </div>
          <p className="text-xs text-[#7c8e88] mt-1 ml-7">
            All classes are preset to absent, but you can mark any lectures you actually attended as
            present below.
          </p>
        </div>
      )}

      {/* College is Holiday or Closed banner */}
      {(collegeStatus === 'holiday' || collegeStatus === 'closed') && (
        <div className="mb-6 p-4 rounded-xl bg-[#4a86e8]/5 border border-[#4a86e8]/20">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#4a86e8]" />
            <p className="text-sm font-bold text-[#4a86e8]">
              College status: {collegeStatus === 'holiday' ? 'Holiday' : 'College Closed'}
            </p>
          </div>
          <p className="text-xs text-[#7c8e88] mt-1 ml-7">
            All lectures for today are automatically marked as cancelled.
          </p>
        </div>
      )}

      {/* Step 3: Add Extra Class */}
      {!isSaved && (collegeStatus === 'present' || collegeStatus === 'absent') && (
        <button
          onClick={() => setShowExtraModal(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-[#e5e3d8] text-sm font-bold text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] transition-all cursor-pointer mb-6"
        >
          <Plus className="w-4 h-4" />
          Add Extra Class
        </button>
      )}

      {/* Step 4: Save Button */}
      {!isSaved && (
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-[#1f644e] text-white px-6 py-3.5 rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      )}

      {/* Saved confirmation + Edit button */}
      {isSaved && (
        <div className="mt-4 space-y-3">
          {saved && (
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1f644e] animate-pulse">
              <Check className="w-4 h-4" />
              Saved!
            </div>
          )}

          {!saved && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#7c8e88]">
              <Check className="w-4 h-4" />
              Today&apos;s attendance saved
            </div>
          )}

          <button
            onClick={() => {
              setIsSaved(false);
              setSaved(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#e5e3d8] text-sm font-bold text-[#1e3a34] rounded-xl hover:bg-[#f0f5f2] transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            Edit Today&apos;s Attendance
          </button>
        </div>
      )}

      {/* Missed Days Banner */}
      {missedDays.length > 0 && !isSaved && (
        <div className="mt-6 p-3 rounded-xl bg-[#fef2f2] border border-[#c94c4c]/20">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#c94c4c] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#c94c4c]">Missed attendance</p>
              <div className="mt-1.5 space-y-1">
                {missedDays.map((dateKey) => {
                  const d = new Date(dateKey + 'T00:00:00');
                  const label = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
                  return (
                    <button
                      key={dateKey}
                      onClick={() => handleOpenMissedDay(dateKey)}
                      className="block w-full text-left text-xs text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#fcfbf5] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {label} — tap to mark now
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showExtraModal && (
        <AddExtraClassModal
          subjects={subjects}
          onAdd={handleAddExtra}
          onClose={() => setShowExtraModal(false)}
        />
      )}

      {showMissedDayModal && missedDayDate && (
        <DayDetailModal
          dateKey={missedDayDate}
          day={getSavedDay(missedDayDate)}
          subjects={subjects}
          activeSemester={activeSemester}
          onSave={handleSaveMissedDay}
          onClose={() => {
            setShowMissedDayModal(false);
            setMissedDayDate(null);
          }}
        />
      )}
    </div>
  );
}
