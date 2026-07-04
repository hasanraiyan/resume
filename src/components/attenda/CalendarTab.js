'use client';

import { useAttenda } from '@/context/AttendaContext';
import { useState, useMemo } from 'react';
import { formatTime12H } from '@/utils/string';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Calendar,
  Building2,
  AlertCircle,
} from 'lucide-react';
import DayDetailModal from '@/components/attenda/DayDetailModal';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LECTURE_STATUS_DOTS = {
  present: 'bg-[#1f644e]',
  absent: 'bg-[#c94c4c]',
  cancelled: 'bg-[#7c8e88]',
};

export default function CalendarTab() {
  const {
    allDays,
    activeSemester,
    getSavedDay,
    saveDayRecord,
    subjects,
    holidays,
    getTimetableForSemester,
  } = useAttenda();

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const weeklyHolidays = new Set(activeSemester?.weeklyHolidays || []);

  const navigateMonth = (delta) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const openDay = (dateKey) => {
    const day = allDays[dateKey] || getSavedDay(dateKey);
    setSelectedDate({ dateKey, day });
    setShowDayModal(true);
  };

  // Declared holidays lookup map
  const declaredHolidaysMap = useMemo(() => {
    const map = {};
    (holidays || []).forEach((h) => {
      if (h.date) {
        map[h.date] = h;
      }
    });
    return map;
  }, [holidays]);

  // Holidays set for quick lookup
  const holidaysSet = useMemo(() => {
    return new Set((holidays || []).map((h) => h.date));
  }, [holidays]);

  // Format date helper function
  const formatDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  // Compute missed days: past weekdays without attendance records
  const missedDays = useMemo(() => {
    if (!activeSemester?.startDate) return [];

    const today = new Date();
    const startDate = new Date(activeSemester.startDate + 'T00:00:00');
    const semWeeklyHolidays = activeSemester.weeklyHolidays || [];

    const result = [];
    const current = new Date(startDate);

    // Normalize today to start of day for comparison
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    while (current < todayStart) {
      const dk = formatDateKey(current);
      const dayOfWeek = current.getDay();

      // Skip weekly holidays
      if (!semWeeklyHolidays.includes(dayOfWeek)) {
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

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const days = [];
    const timetable = getTimetableForSemester();

    // Previous month overflow
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = prevMonthDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      days.push({
        day: date,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: false,
        isFuture: new Date(y, m, date) > today,
        isWeeklyHoliday: false,
        declaredHoliday: declaredHolidaysMap[dateKey],
        dateKey,
        dayOfWeek: new Date(y, m, date).getDay(),
        lectures: [],
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month, d);
      const dayOfWeek = dateObj.getDay();
      const slots = timetable?.slots?.[dayOfWeek] || [];
      const cellLectures = slots.map((slot) => {
        const sub = subjects.find((s) => s.id === slot.subjectId);
        return {
          subjectName: sub?.name || 'Unknown Subject',
          startTime: slot.startTime,
          endTime: slot.endTime,
          color: sub?.color || '#4a86e8',
        };
      });

      days.push({
        day: d,
        month,
        year,
        isCurrentMonth: true,
        isToday:
          d === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
        isFuture: dateObj > today,
        isWeeklyHoliday: weeklyHolidays.has(dayOfWeek),
        declaredHoliday: declaredHolidaysMap[dateKey],
        dateKey,
        dayOfWeek,
        lectures: cellLectures,
      });
    }

    // Next month overflow (to fill 6 rows max)
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let d = 1; days.length < totalCells; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: false,
        isFuture: new Date(y, m, d) > today,
        isWeeklyHoliday: false,
        declaredHoliday: declaredHolidaysMap[dateKey],
        dateKey,
        dayOfWeek: new Date(y, m, d).getDay(),
        lectures: [],
      });
    }

    return days;
  }, [
    year,
    month,
    firstDay,
    daysInMonth,
    prevMonthDays,
    today,
    weeklyHolidays,
    declaredHolidaysMap,
    subjects,
    getTimetableForSemester,
  ]);

  // Compute month stats
  const monthStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let holiday = 0;
    let closed = 0;

    Object.keys(allDays).forEach((dateKey) => {
      const d = new Date(dateKey + 'T00:00:00');
      if (d.getMonth() === month && d.getFullYear() === year) {
        const record = allDays[dateKey];
        if (record.collegeStatus === 'present') present++;
        else if (record.collegeStatus === 'absent') absent++;
        else if (record.collegeStatus === 'holiday') holiday++;
        else if (record.collegeStatus === 'closed') closed++;
      }
    });

    return { present, absent, holiday, closed, total: present + absent + holiday + closed };
  }, [allDays, month, year]);

  // Get holidays in current month
  const monthlyHolidaysList = useMemo(() => {
    return (holidays || []).filter((h) => {
      if (!h.date) return false;
      const hDate = new Date(h.date + 'T00:00:00');
      return hDate.getMonth() === month && hDate.getFullYear() === year;
    });
  }, [holidays, month, year]);

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 mb-6 pb-4 pt-6">
      {/* Missed Days Banner */}
      {missedDays.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-[#c94c4c]/5 border border-[#c94c4c]/20 animate-in fade-in duration-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#c94c4c] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#c94c4c]">Missed attendance records</p>
              <p className="text-xs text-[#7c8e88] mt-0.5">
                You haven&apos;t marked attendance for the following college days:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {missedDays.map((dateKey) => {
                  const d = new Date(dateKey + 'T00:00:00');
                  const label = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
                  return (
                    <button
                      key={dateKey}
                      onClick={() => openDay(dateKey)}
                      className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-[#fcfbf5] border border-[#e5e3d8] hover:border-[#1f644e] text-[#1e3a34] rounded-lg transition-all cursor-pointer"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-lg hover:bg-[#f0f5f2] transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-[#1e3a34]" />
        </button>
        <h2 className="text-lg font-bold text-[#1e3a34]">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-lg hover:bg-[#f0f5f2] transition-colors cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-[#1e3a34]" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-center text-xs font-bold text-[#7c8e88] py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((cell, idx) => {
          const dayRecord = allDays[cell.dateKey];
          const hasData = !!dayRecord;
          const isHoliday = cell.isWeeklyHoliday;
          const isFuture = cell.isFuture;
          const isCurrentMonth = cell.isCurrentMonth;

          let cellClass = '';
          if (cell.isToday) {
            cellClass =
              'bg-gradient-to-br from-[#1f644e] to-[#17503e] text-white font-bold border-transparent shadow-md shadow-[#1f644e]/20 ring-2 ring-[#1f644e]/20 ring-offset-2';
          } else if (!isCurrentMonth) {
            cellClass =
              'bg-neutral-50/20 border-transparent text-neutral-300 opacity-25 pointer-events-none';
          } else if (isFuture) {
            cellClass = cell.declaredHoliday
              ? 'bg-[#4a86e8]/5 border-[#4a86e8]/20 text-[#4a86e8]/60 cursor-default font-semibold'
              : isHoliday
                ? 'bg-neutral-50/50 border-transparent text-[#7c8e88]/40 cursor-default'
                : 'bg-[#fafafa] border-[#f0f0f0] text-neutral-400/80 cursor-default';
          } else if (hasData) {
            if (dayRecord.collegeStatus === 'present') {
              cellClass =
                'bg-[#1f644e]/10 border-[#1f644e]/30 text-[#1f644e] hover:bg-[#1f644e]/20 font-bold';
            } else if (dayRecord.collegeStatus === 'absent') {
              cellClass =
                'bg-[#c94c4c]/10 border-[#c94c4c]/30 text-[#c94c4c] hover:bg-[#c94c4c]/20 font-bold';
            } else if (dayRecord.collegeStatus === 'holiday') {
              cellClass =
                'bg-[#4a86e8]/10 border-[#4a86e8]/30 text-[#4a86e8] hover:bg-[#4a86e8]/20 font-bold';
            } else {
              cellClass = 'bg-neutral-100 border-[#e5e3d8] text-[#1e3a34] hover:bg-neutral-200';
            }
          } else if (cell.declaredHoliday) {
            cellClass =
              'bg-[#4a86e8]/10 border-[#4a86e8]/30 text-[#4a86e8] hover:bg-[#4a86e8]/20 font-semibold';
          } else if (isHoliday) {
            cellClass =
              'bg-neutral-100/50 border-transparent text-[#7c8e88] hover:bg-[#f0f5f2] hover:border-[#1f644e]';
          } else {
            cellClass =
              'bg-white border-[#e5e3d8] text-[#1e3a34] hover:bg-[#fcfbf5] hover:border-[#1f644e]';
          }

          return (
            <button
              key={idx}
              onClick={() => {
                if (isCurrentMonth) {
                  openDay(cell.dateKey);
                }
              }}
              disabled={!isCurrentMonth}
              className={`group relative flex flex-col items-center justify-between p-2 rounded-2xl aspect-square text-sm transition-all hover:scale-105 border ${cellClass}`}
            >
              <div className="w-full flex justify-between items-start">
                <span className="text-xs font-bold leading-none">{cell.day}</span>
                {/* Status Icon */}
                {hasData && (
                  <span className="text-[10px] leading-none">
                    {dayRecord.collegeStatus === 'present' && (
                      <Check className="w-3 h-3 text-[#1f644e]" />
                    )}
                    {dayRecord.collegeStatus === 'absent' && (
                      <X className="w-3 h-3 text-[#c94c4c]" />
                    )}
                    {dayRecord.collegeStatus === 'holiday' && (
                      <Calendar className="w-3 h-3 text-[#4a86e8]" />
                    )}
                    {dayRecord.collegeStatus === 'closed' && (
                      <Building2 className="w-3 h-3 text-[#7c8e88]" />
                    )}
                  </span>
                )}
                {!hasData && cell.declaredHoliday && (
                  <Calendar className="w-3 h-3 text-[#4a86e8]/70" />
                )}
              </div>

              {/* Bottom indicators */}
              <div className="w-full flex justify-center items-center gap-0.5 mt-auto">
                {hasData && dayRecord.lectures?.length > 0 && (
                  <div className="flex gap-0.5 max-w-full overflow-hidden">
                    {dayRecord.lectures.map((lec, lIdx) => (
                      <span
                        key={lIdx}
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${LECTURE_STATUS_DOTS[lec.status] || 'bg-neutral-300'}`}
                      />
                    ))}
                  </div>
                )}
                {!hasData && cell.declaredHoliday && (
                  <span className="text-[9px] font-bold text-[#4a86e8]/80 truncate max-w-full leading-none">
                    {cell.declaredHoliday.name}
                  </span>
                )}
                {!hasData && !cell.declaredHoliday && isHoliday && (
                  <span className="text-[9px] font-semibold text-[#7c8e88]/60 truncate max-w-full leading-none">
                    Off
                  </span>
                )}
              </div>

              {/* Hover schedule tooltip for future days */}
              {isFuture && isCurrentMonth && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white border border-[#e5e3d8] rounded-xl shadow-xl p-3 text-left hidden group-hover:block z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#7c8e88] mb-1.5">
                    {cell.declaredHoliday ? 'Holiday Schedule' : 'Scheduled Classes'}
                  </p>
                  {cell.declaredHoliday ? (
                    <div className="text-xs font-bold text-[#4a86e8]">
                      {cell.declaredHoliday.name}
                    </div>
                  ) : cell.lectures && cell.lectures.length > 0 ? (
                    <div className="space-y-1.5">
                      {cell.lectures.map((lec, lIdx) => (
                        <div key={lIdx} className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: lec.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#1e3a34] truncate leading-none">
                              {lec.subjectName}
                            </p>
                            <p className="text-[9px] text-[#7c8e88] leading-none mt-0.5">
                              {formatTime12H(lec.startTime)} - {formatTime12H(lec.endTime)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#7c8e88]">No classes scheduled</div>
                  )}
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#e5e3d8] -z-10 mt-[1px]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-[#e5e3d8]/40 pb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1f644e]" />
          <span className="text-xs text-[#7c8e88]">Present</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c94c4c]" />
          <span className="text-xs text-[#7c8e88]">Absent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4a86e8]" />
          <span className="text-xs text-[#7c8e88]">Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7c8e88]" />
          <span className="text-xs text-[#7c8e88]">Closed</span>
        </div>
      </div>

      {/* Monthly Summary Stats Dashboard */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#f0f5f2] rounded-2xl border border-[#1f644e]/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
            Days Present
          </p>
          <p className="text-xl font-bold text-[#1f644e] mt-1">{monthStats.present}</p>
        </div>
        <div className="p-3 bg-[#fef2f2] rounded-2xl border border-[#c94c4c]/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
            Days Absent
          </p>
          <p className="text-xl font-bold text-[#c94c4c] mt-1">{monthStats.absent}</p>
        </div>
        <div className="p-3 bg-[#4a86e8]/5 rounded-2xl border border-[#4a86e8]/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">Holidays</p>
          <p className="text-xl font-bold text-[#4a86e8] mt-1">{monthStats.holiday}</p>
        </div>
        <div className="p-3 bg-neutral-50 rounded-2xl border border-[#e5e3d8]/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
            Total Logged
          </p>
          <p className="text-xl font-bold text-[#1e3a34] mt-1">{monthStats.total}</p>
        </div>
      </div>

      {/* Monthly Holidays Timeline */}
      {monthlyHolidaysList.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-3">
            Holidays in {MONTHS[month]}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {monthlyHolidaysList.map((h) => {
              const d = new Date(h.date + 'T00:00:00');
              const dateStr = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
              return (
                <div
                  key={h.id || h._id}
                  className="flex items-center gap-3 p-3 bg-[#4a86e8]/5 border border-[#4a86e8]/10 rounded-xl"
                >
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-[#4a86e8]/10 text-[#4a86e8] font-bold text-xs">
                    {dateStr}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1e3a34]">{h.name}</p>
                    <p className="text-xs text-[#7c8e88] capitalize">{h.type} Holiday</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Detail Modal */}
      {showDayModal && selectedDate && (
        <DayDetailModal
          dateKey={selectedDate.dateKey}
          day={selectedDate.day}
          subjects={subjects}
          activeSemester={activeSemester}
          onSave={saveDayRecord}
          onClose={() => {
            setShowDayModal(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}
