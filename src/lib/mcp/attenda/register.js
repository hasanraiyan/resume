import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import * as data from './data';
import {
  formatSemester,
  formatSubjects,
  formatDays,
  formatTimetable,
  formatHolidays,
  formatSubjectStats,
} from './formatters';

// --- Helpers ---

const optionalString = z.string().optional();
const optionalNumber = z.number().optional();
const optionalBoolean = z.boolean().optional();

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

// Used by tools that fold a destructive action (delete) into an otherwise
// non-destructive one via an `action` param. MCP annotations are per-tool,
// not per-call, so we report the worst case across all actions the tool can take.
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

const semesterSaveSchema = {
  id: optionalString.describe(
    'Semester ID to update. Omit this entirely to create a new semester instead — in that case `name` is required.'
  ),
  name: optionalString.describe(
    'Semester name, e.g. "Semester VI". Required when creating; when updating, only pass it if you want to rename.'
  ),
  startDate: optionalString.describe('Start date in YYYY-MM-DD format.'),
  endDate: optionalString.describe('End date in YYYY-MM-DD format.'),
  requiredAttendance: optionalNumber.describe(
    'Minimum required attendance percentage (default 75 on create).'
  ),
  weeklyHolidays: z
    .array(z.number().min(0).max(6))
    .optional()
    .describe('Days of week that are always off, 0=Sunday..6=Saturday (default [0] on create).'),
  institutionName: optionalString.describe('College/institution name.'),
  notes: optionalString.describe('Free-form notes about this semester.'),
};

// --- Subject Schemas ---

const subjectSaveSchema = {
  id: optionalString.describe(
    'Subject ID to update. Omit this entirely to create a new subject instead — in that case `semesterId` and `name` are required.'
  ),
  semesterId: optionalString.describe('Semester this subject belongs to. Required when creating.'),
  name: optionalString.describe('Subject name, e.g. "Operating Systems". Required when creating.'),
  facultyName: optionalString.describe('Faculty/teacher name.'),
  color: optionalString.describe('Hex color used in the UI (default #4a86e8 on create).'),
  credits: optionalNumber.describe('Credit value.'),
  requiredAttendance: optionalNumber.describe(
    'Required attendance % for this subject specifically, overriding the semester default.'
  ),
  isActive: optionalBoolean.describe(
    'Whether this subject is currently being tracked (default true on create).'
  ),
};

// --- Day/Lecture Schemas ---

const lectureSchema = z.object({
  subjectId: z.string().describe('Subject ID this lecture is for.'),
  status: z
    .enum(['present', 'absent', 'cancelled', 'didnt-happen', 'holiday', 'college-closed'])
    .default('present')
    .describe('Attendance outcome for this specific lecture.'),
  isExtra: z.boolean().default(false).describe('True if this lecture was not on the timetable.'),
  startTime: z.string().default(''),
  endTime: z.string().default(''),
});

const saveDaySchema = {
  date: z.string().min(1).describe('Date in YYYY-MM-DD format.'),
  semesterId: z.string().min(1).describe('Semester this attendance record belongs to.'),
  collegeStatus: z
    .enum(['present', 'absent', 'holiday', 'closed'])
    .default('present')
    .describe('Whether the college was open/attended at all that day.'),
  lectures: z
    .array(lectureSchema)
    .default([])
    .describe('Per-lecture attendance for the day. Replaces any existing lectures for this date.'),
  notes: optionalString,
};

// --- Timetable Schema ---

const timetableSlotSchema = z.object({
  subjectId: z.string().min(1).describe('Subject to schedule in this slot.'),
  startTime: z.string().default(''),
  endTime: z.string().default(''),
});

// --- Tool Registration ---

