import dbConnect from '@/lib/dbConnect';
import AttendaSemester from '@/models/AttendaSemester';
import AttendaSubject from '@/models/AttendaSubject';
import AttendaDay from '@/models/AttendaDay';
import AttendaTimetable from '@/models/AttendaTimetable';
import AttendaHoliday from '@/models/AttendaHoliday';
import {
  computeCollegeAttendance,
  computeSubjectAttendance,
  getTodaysLectures,
} from '@/lib/attenda/calculations';
import { generateCollegePredictions, generateSubjectPredictions } from '@/lib/attenda/predictions';

function serializeDoc(doc) {
  if (!doc) return null;
  const obj = { ...doc };
  obj.id = obj._id?.toString();
  delete obj.__v;
  return obj;
}

function toObjectId(id) {
  return id;
}

// --- Semesters ---

export async function listSemesters() {
  await dbConnect();
  const docs = await AttendaSemester.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();
  return docs.map(serializeDoc);
}

export async function getSemester(id) {
  await dbConnect();
  const doc = await AttendaSemester.findOne({ _id: id, deletedAt: null }).lean();
  if (!doc) throw new Error('Semester not found');
  return serializeDoc(doc);
}

export async function createSemester(data) {
  await dbConnect();
  const doc = await AttendaSemester.create({
    name: data.name || 'Untitled Semester',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    requiredAttendance: data.requiredAttendance ?? 75,
    weeklyHolidays: data.weeklyHolidays || [0],
    institutionName: data.institutionName || '',
    notes: data.notes || '',
  });

  await AttendaTimetable.create({ semesterId: doc._id, days: [] });

  return serializeDoc(doc.toObject());
}

export async function updateSemester(id, updates) {
  await dbConnect();
  const doc = await AttendaSemester.findOneAndUpdate({ _id: id, deletedAt: null }, updates, {
    new: true,
  }).lean();
  if (!doc) throw new Error('Semester not found');
  return serializeDoc(doc);
}

export async function deleteSemester(id) {
  await dbConnect();
  const doc = await AttendaSemester.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!doc) throw new Error('Semester not found');

  await Promise.all([
    AttendaSubject.updateMany({ semesterId: id, deletedAt: null }, { deletedAt: new Date() }),
    AttendaDay.updateMany({ semesterId: id, deletedAt: null }, { deletedAt: new Date() }),
    AttendaTimetable.updateMany({ semesterId: id, deletedAt: null }, { deletedAt: new Date() }),
    AttendaHoliday.updateMany({ semesterId: id, deletedAt: null }, { deletedAt: new Date() }),
  ]);

  return { success: true, id };
}

// --- Subjects ---

export async function listSubjects(semesterId) {
  await dbConnect();
  const docs = await AttendaSubject.find({ semesterId, deletedAt: null }).sort({ name: 1 }).lean();
  return docs.map(serializeDoc);
}

export async function createSubject(data) {
  await dbConnect();
  const doc = await AttendaSubject.create({
    semesterId: data.semesterId,
    name: data.name || 'Untitled',
    facultyName: data.facultyName || '',
    color: data.color || '#4a86e8',
    credits: data.credits ?? null,
    requiredAttendance: data.requiredAttendance ?? 75,
    isActive: data.isActive ?? true,
  });
  return serializeDoc(doc.toObject());
}

export async function updateSubject(id, updates) {
  await dbConnect();
  const doc = await AttendaSubject.findOneAndUpdate({ _id: id, deletedAt: null }, updates, {
    new: true,
  }).lean();
  if (!doc) throw new Error('Subject not found');
  return serializeDoc(doc);
}

export async function deleteSubject(id) {
  await dbConnect();
  const doc = await AttendaSubject.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!doc) throw new Error('Subject not found');
  return { success: true, id };
}

// --- Days ---

export async function getDay(date, semesterId) {
  await dbConnect();
  const doc = await AttendaDay.findOne({ date, semesterId, deletedAt: null }).lean();
  if (!doc) return null;
  return serializeDoc(doc);
}

export async function listDays(semesterId) {
  await dbConnect();
  const docs = await AttendaDay.find({ semesterId, deletedAt: null }).sort({ date: -1 }).lean();
  return docs.map(serializeDoc);
}

