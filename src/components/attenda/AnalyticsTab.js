'use client';

import { useAttenda } from '@/context/AttendaContext';
import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  CalendarDays,
  BookOpen,
  Target,
  Download,
  FileText,
} from 'lucide-react';

export default function AnalyticsTab() {
  const {
    collegeStats,
    collegePredictions,
    subjectStats,
    subjectPredictions,
    activeSemester,
    subjects,
  } = useAttenda();

  const [highlightSubject, setHighlightSubject] = useState(null);

  const stats = collegeStats;
  const preds = collegePredictions;
  const isAtRisk = preds?.isAtRisk;

  // Sort subjects by percentage
  const sortedSubjects = useMemo(() => {
    return [...subjectStats]
      .map((s) => ({
        ...s,
        pred: subjectPredictions[s.subject.id] || null,
      }))
      .sort((a, b) => (a.stats.percentage ?? 0) - (b.stats.percentage ?? 0));
  }, [subjectStats, subjectPredictions]);

  const attendanceRate = stats?.percentage ?? null;

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 mb-6 pb-4 pt-6">
      {/* College Attendance Card */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-3">
          College Attendance
        </p>
        <div className="rounded-xl border border-[#e5e3d8] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-4xl font-extrabold text-[#1e3a34]">
                {attendanceRate !== null ? `${attendanceRate}%` : '—'}
              </p>
              <p className="text-sm text-[#7c8e88] mt-1">
                {stats?.presentDays ?? 0} present · {stats?.absentDays ?? 0} absent
              </p>
            </div>
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isAtRisk
                  ? 'bg-[#c94c4c]/10'
                  : attendanceRate !== null
                    ? 'bg-[#1f644e]/10'
                    : 'bg-[#f0f5f2]'
              }`}
            >
              {isAtRisk ? (
                <AlertTriangle className="w-8 h-8 text-[#c94c4c]" />
              ) : attendanceRate !== null ? (
                <CheckCircle className="w-8 h-8 text-[#1f644e]" />
              ) : (
                <Target className="w-8 h-8 text-[#7c8e88]" />
              )}
            </div>
          </div>

          {/* Progress bar */}
          {attendanceRate !== null && (
            <div className="mb-4">
              <div className="h-2.5 bg-[#e5e3d8] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isAtRisk ? 'bg-[#c94c4c]' : 'bg-[#1f644e]'
                  }`}
                  style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Key stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-[#fcfbf5] rounded-lg">
              <p className="text-lg font-bold text-[#1e3a34]">{stats?.totalWorkingDays ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                Days Logged
              </p>
            </div>
            <div className="text-center p-2 bg-[#fcfbf5] rounded-lg">
              <p className="text-lg font-bold text-[#1e3a34]">{stats?.remainingDays ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                Remaining
              </p>
            </div>
            <div className="text-center p-2 bg-[#fcfbf5] rounded-lg">
              <p className="text-lg font-bold text-[#1e3a34]">{preds?.safeBunks ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                Safe Bunks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Predictions */}
      {preds && attendanceRate !== null && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-3">
            Predictions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#e5e3d8] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-1">
                If you skip tomorrow
              </p>
              <p
                className={`text-xl font-bold ${preds.ifSkipTomorrow < (activeSemester?.requiredAttendance ?? 75) ? 'text-[#c94c4c]' : 'text-[#1e3a34]'}`}
              >
                {preds.ifSkipTomorrow}%
              </p>
            </div>
            <div className="rounded-xl border border-[#e5e3d8] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-1">
                If you attend next 5
              </p>
              <p className="text-xl font-bold text-[#1f644e]">{preds.ifAttendWeek}%</p>
            </div>
            <div className="rounded-xl border border-[#e5e3d8] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-1">
                Safe to miss
              </p>
              <p className="text-xl font-bold text-[#1e3a34]">
                {preds.safeBunks} day{preds.safeBunks !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subject Attendance */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-3">Subjects</p>
        <div className="space-y-2">
          {sortedSubjects.map(({ subject, stats: s, pred }) => {
            const target = subject.requiredAttendance ?? 75;
            const belowTarget = s.percentage !== null && s.percentage < target;
            const isHighlighted = highlightSubject === subject.id;

            return (
              <div
                key={subject.id}
                className={`rounded-xl border p-4 transition-all ${
                  isHighlighted
                    ? 'border-[#1f644e] bg-white'
                    : belowTarget
                      ? 'border-[#c94c4c]/30 bg-white'
                      : 'border-[#e5e3d8] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div>
                      <p className="text-sm font-bold text-[#1e3a34]">{subject.name}</p>
                      {subject.facultyName && (
                        <p className="text-xs text-[#7c8e88]">{subject.facultyName}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        s.percentage !== null
                          ? belowTarget
                            ? 'text-[#c94c4c]'
                            : 'text-[#1f644e]'
                          : 'text-[#7c8e88]'
                      }`}
                    >
                      {s.percentage !== null ? `${s.percentage}%` : '—'}
                    </p>
                    {belowTarget && (
                      <p className="text-[10px] font-bold text-[#c94c4c]">⚠ Below {target}%</p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {s.percentage !== null && (
                  <div className="h-1.5 bg-[#e5e3d8] rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        belowTarget ? 'bg-[#c94c4c]' : 'bg-[#1f644e]'
                      }`}
                      style={{ width: `${Math.min(s.percentage, 100)}%` }}
                    />
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-3 text-[11px] text-[#7c8e88]">
                  <span>{s.present} present</span>
                  <span>{s.absent} absent</span>
                  {s.cancelled > 0 && <span>{s.cancelled} cancelled</span>}
                  {s.extra > 0 && <span className="text-[#4a86e8]">+{s.extra} extra</span>}
                </div>

                {/* Predictions row */}
                {pred && s.percentage !== null && (
                  <div className="mt-2 flex items-center gap-3 text-[11px]">
                    <span
                      className={pred.ifSkipNext < target ? 'text-[#c94c4c]' : 'text-[#7c8e88]'}
                    >
                      Skip next: {pred.ifSkipNext}%
                    </span>
                    <span className="text-[#1f644e]">+5 classes: {pred.ifAttendNext}%</span>
                    <span className="text-[#7c8e88]">Safe bunks: {pred.safeBunks}</span>
                  </div>
                )}
              </div>
            );
          })}

          {sortedSubjects.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-[#e5e3d8] mx-auto mb-2" />
              <p className="text-sm text-[#7c8e88]">No subjects configured</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Summary Stats */}
      <div className="rounded-xl border border-[#e5e3d8] bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-[#1e3a34]">{subjects.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
              Subjects
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[#1e3a34]">{stats?.totalWorkingDays ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
              Days Logged
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[#1e3a34]">
              {sortedSubjects.filter((s) => s.pred?.isAtRisk).length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#c94c4c]">At Risk</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[#1f644e]">
              {sortedSubjects.filter((s) => s.pred && !s.pred.isAtRisk).length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#1f644e]">
              On Track
            </p>
          </div>
        </div>
      </div>

      {attendanceRate === null && (
        <div className="mt-6 text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-[#f0f5f2] flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-[#7c8e88]" />
          </div>
          <p className="text-sm font-bold text-[#7c8e88]">
            Start logging your attendance to see analytics
          </p>
          <p className="text-xs text-[#b0bfba] mt-1">
            Go to the Today tab to mark your daily attendance
          </p>
        </div>
      )}
    </div>
  );
}
