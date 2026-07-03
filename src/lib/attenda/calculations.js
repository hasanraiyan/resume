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

/**
 * Get all working dates between startDate and endDate,
 * excluding weekly holidays and manual/college holidays.
 */
export function getWorkingDates(semester, holidays) {
  const dates = [];
  const holidaySet = new Set(holidays.map((h) => h.date));
  const weeklyHolidays = new Set(semester.weeklyHolidays || []);

  const start = new Date(semester.startDate + 'T00:00:00');
  const end = new Date(semester.endDate + 'T00:00:00');

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const dateKey = formatDateKey(d);

    if (weeklyHolidays.has(dayOfWeek)) continue;
    if (holidaySet.has(dateKey)) continue;

    dates.push(dateKey);
  }

  return dates;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute college-level attendance.
 *
 * Working Days = all non-holiday weekdays in semester (including future)
 * Days Attended = days where collegeStatus === 'present'
 * Days Absent = days where collegeStatus === 'absent'
 * Cancelled days (holiday/closed) are excluded.
 */
export function computeCollegeAttendance(semester, semesterDays, holidays) {
  const workingDates = getWorkingDates(semester, holidays);
  const totalWorkingDays = workingDates.length;

  let presentDays = 0;
  let absentDays = 0;
  let recordedDays = 0;

  for (const date of workingDates) {
    const day = semesterDays[date];
    if (!day) continue; // not yet recorded — exclude from percentage

    recordedDays++;

    if (day.collegeStatus === 'present' || day.collegeStatus === 'absent') {
      // Use the explicit college status
      if (day.collegeStatus === 'present') presentDays++;
      else absentDays++;
    } else {
      // holiday/closed — treated as non-working, don't count
    }
  }

  const total = presentDays + absentDays;
  const percentage = total > 0 ? (presentDays / total) * 100 : null;

  return {
    presentDays,
    absentDays,
    totalWorkingDays: total, // only days that are recorded
    allWorkingDays: workingDates.length,
    percentage: percentage !== null ? Math.round(percentage * 100) / 100 : null,
    remainingDays: workingDates.filter((d) => !semesterDays[d]).length,
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

  const start = new Date(semester.startDate + 'T00:00:00');
  const end = new Date(semester.endDate + 'T00:00:00');

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = formatDateKey(d);
    const day = semesterDays[dateKey];
    if (!day?.lectures) continue;

    for (const lec of day.lectures) {
      if (lec.subjectId !== subject.id) continue;

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