export async function saveDay(data) {
  await dbConnect();
  const doc = await AttendaDay.findOneAndUpdate(
    { date: data.date, semesterId: data.semesterId, deletedAt: null },
    {
      collegeStatus: data.collegeStatus || 'present',
      lectures: (data.lectures || []).map((lec) => ({
        subjectId: lec.subjectId,
        status: lec.status || 'present',
        isExtra: lec.isExtra || false,
        startTime: lec.startTime || '',
        endTime: lec.endTime || '',
      })),
      notes: data.notes || '',
    },
    { upsert: true, new: true }
  ).lean();
  return serializeDoc(doc);
}

// --- Timetable ---

export async function getTimetable(semesterId) {
  await dbConnect();
  const doc = await AttendaTimetable.findOne({ semesterId, deletedAt: null }).lean();

  const subjects = await AttendaSubject.find({ semesterId, deletedAt: null }).lean();
  const subjectMap = {};
  subjects.forEach((s) => {
    subjectMap[s._id.toString()] = s;
  });

  const enrichSlots = (slots) =>
    (slots || []).map((slot) => {
      const subject = subjectMap[slot.subjectId?.toString()];
      return {
        id: slot._id?.toString(),
        subjectId: slot.subjectId?.toString(),
        subjectName: subject?.name || 'Unknown Subject',
        facultyName: subject?.facultyName || '',
        subjectColor: subject?.color || '',
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
    });

  if (!doc) return { semesterId, days: [] };

  return {
    ...serializeDoc(doc),
    days: (doc.days || []).map((d) => ({
      dayOfWeek: d.dayOfWeek,
      slots: enrichSlots(d.slots),
    })),
  };
}

export async function updateTimetableSlots(semesterId, dayOfWeek, slots) {
  await dbConnect();
  const timetable = await AttendaTimetable.findOneAndUpdate(
    { semesterId, deletedAt: null },
    {},
    { upsert: true, new: true }
  );

  const dayIndex = timetable.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
  const newSlots = (slots || []).map((slot) => ({
    subjectId: slot.subjectId,
    startTime: slot.startTime || '',
    endTime: slot.endTime || '',
  }));

  if (dayIndex >= 0) {
    timetable.days[dayIndex].slots = newSlots;
  } else {
    timetable.days.push({ dayOfWeek, slots: newSlots });
  }

  await timetable.save();
  return serializeDoc(timetable.toObject());
}

// --- Holidays ---

const MAX_HOLIDAY_RANGE_DAYS = 366;

// Inclusive list of YYYY-MM-DD strings between startDate and endDate (or just
// [startDate] if endDate is omitted). Multi-day holidays (e.g. "Winter Break")
// are stored as one document per date, so ranges fan out into one op per day.
function enumerateDates(startDate, endDate) {
  const end = endDate || startDate;
  const dates = [];
  const cur = new Date(startDate + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  if (Number.isNaN(cur.getTime()) || Number.isNaN(last.getTime())) {
    throw new Error('Invalid date(s); expected YYYY-MM-DD');
  }
  if (last < cur) {
    throw new Error('endDate must be on or after startDate');
  }
  while (cur <= last) {
    if (dates.length >= MAX_HOLIDAY_RANGE_DAYS) {
      throw new Error(`Date range too large (max ${MAX_HOLIDAY_RANGE_DAYS} days)`);
    }
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function listHolidays(semesterId) {
  await dbConnect();
  const docs = await AttendaHoliday.find({ semesterId, deletedAt: null }).sort({ date: 1 }).lean();
  return docs.map(serializeDoc);
}

export async function createHoliday(data) {
  await dbConnect();
  const doc = await AttendaHoliday.create({
    semesterId: data.semesterId,
    date: data.date,
    name: data.name || 'Holiday',
    type: data.type || 'manual',
  });
  return serializeDoc(doc.toObject());
}

// Creates (or corrects) a holiday across an inclusive date range in one call.
// Upserts per-date so re-running with a fixed range fixes names/types instead
// of creating duplicates for dates already marked off.
export async function createHolidayRange({ semesterId, startDate, endDate, name, type }) {
  await dbConnect();
  const dates = enumerateDates(startDate, endDate);
  const docs = await Promise.all(
    dates.map((date) =>
      AttendaHoliday.findOneAndUpdate(
        { semesterId, date, deletedAt: null },
        { semesterId, date, name: name || 'Holiday', type: type || 'manual', deletedAt: null },
        { upsert: true, new: true }
      ).lean()
    )
  );
  return docs.map(serializeDoc);
}

export async function deleteHoliday(id) {
  await dbConnect();
  const doc = await AttendaHoliday.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!doc) throw new Error('Holiday not found');
  return { success: true, count: 1 };
}

export async function deleteHolidayByDate(semesterId, date) {
  await dbConnect();
  const doc = await AttendaHoliday.findOneAndUpdate(
    { semesterId, date, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  return { success: !!doc, count: doc ? 1 : 0 };
}

export async function deleteHolidaysByDateRange(semesterId, startDate, endDate) {
  await dbConnect();
  const dates = enumerateDates(startDate, endDate);
  const res = await AttendaHoliday.updateMany(
    { semesterId, date: { $in: dates }, deletedAt: null },
    { deletedAt: new Date() }
  );
  return { success: true, count: res.modifiedCount || 0 };
}

// --- Analytics / Computed ---

export async function getCollegeStats(semesterId) {
  await dbConnect();
  const semester = await AttendaSemester.findOne({ _id: semesterId, deletedAt: null }).lean();
  if (!semester) throw new Error('Semester not found');

  const days = await AttendaDay.find({ semesterId, deletedAt: null }).lean();
  const daysMap = {};
  days.forEach((d) => {
    daysMap[d.date] = serializeDoc(d);
  });

  const holidays = await AttendaHoliday.find({ semesterId, deletedAt: null }).lean();
  const stats = computeCollegeAttendance(semester, daysMap, holidays);
  const predictions = generateCollegePredictions(stats, semester);

  return { stats, predictions };
}

export async function getSubjectStats(semesterId) {
  await dbConnect();
  const semester = await AttendaSemester.findOne({ _id: semesterId, deletedAt: null }).lean();
  if (!semester) throw new Error('Semester not found');

  const subjects = await AttendaSubject.find({ semesterId, deletedAt: null }).lean();
  const days = await AttendaDay.find({ semesterId, deletedAt: null }).lean();
  const daysMap = {};
  days.forEach((d) => {
    daysMap[d.date] = serializeDoc(d);
  });

  return subjects
    .filter((s) => s.isActive)
    .map((subject) => {
      const stats = computeSubjectAttendance(subject, daysMap, semester);
      const predictions = generateSubjectPredictions(stats, subject);
      return { subject: serializeDoc(subject), stats, predictions };
    });
}

export async function getSchedule(semesterId, dateString) {
  await dbConnect();

  let targetDateStr = dateString;
  if (!targetDateStr) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    targetDateStr = `${y}-${m}-${d}`;
  }

  const dateObj = new Date(targetDateStr + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();

  const semester = await AttendaSemester.findOne({ _id: semesterId, deletedAt: null }).lean();
  if (!semester) throw new Error('Semester not found');

  // Check declared holiday
  const holiday = await AttendaHoliday.findOne({
    semesterId,
    date: targetDateStr,
    deletedAt: null,
  }).lean();
  if (holiday) {
    return {
      date: targetDateStr,
      isHoliday: true,
      holidayName: holiday.name,
      isWeeklyHoliday: false,
      lectures: [],
    };
  }

  // Check weekly holiday
  const isWeeklyHoliday = semester.weeklyHolidays?.includes(dayOfWeek);
  if (isWeeklyHoliday) {
    return {
      date: targetDateStr,
      isHoliday: false,
      holidayName: null,
      isWeeklyHoliday: true,
      lectures: [],
    };
  }

  // Fetch timetable and subjects
  const subjects = await AttendaSubject.find({
    semesterId,
    deletedAt: null,
    isActive: true,
  }).lean();

  const timetable = await AttendaTimetable.findOne({ semesterId, deletedAt: null }).lean();
  const daysSlots = timetable?.days?.find((d) => d.dayOfWeek === dayOfWeek)?.slots || [];

  const lectures = daysSlots
    .map((slot) => {
      const sub = subjects.find((s) => s._id.toString() === slot.subjectId?.toString());
      return sub
        ? {
            id: slot._id?.toString(),
            subjectId: slot.subjectId?.toString(),
            subjectName: sub.name,
            subjectColor: sub.color,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  return {
    date: targetDateStr,
    isHoliday: false,
    holidayName: null,
    isWeeklyHoliday: false,
    lectures,
  };
}