export function registerAttendaMcp(server) {
  // ==================== SEMESTERS ====================

  registerAppTool(
    server,
    'list_semesters',
    {
      title: 'List Semesters',
      description:
        'List every semester (id + name only), or pass `id` to fetch one semester in full ' +
        'detail — including attendance stats and bunk-safety predictions. Always call this ' +
        'first (without `id`) to discover which semesterId to use in other tools.',
      inputSchema: {
        id: optionalString.describe(
          'Semester ID for full detail. Omit to get the lightweight list of all semesters instead.'
        ),
      },
      outputSchema: {
        semesters: z.array(z.any()).optional(),
        semester: z.any().optional(),
        stats: z.any().optional(),
        predictions: z.any().optional(),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      if (args.id) {
        const semester = await data.getSemester(args.id);
        const { stats, predictions } = await data.getCollegeStats(args.id);
        return result(
          { semester, stats, predictions },
          `Loaded semester "${semester.name}".\n${formatSemester(semester, stats, predictions)}`
        );
      }
      const semesters = await data.listSemesters();
      const names = semesters.map((s) => `"${s.name}" (${s.id})`).join(', ');
      return result({ semesters }, `Found ${semesters.length} semester(s): ${names || 'none'}.`);
    }
  );

  registerAppTool(
    server,
    'save_semester',
    {
      title: 'Save Semester',
      description:
        'Create a new semester or update an existing one in one tool. Omit `id` to create ' +
        '(requires `name`). Pass `id` to update — only the fields you include are changed, ' +
        'everything else is left as-is.',
      inputSchema: semesterSaveSchema,
      outputSchema: { semester: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { id, ...fields } = args;
      if (id) {
        const semester = await data.updateSemester(id, fields);
        return result({ semester }, `Updated semester "${semester.name}".`);
      }
      if (!fields.name) {
        throw new Error('name is required to create a semester');
      }
      const semester = await data.createSemester(fields);
      return result({ semester }, `Created semester "${semester.name}".`);
    }
  );

  registerAppTool(
    server,
    'delete_semester',
    {
      title: 'Delete Semester',
      description:
        'Permanently remove a semester and everything under it (subjects, attendance days, ' +
        'timetable, holidays). This cannot be undone from this tool — confirm with the user first.',
      inputSchema: { id: z.string().min(1).describe('Semester ID to delete.') },
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
      description:
        'List all subjects tracked under a semester. Call list_semesters first to get a semesterId.',
      inputSchema: { semesterId: z.string().min(1).describe('Semester to list subjects for.') },
      outputSchema: { subjects: z.array(z.any()) },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const subjects = await data.listSubjects(args.semesterId);
      return result(
        { subjects },
        `Found ${subjects.length} subject(s).\n${formatSubjects(subjects)}`
      );
    }
  );

  registerAppTool(
    server,
    'save_subject',
    {
      title: 'Save Subject',
      description:
        'Create a new subject or update an existing one in one tool. Omit `id` to create ' +
        '(requires `semesterId` and `name`). Pass `id` to update — only the fields you include ' +
        'are changed.',
      inputSchema: subjectSaveSchema,
      outputSchema: { subject: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { id, ...fields } = args;
      if (id) {
        const subject = await data.updateSubject(id, fields);
        return result({ subject }, `Updated subject "${subject.name}".`);
      }
      if (!fields.semesterId || !fields.name) {
        throw new Error('semesterId and name are required to create a subject');
      }
      const subject = await data.createSubject(fields);
      return result({ subject }, `Created subject "${subject.name}".`);
    }
  );

  registerAppTool(
    server,
    'delete_subject',
    {
      title: 'Delete Subject',
      description: 'Permanently remove a subject by ID. This cannot be undone from this tool.',
      inputSchema: { id: z.string().min(1).describe('Subject ID to delete.') },
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
      description:
        'List recorded attendance days for a semester. Pass `date` to look up one specific day ' +
        'instead — the result is still an array, with at most one item.',
      inputSchema: {
        semesterId: z.string().min(1),
        date: optionalString.describe(
          'Specific date (YYYY-MM-DD) to look up. Omit to list every recorded day, most recent first.'
        ),
      },
      outputSchema: { days: z.array(z.any()) },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      if (args.date) {
        const day = await data.getDay(args.date, args.semesterId);
        if (!day) return result({ days: [] }, `No record for ${args.date}.`);
        return result({ days: [day] }, `Loaded attendance for ${args.date}.\n${formatDays([day])}`);
      }
      const days = await data.listDays(args.semesterId);
      return result({ days }, `Found ${days.length} recorded day(s).\n${formatDays(days)}`);
    }
  );

  registerAppTool(
    server,
    'save_day',
    {
      title: 'Save Day',
      description:
        'Record or overwrite attendance for one date (creates it if it does not exist yet). ' +
        'The `lectures` array replaces any previously saved lectures for that date — include ' +
        'every lecture for the day, not just the ones you are changing.',
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
    'get_overview',
    {
      title: 'Get Overview',
      description:
        'The go-to tool for "how am I doing" questions: college-level and per-subject ' +
        'attendance stats, safe-bunk predictions, AND the class schedule for a given date ' +
        '(defaults to today) — all in one call, instead of fetching stats and schedule separately.',
      inputSchema: {
        semesterId: z.string().min(1),
        date: optionalString.describe(
          'Date (YYYY-MM-DD) to include the schedule for. Defaults to today.'
        ),
      },
      outputSchema: {
        collegeStats: z.any(),
        collegePredictions: z.any(),
        subjects: z.array(z.any()),
        schedule: z.any(),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { stats, predictions } = await data.getCollegeStats(args.semesterId);
      const subjects = await data.getSubjectStats(args.semesterId);
      const schedule = await data.getSchedule(args.semesterId, args.date);

      let text = `College attendance: ${stats.percentage ?? 'N/A'}%`;
      if (predictions) {
        text += `. Safe bunks: ${predictions.safeBunks}. ${predictions.message}`;
      }
      text += `. ${subjects.length} subject(s) tracked.`;

      if (subjects.length > 0) {
        text += `\n${formatSubjectStats(subjects)}`;
      }

      if (schedule.isHoliday) {
        text += `\n${schedule.date} is a declared holiday ("${schedule.holidayName}").`;
      } else if (schedule.isWeeklyHoliday) {
        text += `\n${schedule.date} is a weekly off.`;
      } else {
        text += `\n${schedule.lectures.length} lecture(s) scheduled on ${schedule.date}.`;
      }

      return result(
        { collegeStats: stats, collegePredictions: predictions, subjects, schedule },
        text
      );
    }
  );

  // ==================== TIMETABLE ====================

  registerAppTool(
    server,
    'get_timetable',
    {
      title: 'Get Timetable',
      description:
        "Get the weekly timetable for a semester. To change a day's lecture slots, also pass " +
        '`dayOfWeek` and `slots` — that day is updated first (replacing its slots entirely), ' +
        'then the full updated timetable is returned.',
      inputSchema: {
        semesterId: z.string().min(1),
        dayOfWeek: z
          .number()
          .min(0)
          .max(6)
          .optional()
          .describe(
            'Day of week to update (0=Sunday..6=Saturday). Must be provided together with `slots`.'
          ),
        slots: z
          .array(timetableSlotSchema)
          .optional()
          .describe(
            'New complete list of lecture slots for `dayOfWeek`, replacing whatever was there before.'
          ),
      },
      outputSchema: { timetable: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      let updateSummary = '';
      if (args.dayOfWeek !== undefined && args.slots !== undefined) {
        await data.updateTimetableSlots(args.semesterId, args.dayOfWeek, args.slots);
        updateSummary = ` Updated ${DAY_NAMES[args.dayOfWeek]} with ${args.slots.length} slot(s).`;
      }
      const timetable = await data.getTimetable(args.semesterId);
      const dayCount = (timetable.days || []).length;
      return result(
        { timetable },
        `Timetable has ${dayCount} day(s) with scheduled lectures.${updateSummary}\n${formatTimetable(timetable)}`
      );
    }
  );

  // ==================== HOLIDAYS ====================

  registerAppTool(
    server,
    'list_holidays',
    {
      title: 'List Holidays',
      description: 'List all holidays declared for a semester.',
      inputSchema: { semesterId: z.string().min(1) },
      outputSchema: { holidays: z.array(z.any()) },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const holidays = await data.listHolidays(args.semesterId);
      return result(
        { holidays },
        `Found ${holidays.length} holiday(s).\n${formatHolidays(holidays)}`
      );
    }
  );

  registerAppTool(
    server,
    'manage_holidays',
    {
      title: 'Manage Holidays',
      description:
        'Add or remove holidays for a semester, chosen via `action`. Supports single days AND ' +
        'multi-day ranges (e.g. "Winter Break") in one call — never loop calling this once per day. ' +
        'Deleting does NOT require an ID: match by `date` or `startDate`+`endDate` instead, or use ' +
        '`id` from list_holidays if you already have it. ' +
        'To fix a wrong range (e.g. it should only cover part of what was entered), delete the ' +
        'incorrect dates with action="delete" and (re)create the correct range with action="create" ' +
        '— re-creating a range is safe to repeat, it corrects existing entries instead of duplicating them.\n' +
        'action="create": needs `semesterId` and `name`, plus either `date` (single day) or ' +
        '`startDate`+`endDate` (inclusive range).\n' +
        'action="delete": needs `semesterId` plus one of `id`, `date`, or `startDate`+`endDate`.',
      inputSchema: {
        action: z.enum(['create', 'delete']).describe('Which operation to perform.'),
        semesterId: optionalString.describe('Required for both actions.'),
        date: optionalString.describe(
          'Single date (YYYY-MM-DD). For "create": one day off. For "delete": removes the ' +
            'holiday on this date directly, no id needed.'
        ),
        startDate: optionalString.describe(
          'Start of an inclusive date range (YYYY-MM-DD). Combine with `endDate` for multi-day ' +
            'holidays like "Winter Break" — this creates/deletes every day in the range in one call.'
        ),
        endDate: optionalString.describe('End of the inclusive date range. Used with `startDate`.'),
        name: optionalString.describe(
          'Holiday name, e.g. "Winter Break". Required when action is "create".'
        ),
        type: z.enum(['manual', 'college']).optional().describe('Defaults to "manual".'),
        id: optionalString.describe(
          'Holiday ID (from list_holidays) to remove. Only needed if you already have it — ' +
            '`date`/`startDate`+`endDate` are usually simpler.'
        ),
      },
      outputSchema: {
        holiday: z.any().optional(),
        holidays: z.array(z.any()).optional(),
        success: z.boolean().optional(),
        count: z.number().optional(),
        id: z.string().optional(),
      },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      if (args.action === 'delete') {
        if (args.id) {
          const result2 = await data.deleteHoliday(args.id);
          return result(result2, `Deleted holiday ${args.id}.`);
        }
        if (!args.semesterId) {
          throw new Error('semesterId is required to delete by date');
        }
        if (args.startDate) {
          const res = await data.deleteHolidaysByDateRange(
            args.semesterId,
            args.startDate,
            args.endDate || args.startDate
          );
          return result(
            res,
            `Deleted ${res.count} holiday(s) from ${args.startDate} to ${args.endDate || args.startDate}.`
          );
        }
        if (args.date) {
          const res = await data.deleteHolidayByDate(args.semesterId, args.date);
          return result(
            res,
            res.success ? `Deleted holiday on ${args.date}.` : `No holiday found on ${args.date}.`
          );
        }
        throw new Error('Provide id, date, or startDate(+endDate) to delete a holiday');
      }

      if (!args.semesterId || !args.name) {
        throw new Error('semesterId and name are required to create a holiday');
      }
      if (args.startDate) {
        const endDate = args.endDate || args.startDate;
        const holidays = await data.createHolidayRange({
          semesterId: args.semesterId,
          startDate: args.startDate,
          endDate,
          name: args.name,
          type: args.type,
        });
        return result(
          { holidays },
          `Added "${args.name}" from ${args.startDate} to ${endDate} (${holidays.length} day(s)).`
        );
      }
      if (!args.date) {
        throw new Error('Provide date, or startDate(+endDate), to create a holiday');
      }
      const holiday = await data.createHoliday(args);
      return result({ holiday }, `Added holiday "${holiday.name}" on ${holiday.date}.`);
    }
  );
}
