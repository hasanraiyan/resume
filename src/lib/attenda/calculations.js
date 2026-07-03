// @/lib/attenda/calculations.js
// Attendance calculation utilities.

/**
 * @typedef {Object} Semester
 * @property {string} id
 * @property {string} startDate - YYYY-MM-DD
 * @property {string} endDate - YYYY-MM-DD
 * @property {number} requiredAttendance - e.g. 75
 * @property {number[]} weeklyHolidays - e.g. [0] for Sunday
 */

/**
 * @typedef {Object} Subject
 * @property {string} id
 * @property {string} semesterId
 * @property {string} name
 * @property {number} requiredAttendance - e.g. 75
 */

/**
 * @typedef {Object} DayRecord
 * @property {string} date - YYYY-MM-DD
 * @property {string} semesterId
 * @property {'present'|'absent'|'holiday'|'closed'} collegeStatus
 * @property {Array} lectures
 */

/**
 * @typedef {Object} Holiday
 * @property {string} id
 * @property {string} semesterId
 * @property {string} date - YYYY-MM-DD
 * @property {string} type - 'manual' | 'college'
 */

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute college-level attendance.
 *
 * Working Days = all recorded days with present/absent status.
 * Uses actual recorded days rather than semester date range,
 * so it works even when semester start/end dates aren't set.
 */
export function computeCollegeAttendance(semester, semesterDays, holidays) {
  const allDates = Object.keys(semesterDays).sort();
  const holidaySet = new Set((holidays || []).map((h) => h.date));

  let presentDays = 0;
  let absentDays = 0;
  let recordedDays = 0;

  for (const date of allDates) {
    const day = semesterDays[date];
    if (!day) continue;

    // Skip holidays
    if (holidaySet.has(date)) continue;

    // Skip weekly holidays
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    if ((semester.weeklyHolidays || []).includes(dayOfWeek)) continue;

    recordedDays++;

    if (day.collegeStatus === 'present') {
      presentDays++;
    } else if (day.collegeStatus === 'absent') {
      absentDays++;
    }
    // holiday/closed — don't count toward attendance
  }

  const total = presentDays + absentDays;
  const percentage = total > 0 ? (presentDays / total) * 100 : null;

  return {
    presentDays,
    absentDays,
    totalWorkingDays: total,
    allWorkingDays: total,
    percentage: percentage !== null ? Math.round(percentage * 100) / 100 : null,
    remainingDays: null, // null = unknown (semester dates not set)
  };
}

/**
 * Compute subject-level attendance.
 *
 * Total Classes = present + absent lectures (cancelled excluded)
 * Extra lectures count toward attendance if attended.
 */
export function computeSubjectAttendance(subject, semesterDays, semester) {
  let present = 0;
  let absent = 0;
  let cancelled = 0;
  let extra = 0;
  let totalClasses = 0;

  const subjectIdStr = String(subject.id);
  const allDates = Object.keys(semesterDays).sort();

  if (allDates.length === 0) {
    return {
      present: 0,
      absent: 0,
      cancelled: 0,
      extra: 0,
      totalClasses: 0,
      percentage: null,
    };
  }

  // Use recorded day dates directly instead of iterating a date range,
  // so the calculation still works when semester start/end dates are not set.
  for (const dateKey of allDates) {
    const day = semesterDays[dateKey];
    if (!day?.lectures) continue;

    for (const lec of day.lectures) {
      // Normalize both to strings for reliable comparison
      if (String(lec.subjectId) !== subjectIdStr) continue;

      if (lec.status === 'present') {
        present++;
        if (lec.isExtra) extra++;
      } else if (lec.status === 'absent') {
        absent++;
      } else if (lec.status === 'cancelled' || lec.status === 'didnt-happen') {
        cancelled++;
      }
    }
  }

  totalClasses = present + absent;
  const percentage = totalClasses > 0 ? (present / totalClasses) * 100 : null;

  return {
    present,
    absent,
    cancelled,
    extra,
    totalClasses,
    percentage: percentage !== null ? Math.round(percentage * 100) / 100 : null,
  };
}

/**
 * Get subject attendance for all subjects in a semester.
 */
export function computeAllSubjectAttendance(semester, subjects, semesterDays) {
  return subjects
    .filter((s) => s.isActive)
    .map((subject) => ({
      subject,
      stats: computeSubjectAttendance(subject, semesterDays, semester),
    }));
}

/**
 * Get the target percentage for a subject (or college default).
 */
export function getRequiredAttendance(subjectOrSemester) {
  return subjectOrSemester.requiredAttendance ?? 75;
}

/**
 * Count today's scheduled lectures from timetable.
 */
export function getTodaysLectures(timetable, subjects) {
  const today = new Date().getDay();
  const slots = timetable?.slots?.[today] || [];
  return slots
    .map((slot) => {
      const subject = subjects.find((s) => s.id === slot.subjectId);
      return subject ? { ...slot, subjectName: subject.name, subjectColor: subject.color } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
}
