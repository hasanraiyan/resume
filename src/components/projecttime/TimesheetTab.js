'use client';

import { useState } from 'react';
import { useProjectTime } from './ProjectTimeContext';
import {
  Calendar,
  Send,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TimesheetTab() {
  const { projects, tasks, entries, updateEntry } = useProjectTime();

  // Selected week offset (0 = current week, -1 = last week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate Start of Week (Monday) and End of Week (Sunday)
  const getWeekDates = (offset) => {
    const d = new Date();
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;

    const monday = new Date(d.setDate(diffToMon));
    const dates = [];

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      dates.push(nextDay.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates(weekOffset);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Filter entries for this week
  const weekEntries = entries.filter((e) => e.date >= weekDates[0] && e.date <= weekDates[6]);

  // Group entries by Project + Task key
  const rowMap = {};
  weekEntries.forEach((entry) => {
    const key = `${entry.projectId}_${entry.taskId || 'none'}`;
    if (!rowMap[key]) {
      rowMap[key] = {
        projectId: entry.projectId,
        taskId: entry.taskId,
        dailySeconds: {
          [weekDates[0]]: 0,
          [weekDates[1]]: 0,
          [weekDates[2]]: 0,
          [weekDates[3]]: 0,
          [weekDates[4]]: 0,
          [weekDates[5]]: 0,
          [weekDates[6]]: 0,
        },
        entries: [],
      };
    }
    if (rowMap[key].dailySeconds[entry.date] !== undefined) {
      rowMap[key].dailySeconds[entry.date] += entry.duration || 0;
    }
    rowMap[key].entries.push(entry);
  });

  const rowKeys = Object.keys(rowMap);

  // Timesheet overall status
  const currentStatus =
    weekEntries.length > 0 ? weekEntries[0].timesheetStatus || 'Draft' : 'Draft';

  // Total weekly tracked seconds
  const totalWeeklySecs = weekEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

  const handleBatchStatusUpdate = async (newStatus) => {
    if (weekEntries.length === 0) return;
    try {
      await Promise.all(
        weekEntries.map((entry) => updateEntry(entry._id, { timesheetStatus: newStatus }))
      );
      toast.success(`Timesheet marked as ${newStatus}`);
    } catch (e) {
      toast.error('Failed to update timesheet status');
    }
  };

  const formatSecsToH = (secs) => {
    if (!secs || secs <= 0) return '—';
    const h = (secs / 3600).toFixed(1);
    return `${h}h`;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1e3a34]">Timesheet Review</h2>
          <p className="text-xs text-[#7c8e88] mt-0.5">
            Weekly matrix view and timesheet submission
          </p>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-white border border-[#e5e3d8] rounded-xl p-1">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-1.5 text-[#7c8e88] hover:text-[#1e3a34] rounded-lg cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-[#1e3a34] px-2 font-mono">
              {weekDates[0]} to {weekDates[6]}
            </span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="p-1.5 text-[#7c8e88] hover:text-[#1e3a34] rounded-lg cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Status Badge */}
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wide border ${
              currentStatus === 'Approved'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : currentStatus === 'Submitted'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : currentStatus === 'Rejected'
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            {currentStatus}
          </span>
        </div>
      </div>

      {/* Timesheet Action Bar (Submit / Approve / Reject) */}
      <div className="bg-white border border-[#e5e3d8] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="text-xs font-bold text-[#7c8e88] block">Total Weekly Hours</span>
          <span className="text-2xl font-bold font-mono text-[#1f644e]">
            {(totalWeeklySecs / 3600).toFixed(1)} hrs
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {currentStatus === 'Draft' && (
            <button
              onClick={() => handleBatchStatusUpdate('Submitted')}
              disabled={weekEntries.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white rounded-xl text-xs font-bold hover:bg-[#17503e] disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Submit Timesheet
            </button>
          )}

          {currentStatus === 'Submitted' && (
            <>
              <button
                onClick={() => handleBatchStatusUpdate('Approved')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleBatchStatusUpdate('Rejected')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#c94c4c] text-white rounded-xl text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="bg-white rounded-2xl border border-[#e5e3d8] p-5 shadow-sm space-y-4 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-[#e5e3d8] text-xs font-bold text-[#7c8e88]">
              <th className="py-3 px-3 w-1/3">Project & Task</th>
              {weekDates.map((dateStr, idx) => (
                <th key={dateStr} className="py-3 px-2 text-center font-mono">
                  <div>{dayNames[idx]}</div>
                  <div className="text-[10px] text-[#a0b2ac]">{dateStr.slice(5)}</div>
                </th>
              ))}
              <th className="py-3 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f5f2] text-xs font-medium text-[#1e3a34]">
            {rowKeys.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-8 text-center text-[#7c8e88]">
                  No time recorded for this week.
                </td>
              </tr>
            ) : (
              rowKeys.map((key) => {
                const row = rowMap[key];
                const proj = projects.find((p) => p._id === row.projectId);
                const task = tasks.find((t) => t._id === row.taskId);

                const rowTotalSecs = Object.values(row.dailySeconds).reduce((a, b) => a + b, 0);

                return (
                  <tr key={key} className="hover:bg-[#fcfbf5]">
                    <td className="py-3 px-3">
                      <div className="font-bold text-sm text-[#1e3a34]">{proj?.name || '—'}</div>
                      <div className="text-xs text-[#7c8e88]">
                        {task ? `[${task.type}] ${task.name}` : 'General Project Work'}
                      </div>
                    </td>

                    {weekDates.map((d) => (
                      <td key={d} className="py-3 px-2 text-center font-mono">
                        {formatSecsToH(row.dailySeconds[d])}
                      </td>
                    ))}

                    <td className="py-3 px-3 text-right font-bold font-mono text-[#1f644e]">
                      {(rowTotalSecs / 3600).toFixed(1)}h
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
