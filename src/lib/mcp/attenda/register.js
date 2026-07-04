import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import * as data from './data';

// --- Helpers ---

const optionalString = z.string().optional();
const optionalNumber = z.number().optional();
const optionalBoolean = z.boolean().optional();

function readAnnotations() {
  return { readOnlyHint: true, idempotentHint: true, openWorldHint: false };
}

function writeAnnotations() {
  return {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  };
}

function deleteAnnotations() {
  return {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  };
}

function toolMeta() {
  return { ui: { visibility: ['model', 'app'] } };
}

function result(structuredContent, text) {
  return {
    structuredContent,
    content: [{ type: 'text', text }],
    _meta: { data: structuredContent },
  };
}

// --- Semester Schemas ---

const semesterCreateSchema = {
  name: z.string().min(1).describe('Semester name (e.g. "Semester VI")'),
  startDate: optionalString.describe('Start date in YYYY-MM-DD format'),
  endDate: optionalString.describe('End date in YYYY-MM-DD format'),
  requiredAttendance: optionalNumber.describe('Required attendance percentage (default 75)'),
  weeklyHolidays: z
    .array(z.number().min(0).max(6))
    .optional()
    .describe('Days of week that are holidays (0=Sunday, 6=Saturday)'),
  institutionName: optionalString.describe('College/institution name'),
};

const semesterUpdateSchema = {
  id: z.string().min(1).describe('Semester ID'),
  name: optionalString,
  startDate: optionalString,
  endDate: optionalString,
  requiredAttendance: optionalNumber,
  weeklyHolidays: z.array(z.number().min(0).max(6)).optional(),
  institutionName: optionalString,
  notes: optionalString,
};

// --- Subject Schemas ---

const subjectCreateSchema = {
  semesterId: z.string().min(1).describe('Semester ID'),
  name: z.string().min(1).describe('Subject name (e.g. "Operating Systems")'),
  facultyName: optionalString.describe('Faculty/teacher name'),
  color: optionalString.describe('Hex color (default #4a86e8)'),
  credits: optionalNumber.describe('Credit value'),
  requiredAttendance: optionalNumber.describe('Required attendance % for this subject'),
  isActive: optionalBoolean.describe('Whether this subject is currently active'),
};

const subjectUpdateSchema = {
  id: z.string().min(1),
  name: optionalString,
  facultyName: optionalString,
  color: optionalString,
  credits: optionalNumber,
  requiredAttendance: optionalNumber,
  isActive: optionalBoolean,
};

// --- Day/Lecture Schemas ---

const lectureSchema = z.object({
  subjectId: z.string().describe('Subject ID'),
  status: z
    .enum(['present', 'absent', 'cancelled', 'didnt-happen', 'holiday', 'college-closed'])
    .default('present'),
  isExtra: z.boolean().default(false),
  startTime: z.string().default(''),
  endTime: z.string().default(''),
});

const saveDaySchema = {
  date: z.string().min(1).describe('Date in YYYY-MM-DD format'),
  semesterId: z.string().min(1),
  collegeStatus: z.enum(['present', 'absent', 'holiday', 'closed']).default('present'),
  lectures: z.array(lectureSchema).default([]),
  notes: optionalString,
};

// --- Timetable Schema ---

const timetableSlotSchema = z.object({
  subjectId: z.string().min(1),
  startTime: z.string().default(''),
  endTime: z.string().default(''),
});

// --- Holiday Schema ---

const holidayCreateSchema = {
  semesterId: z.string().min(1),
  date: z.string().min(1).describe('Date in YYYY-MM-DD format'),
  name: z.string().min(1).describe('Holiday name (e.g. "Durga Puja")'),
  type: z.enum(['manual', 'college']).default('manual'),
};

// --- Tool Registration ---

