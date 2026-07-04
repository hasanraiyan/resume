const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Convert any structured data object into a human-readable text block.
 * Works with objects, arrays, primitives — handles them all recursively.
 */
export function formatData(data, indent = 0) {
  const pad = (n) => '  '.repeat(n);

  if (data === null || data === undefined) return pad(indent) + 'N/A';

  if (Array.isArray(data)) {
    if (data.length === 0) return pad(indent) + '(none)';
    return data.map((item) => formatData(item, indent + 1)).join('\n');
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data).filter(([_, v]) => v !== null && v !== undefined);
    if (entries.length === 0) return pad(indent) + '(empty)';
    return entries
      .map(([key, value]) => {
        const label = prettyKey(key);
        if (typeof value === 'object' && value !== null) {
          const formatted = formatData(value, indent + 1);
          return pad(indent) + `${label}:\n${formatted}`;
        }
        return pad(indent) + `${label}: ${formatValue(key, value)}`;
      })
      .join('\n');
  }

  return pad(indent) + String(data);
}

/**
 * Format a single value with type-appropriate rendering.
 */
function formatValue(key, value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  return String(value);
}

/**
 * Convert camelCase/snake_case keys to readable labels.
 */
function prettyKey(key) {
  // Handle known keys with custom labels
  const overrides = {
    id: 'ID',
    _id: 'ID',
    semesterId: 'Semester',
    subjectId: 'Subject',
    deletedAt: 'Deleted',
    createdAt: 'Created',
    updatedAt: 'Updated',
    syncVersion: 'Version',
    isActive: 'Active',
    isExtra: 'Extra',
    weeklyHolidays: 'Weekly Off',
    institutionName: 'Institution',
    facultyName: 'Faculty',
    requiredAttendance: 'Req. Attendance',
    collegeStatus: 'Status',
    startTime: 'Start',
    endTime: 'End',
    safeBunks: 'Safe Bunks',
    dayOfWeek: 'Day',
  };
  if (overrides[key] !== undefined) return overrides[key];

  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Specific formatters for known attenda entity types.
 */

export function formatSemester(semester, stats, predictions) {
  const lines = [
    `Name: ${semester.name}`,
    `Institution: ${semester.institutionName || 'N/A'}`,
    `Period: ${semester.startDate || '?'} – ${semester.endDate || '?'}`,
    `Required Attendance: ${semester.requiredAttendance ?? 75}%`,
    `Weekly Off: ${(semester.weeklyHolidays || [0]).map((d) => DAY_NAMES[d]).join(', ')}`,
  ];
  if (stats) {
    lines.push(`Attendance: ${stats.percentage ?? 'N/A'}%`);
    if (predictions) lines.push(`Safe Bunks: ${predictions.safeBunks ?? 'N/A'}`);
  }
  if (semester.notes) lines.push(`Notes: ${semester.notes}`);
  return lines.join('\n');
}

export function formatSubjects(subjects) {
  return subjects
    .map((s) => {
      const parts = [`[${s.id || s._id}] ${s.name}`];
      if (s.facultyName) parts.push(`(${s.facultyName})`);
      if (s.isActive === false) parts.push('[inactive]');
      return parts.join(' ');
    })
    .join('\n');
}

export function formatDays(days) {
  return days
    .map((d) => {
      const present = (d.lectures || []).filter((l) => l.status === 'present').length;
      const total = (d.lectures || []).length;
      return `${d.date} — ${d.collegeStatus || 'present'} (${present}/${total} lectures)`;
    })
    .join('\n');
}

export function formatTimetable(timetable) {
  const days = (timetable.days || [])
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((d) => {
      const slots = (d.slots || [])
        .map((s) => {
          const time = `${s.startTime || '?'}–${s.endTime || '?'}`;
          const subject = s.subjectName || s.subjectId || 'Unknown Subject';
          const faculty = s.facultyName ? ` (${s.facultyName})` : '';
          return `${time} ${subject}${faculty}`;
        })
        .join(', ');
      return `${DAY_NAMES[d.dayOfWeek]}: ${slots || '(no slots)'}`;
    });
  return days.join('\n');
}

export function formatHolidays(holidays) {
  return holidays
    .map((h) => `${h.date} — ${h.name}${h.type ? ` (${h.type})` : ''} [id: ${h.id}]`)
    .join('\n');
}

export function formatSubjectStats(subjects) {
  return subjects
    .map((s) => {
      const pct = s.stats?.percentage ?? 'N/A';
      const sb = s.predictions?.safeBunks ?? 'N/A';
      return `${s.subject.name}: ${pct}% (safe bunks: ${sb})`;
    })
    .join('\n');
}

const STATUS_ICONS = {
  not_started: '○',
  in_progress: '◐',
  completed: '●',
};

export function formatSyllabus(syllabusData) {
  const { subjectName, syllabus, stats } = syllabusData;
  const lines = [`📘 ${subjectName}`];
  lines.push(`   ${stats.percentage}% complete (${stats.completed}/${stats.total} topics)\n`);

  if (syllabus.length === 0) {
    lines.push('   No modules added yet.');
    return lines.join('\n');
  }

  syllabus.forEach((mod, i) => {
    const modDone = mod.topics.filter((t) => t.status === 'completed').length;
    const modTotal = mod.topics.length;
    lines.push(`  ${i + 1}. 📂 ${mod.title} [${modDone}/${modTotal}]`);

    mod.topics.forEach((topic, j) => {
      const icon = STATUS_ICONS[topic.status] || '○';
      lines.push(`     ${j + 1}. ${icon} ${topic.title}`);
    });
  });

  return lines.join('\n');
}
