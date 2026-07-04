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
  if (!doc) return { semesterId, days: [] };
  return serializeDoc(doc);
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

export async function deleteHoliday(id) {
  await dbConnect();
  const doc = await AttendaHoliday.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!doc) throw new Error('Holiday not found');
  return { success: true, id };
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

export async function getTodaysSchedule(semesterId) {
  await dbConnect();
  const subjects = await AttendaSubject.find({
    semesterId,
    deletedAt: null,
    isActive: true,
  }).lean();
  const timetable = await AttendaTimetable.findOne({ semesterId, deletedAt: null }).lean();
  const tt = timetable
    ? {
        semesterId: timetable.semesterId?.toString(),
        days:
          timetable.days?.map((d) => ({
            dayOfWeek: d.dayOfWeek,
            slots: d.slots.map((s) => ({
              ...s,
              id: s._id?.toString(),
              subjectId: s.subjectId?.toString(),
            })),
          })) || [],
      }
    : { semesterId, days: [] };

  return getTodaysLectures(tt, subjects.map(serializeDoc));
}
