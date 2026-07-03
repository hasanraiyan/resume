'use client';

import { useAttenda } from '@/context/AttendaContext';
import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Ban,
  Calendar,
  Building2,
  BookOpen,
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

const STATUS_COLORS = {
  present: 'bg-[#1f644e]',
  absent: 'bg-[#c94c4c]',
  holiday: 'bg-[#4a86e8]',
  closed: 'bg-[#7c8e88]',
};

const LECTURE_STATUS_DOTS = {
  present: 'bg-[#1f644e]',
  absent: 'bg-[#c94c4c]',
  cancelled: 'bg-[#e5e3d8]',
};

export default function CalendarTab() {
  const { allDays, activeSemester, getSavedDay, saveDayRecord, subjects } = useAttenda();

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

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const days = [];

    // Previous month overflow
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = prevMonthDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      days.push({
        day: date,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: false,
        dateKey: `${y}-${String(m + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`,
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month, d);
      const dayOfWeek = dateObj.getDay();
      days.push({
        day: d,
        month,
        year,
        isCurrentMonth: true,
        isToday:
          d === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
        isFuture: dateObj > today,
        isWeeklyHoliday: weeklyHolidays.has(dayOfWeek),
        dateKey,
        dayOfWeek,
      });
    }

    // Next month overflow (to fill 6 rows max)
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let d = 1; days.length < totalCells; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      days.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: false,
        dateKey: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, firstDay, daysInMonth, prevMonthDays, today, weeklyHolidays]);

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 mb-6 pb-4 pt-6">
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
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, idx) => {
          const dayRecord = allDays[cell.dateKey];
          let hasData = !!dayRecord;
          const isHoliday = cell.isWeeklyHoliday;
          const isPast = !cell.isFuture && !cell.isToday;

          // Check if it's a holiday from semester holidays
          // (we check via dayRecord collegeStatus)

          return (
            <button
              key={idx}
              onClick={() => {
                if (cell.isCurrentMonth && (hasData || isPast)) {
                  openDay(cell.dateKey);
                }
              }}
              disabled={!cell.isCurrentMonth || (!hasData && (cell.isFuture || isHoliday))}
              className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl aspect-square text-sm transition-all
                ${
                  cell.isToday
                    ? 'bg-[#1f644e] text-white font-bold shadow-sm'
                    : hasData && cell.isCurrentMonth
                      ? 'bg-white border border-[#e5e3d8] hover:border-[#1f644e] cursor-pointer'
                      : isHoliday && cell.isCurrentMonth
                        ? 'text-[#7c8e88] bg-[#f8f9fa]'
                        : 'text-[#d0d0d0]'
                } ${cell.isCurrentMonth ? '' : 'opacity-40'}
              `}
            >
              <span className={cell.isToday ? '' : 'font-medium'}>{cell.day}</span>

              {/* Status indicator dot */}
              {hasData && !cell.isToday && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayRecord.collegeStatus && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        STATUS_COLORS[dayRecord.collegeStatus] || 'bg-[#e5e3d8]'
                      }`}
                    />
                  )}
                  {/* Lecture count indicator */}
                  {(dayRecord.lectures?.length || 0) > 0 && (
                    <span className="text-[8px] font-bold text-[#7c8e88]">
                      {dayRecord.lectures.length}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
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