export function registerAttendaMcp(server) {
  // ==================== SEMESTERS ====================

  registerAppTool(
    server,
    'list_semesters',
    {
      title: 'List Semesters',
      description: 'List all semesters in the Attenda attendance tracker.',
      inputSchema: {},
      outputSchema: { semesters: z.array(z.any()) },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async () => {
      const semesters = await data.listSemesters();
      const names = semesters.map((s) => `"${s.name}" (${s.id})`).join(', ');
      return result({ semesters }, `Found ${semesters.length} semester(s): ${names || 'none'}.`);
    }
  );

  registerAppTool(
    server,
    'get_semester',
    {
      title: 'Get Semester',
      description: 'Get a specific semester by ID with attendance stats and predictions.',
      inputSchema: { id: z.string().min(1) },
      outputSchema: { semester: z.any(), stats: z.any(), predictions: z.any() },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const semester = await data.getSemester(args.id);
      const { stats, predictions } = await data.getCollegeStats(args.id);
      return result({ semester, stats, predictions }, `Loaded semester "${semester.name}".`);
    }
  );

  registerAppTool(
    server,
    'create_semester',
    {
      title: 'Create Semester',
      description: 'Create a new academic semester in the Attenda attendance tracker.',
      inputSchema: semesterCreateSchema,
      outputSchema: { semester: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const semester = await data.createSemester(args);
      return result({ semester }, `Created semester "${semester.name}".`);
    }
  );

  registerAppTool(
    server,
    'update_semester',
    {
      title: 'Update Semester',
      description: 'Update an existing semester by ID.',
      inputSchema: semesterUpdateSchema,
      outputSchema: { semester: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { id, ...updates } = args;
      const semester = await data.updateSemester(id, updates);
      return result({ semester }, `Updated semester "${semester.name}".`);
    }
  );

  registerAppTool(
    server,
    'delete_semester',
    {
      title: 'Delete Semester',
      description: 'Soft-delete a semester and all its related data (subjects, days, holidays).',
      inputSchema: { id: z.string().min(1) },
      outputSchema: { success: z.boolean(), id: z.string() },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const result2 = await data.deleteSemester(args.id);
      return result(result2, `Deleted semester ${args.id}.`);
    }
  );

  // ==================== SUBJECTS ====================

  registerAppTool(
    server,
    'list_subjects',
    {
      title: 'List Subjects',
      description: 'List all subjects for a given semester.',
      inputSchema: { semesterId: z.string().min(1) },
      outputSchema: { subjects: z.array(z.any()) },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const subjects = await data.listSubjects(args.semesterId);
      return result({ subjects }, `Found ${subjects.length} subject(s).`);
    }
  );

  registerAppTool(
    server,
    'create_subject',
    {
      title: 'Create Subject',
      description: 'Create a new subject under a semester.',
      inputSchema: subjectCreateSchema,
      outputSchema: { subject: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const subject = await data.createSubject(args);
      return result({ subject }, `Created subject "${subject.name}".`);
    }
  );

  registerAppTool(
    server,
    'update_subject',
    {
      title: 'Update Subject',
      description: 'Update an existing subject by ID.',
      inputSchema: subjectUpdateSchema,
      outputSchema: { subject: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { id, ...updates } = args;
      const subject = await data.updateSubject(id, updates);
      return result({ subject }, `Updated subject "${subject.name}".`);
    }
  );

  registerAppTool(
    server,
    'delete_subject',
    {
      title: 'Delete Subject',
      description: 'Soft-delete a subject by ID.',
      inputSchema: { id: z.string().min(1) },
      outputSchema: { success: z.boolean(), id: z.string() },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const result2 = await data.deleteSubject(args.id);
      return result(result2, `Deleted subject ${args.id}.`);
    }
  );

  // ==================== DAYS / ATTENDANCE ====================

  registerAppTool(
    server,
    'list_days',
    {
      title: 'List Days',
      description: 'List all recorded attendance days for a semester.',
      inputSchema: { semesterId: z.string().min(1) },
      outputSchema: { days: z.array(z.any()) },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const days = await data.listDays(args.semesterId);
      return result({ days }, `Found ${days.length} recorded day(s).`);
    }
  );

  registerAppTool(
    server,
    'get_day',
    {
      title: 'Get Day',
      description: 'Get attendance for a specific date in a semester.',
      inputSchema: { date: z.string().min(1), semesterId: z.string().min(1) },
      outputSchema: { day: z.any().nullable() },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const day = await data.getDay(args.date, args.semesterId);
      return result(
        { day },
        day ? `Loaded attendance for ${args.date}.` : `No record for ${args.date}.`
      );
    }
  );

  registerAppTool(
    server,
    'save_day',
    {
      title: 'Save Day',
      description:
        'Save or update attendance for a specific date. Lectures can include scheduled or extra classes.',
      inputSchema: saveDaySchema,
      outputSchema: { day: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const day = await data.saveDay(args);
      const presentCount = (day.lectures || []).filter((l) => l.status === 'present').length;
      return result(
        { day },
        `Saved attendance for ${args.date}: college ${args.collegeStatus}, ${presentCount} lecture(s) present.`
      );
    }
  );

  // ==================== ANALYTICS ====================

  registerAppTool(
    server,
    'get_attendance',
    {
      title: 'Get Attendance',
      description:
        'Get college-level and per-subject attendance stats, predictions, and safe bunk info.',
      inputSchema: { semesterId: z.string().min(1) },
      outputSchema: {
        collegeStats: z.any(),
        collegePredictions: z.any(),
        subjects: z.array(z.any()),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { stats, predictions } = await data.getCollegeStats(args.semesterId);
      const subjects = await data.getSubjectStats(args.semesterId);

      let text = `College attendance: ${stats.percentage ?? 'N/A'}%`;
      if (predictions) {
        text += `. Safe bunks: ${predictions.safeBunks}. ${predictions.message}`;
      }
      text += `. ${subjects.length} subject(s) tracked.`;

      return result({ collegeStats: stats, collegePredictions: predictions, subjects }, text);
    }
  );

  registerAppTool(
    server,
    'get_todays_schedule',
    {
      title: "Get Today's Schedule",
      description: "Get today's scheduled lectures based on the weekly timetable.",
      inputSchema: { semesterId: z.string().min(1) },
      outputSchema: { lectures: z.array(z.any()) },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const lectures = await data.getTodaysSchedule(args.semesterId);
      if (lectures.length === 0) {
        return result({ lectures }, 'No lectures scheduled for today.');
      }
      const names = lectures.map((l) => `${l.startTime} ${l.subjectName}`).join(', ');
      return result({ lectures }, `Today's schedule: ${lectures.length} lecture(s) — ${names}.`);
    }
  );

  // ==================== TIMETABLE ====================

  registerAppTool(
    server,
    'get_timetable',
    {
      title: 'Get Timetable',
      description: 'Get the weekly timetable for a semester.',
      inputSchema: { semesterId: z.string().min(1) },
      outputSchema: { timetable: z.any() },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const timetable = await data.getTimetable(args.semesterId);
      const dayCount = (timetable.days || []).length;
      return result({ timetable }, `Timetable has ${dayCount} day(s) with scheduled lectures.`);
    }
  );

  registerAppTool(
    server,
    'update_timetable',
    {
      title: 'Update Timetable',
      description: 'Update the timetable slots for a specific day of the week.',
      inputSchema: {
        semesterId: z.string().min(1),
        dayOfWeek: z.number().min(0).max(6).describe('Day of week (0=Sunday, 6=Saturday)'),
        slots: z.array(timetableSlotSchema).describe('Array of lecture slots for this day'),
      },
      outputSchema: { timetable: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const timetable = await data.updateTimetableSlots(
        args.semesterId,
        args.dayOfWeek,
        args.slots
      );
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      return result(
        { timetable },
        `Updated timetable for ${dayNames[args.dayOfWeek]} with ${args.slots.length} slot(s).`
      );
    }
  );

  // ==================== HOLIDAYS ====================

  registerAppTool(
    server,
    'list_holidays',
    {
      title: 'List Holidays',
      description: 'List all holidays for a semester.',
      inputSchema: { semesterId: z.string().min(1) },
      outputSchema: { holidays: z.array(z.any()) },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const holidays = await data.listHolidays(args.semesterId);
      return result({ holidays }, `Found ${holidays.length} holiday(s).`);
    }
  );

  registerAppTool(
    server,
    'create_holiday',
    {
      title: 'Create Holiday',
      description: 'Add a holiday (college closed, festival, etc.) to a semester.',
      inputSchema: holidayCreateSchema,
      outputSchema: { holiday: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const holiday = await data.createHoliday(args);
      return result({ holiday }, `Added holiday "${holiday.name}" on ${holiday.date}.`);
    }
  );

  registerAppTool(
    server,
    'delete_holiday',
    {
      title: 'Delete Holiday',
      description: 'Remove a holiday by ID.',
      inputSchema: { id: z.string().min(1) },
      outputSchema: { success: z.boolean(), id: z.string() },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const result2 = await data.deleteHoliday(args.id);
      return result(result2, `Deleted holiday ${args.id}.`);
    }
  );
}
