// @/lib/attenda/storage.js
// LocalStorage persistence for Attenda — offline-first, no server.

const STORAGE_KEY = 'attenda_data';

const DEFAULT_STATE = {
  semesters: [],
  subjects: [],
  days: {}, // { 'YYYY-MM-DD': DayRecord }
  timetables: {}, // { semesterId: Timetable }
  holidays: [], // Holiday[]
};

let _cache = null;

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveRaw(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // localStorage may be full — handle gracefully
    console.error('Failed to save attenda data:', e);
  }
}

export function loadAll() {
  if (_cache) return _cache;
  const raw = loadRaw();
  const data = raw || JSON.parse(JSON.stringify(DEFAULT_STATE));
  // ensure nested structures exist
  if (!data.subjects) data.subjects = [];
  if (!data.days) data.days = {};
  if (!data.timetables) data.timetables = {};
  if (!data.holidays) data.holidays = [];
  _cache = data;
  return data;
}

export function persist() {
  const data = loadAll();
  saveRaw(data);
}

// --- Semesters ---

export function getSemesters() {
  return loadAll().semesters;
}

export function getSemester(id) {
  return loadAll().semesters.find((s) => s.id === id) || null;
}

export function createSemester(data) {
  const store = loadAll();
  const semester = {
    id: generateId(),
    name: data.name || 'Untitled Semester',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    requiredAttendance: data.requiredAttendance ?? 75,
    weeklyHolidays: data.weeklyHolidays || [0], // default Sunday
    institutionName: data.institutionName || '',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.semesters.push(semester);
  store.timetables[semester.id] = { semesterId: semester.id, slots: {} };
  persist();
  return semester;
}

export function updateSemester(id, updates) {
  const store = loadAll();
  const idx = store.semesters.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.semesters[idx] = {
    ...store.semesters[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  persist();
  return store.semesters[idx];
}

export function deleteSemester(id) {
  const store = loadAll();
  store.semesters = store.semesters.filter((s) => s.id !== id);
  store.subjects = store.subjects.filter((s) => s.semesterId !== id);
  delete store.timetables[id];
  // Remove days for this semester
  Object.keys(store.days).forEach((date) => {
    if (store.days[date].semesterId === id) delete store.days[date];
  });
  store.holidays = store.holidays.filter((h) => h.semesterId !== id);
  persist();
}

// --- Subjects ---

export function getSubjects(semesterId) {
  return loadAll().subjects.filter((s) => s.semesterId === semesterId);
}

export function createSubject(data) {
  const store = loadAll();
  const subject = {
    id: generateId(),
    semesterId: data.semesterId,
    name: data.name || 'Untitled',
    facultyName: data.facultyName || '',
    color: data.color || '#4a86e8',
    credits: data.credits ?? null,
    requiredAttendance: data.requiredAttendance ?? 75,
    isActive: data.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.subjects.push(subject);
  persist();
  return subject;
}

export function updateSubject(id, updates) {
  const store = loadAll();
  const idx = store.subjects.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.subjects[idx] = { ...store.subjects[idx], ...updates, updatedAt: new Date().toISOString() };
  persist();
  return store.subjects[idx];
}

export function deleteSubject(id) {
  const store = loadAll();
  store.subjects = store.subjects.filter((s) => s.id !== id);
  // Remove from timetable slots
  Object.keys(store.timetables).forEach((semId) => {
    const tt = store.timetables[semId];
    Object.keys(tt.slots).forEach((day) => {
      tt.slots[day] = tt.slots[day].filter((slot) => slot.subjectId !== id);
    });
  });
  // Remove from day records
  Object.keys(store.days).forEach((date) => {
    const day = store.days[date];
    if (day.lectures) {
      day.lectures = day.lectures.filter((lec) => lec.subjectId !== id);
    }
  });
  persist();
}

// --- Timetable ---

export function getTimetable(semesterId) {
  const store = loadAll();
  return store.timetables[semesterId] || { semesterId, slots: {} };
}

export function setTimetableSlot(semesterId, dayOfWeek, slot) {
  const store = loadAll();
  if (!store.timetables[semesterId]) {
    store.timetables[semesterId] = { semesterId, slots: {} };
  }
  if (!store.timetables[semesterId].slots[dayOfWeek]) {
    store.timetables[semesterId].slots[dayOfWeek] = [];
  }
  const newSlot = { id: slot.id || generateId(), ...slot };
  const existing = store.timetables[semesterId].slots[dayOfWeek].findIndex(
    (s) => s.id === newSlot.id
  );
  if (existing >= 0) {
    store.timetables[semesterId].slots[dayOfWeek][existing] = newSlot;
  } else {
    store.timetables[semesterId].slots[dayOfWeek].push(newSlot);
  }
  persist();
}

export function removeTimetableSlot(semesterId, dayOfWeek, slotId) {
  const store = loadAll();
  if (!store.timetables[semesterId]?.slots[dayOfWeek]) return;
  store.timetables[semesterId].slots[dayOfWeek] = store.timetables[semesterId].slots[
    dayOfWeek
  ].filter((s) => s.id !== slotId);
  persist();
}

export function setTimetableSlots(semesterId, dayOfWeek, slots) {
  const store = loadAll();
  if (!store.timetables[semesterId]) {
    store.timetables[semesterId] = { semesterId, slots: {} };
  }
  store.timetables[semesterId].slots[dayOfWeek] = slots;
  persist();
}

// --- Days (Attendance Records) ---

export function getDay(date) {
  return loadAll().days[date] || null;
}

export function getDaysInRange(startDate, endDate) {
  const store = loadAll();
  const result = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = formatDateKey(d);
    if (store.days[key]) result[key] = store.days[key];
  }
  return result;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function saveDay(date, dayData) {
  const store = loadAll();
  store.days[date] = {
    ...dayData,
    date,
    updatedAt: new Date().toISOString(),
    createdAt: store.days[date]?.createdAt || new Date().toISOString(),
  };
  persist();
}

export function deleteDay(date) {
  const store = loadAll();
  delete store.days[date];
  persist();
}

export function getAllDayDates(semesterId) {
  const store = loadAll();
  return Object.keys(store.days)
    .filter((date) => store.days[date].semesterId === semesterId)
    .sort();
}

// --- Holidays ---

export function getHolidays(semesterId) {
  return loadAll().holidays.filter((h) => h.semesterId === semesterId);
}

export function addHoliday(data) {
  const store = loadAll();
  const holiday = {
    id: generateId(),
    semesterId: data.semesterId,
    date: data.date,
    name: data.name || 'Holiday',
    type: data.type || 'manual', // 'manual' | 'college'
    createdAt: new Date().toISOString(),
  };
  store.holidays.push(holiday);
  persist();
  return holiday;
}

export function removeHoliday(id) {
  const store = loadAll();
  store.holidays = store.holidays.filter((h) => h.id !== id);
  persist();
}

// --- Backup / Export / Import ---

export function exportBackup() {
  const data = loadRaw();
  if (!data) return null;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attenda-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(jsonData) {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    if (!data.semesters || !Array.isArray(data.semesters)) {
      throw new Error('Invalid backup format');
    }
    saveRaw(data);
    _cache = null; // invalidate cache
    return true;
  } catch (e) {
    throw new Error('Invalid backup file: ' + e.message);
  }
}
