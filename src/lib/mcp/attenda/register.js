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
  formatSyllabus,
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
// non-destructive one via a param. MCP annotations are per-tool, not per-call,
// so we report the worst case across everything the tool can do.
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

// --- Semester Schema ---

const semesterManageSchema = {
  id: optionalString.describe(
    'Semester ID. Omit entirely to list all semesters or (with `name`) create a new one. ' +
      'Pass alone to fetch full detail (stats + bunk-safety predictions). Pass with other ' +
      'fields to update them. Pass with `delete: true` to permanently delete it.'
  ),
  delete: optionalBoolean.describe(
    'Set to true together with `id` to permanently delete this semester and everything under ' +
      'it (subjects, attendance days, timetable, holidays). Cannot be undone — confirm with the user first.'
  ),
  name: optionalString.describe(
    'Semester name, e.g. "Semester VI". Required when creating (no `id`); when updating, only ' +
      'pass it if you want to rename.'
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

// --- Subject Schema ---

const subjectManageSchema = {
  semesterId: optionalString.describe(
    'Semester to list/create subjects for. Required for listing and creating; not needed for ' +
      'update/delete (those target `id` directly).'
  ),
  id: optionalString.describe(
    'Subject ID to update or delete. Omit to list subjects (needs `semesterId`) or create one ' +
      '(needs `semesterId` + `name`).'
  ),
  delete: optionalBoolean.describe(
    'Set to true together with `id` to permanently delete this subject.'
  ),
  name: optionalString.describe(
    'Subject name, e.g. "Operating Systems". Required when creating (`semesterId` + `name`, no `id`).'
  ),
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

const dayManageSchema = {
  semesterId: z.string().min(1).describe('Semester this attendance record belongs to.'),
  date: optionalString.describe(
    'Specific date (YYYY-MM-DD). Required to save attendance. Optional to look up a single ' +
      'day. Omit both `date` and `collegeStatus`/`lectures` to list every recorded day instead.'
  ),
  collegeStatus: z
    .enum(['present', 'absent', 'holiday', 'closed'])
    .optional()
    .describe(
      'Whether the college was open/attended that day. Providing this (or `lectures`) saves ' +
        'attendance for `date` instead of just reading it — requires `date`.'
    ),
  lectures: z
    .array(lectureSchema)
    .optional()
    .describe(
      'Per-lecture attendance for the day, replacing any existing lectures for `date` entirely ' +
        '— include every lecture for the day, not just the ones you are changing. Providing ' +
        'this saves attendance instead of just reading it — requires `date`.'
    ),
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
    'manage_semesters',
    {
      title: 'Manage Semesters',
      description:
        'List, get full detail, create, update, or delete semesters — all in one tool.\n' +
        'No `id`, no `name` → list all semesters.\n' +
        'No `id`, with `name` → create a new semester.\n' +
        '`id` alone → get full detail (stats + bunk-safety predictions).\n' +
        '`id` + other fields → update just those fields, everything else stays as-is.\n' +
        '`id` + `delete: true` → permanently delete the semester and everything under it ' +
        '(subjects, attendance days, timetable, holidays). Cannot be undone — confirm with the user first.',
      inputSchema: semesterManageSchema,
      outputSchema: {
        semesters: z.array(z.any()).optional(),
        semester: z.any().optional(),
        stats: z.any().optional(),
        predictions: z.any().optional(),
        success: z.boolean().optional(),
        id: z.string().optional(),
      },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { id, delete: shouldDelete, ...fields } = args;

      if (shouldDelete) {
        if (!id) throw new Error('id is required to delete a semester');
        const res = await data.deleteSemester(id);
        return result(res, `Deleted semester ${id}.`);
      }

      if (id) {
        const hasUpdateFields = Object.values(fields).some((v) => v !== undefined);
        if (hasUpdateFields) {
          const semester = await data.updateSemester(id, fields);
          return result({ semester }, `Updated semester "${semester.name}".`);
        }
        const semester = await data.getSemester(id);
        const { stats, predictions } = await data.getCollegeStats(id);
        return result(
          { semester, stats, predictions },
          `Loaded semester "${semester.name}".\n${formatSemester(semester, stats, predictions)}`
        );
      }

      if (fields.name) {
        const semester = await data.createSemester(fields);
        return result({ semester }, `Created semester "${semester.name}".`);
      }

      const semesters = await data.listSemesters();
      const names = semesters.map((s) => `"${s.name}" (${s.id})`).join(', ');
      return result({ semesters }, `Found ${semesters.length} semester(s): ${names || 'none'}.`);
    }
  );

  // ==================== SUBJECTS ====================

  registerAppTool(
    server,
    'manage_subjects',
    {
      title: 'Manage Subjects',
      description:
        'List, create, update, or delete subjects — all in one tool.\n' +
        'No `id`, with `semesterId` only → list subjects for that semester.\n' +
        'No `id`, with `semesterId` + `name` → create a new subject.\n' +
        '`id` (+ any other fields) → update just those fields.\n' +
        '`id` + `delete: true` → permanently delete the subject. Cannot be undone.',
      inputSchema: subjectManageSchema,
      outputSchema: {
        subjects: z.array(z.any()).optional(),
        subject: z.any().optional(),
        success: z.boolean().optional(),
        id: z.string().optional(),
      },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { semesterId, id, delete: shouldDelete, ...fields } = args;

      if (shouldDelete) {
        if (!id) throw new Error('id is required to delete a subject');
        const res = await data.deleteSubject(id);
        return result(res, `Deleted subject ${id}.`);
      }

      if (id) {
        const subject = await data.updateSubject(id, fields);
        return result({ subject }, `Updated subject "${subject.name}".`);
      }

      if (semesterId && fields.name) {
        const subject = await data.createSubject({ semesterId, ...fields });
        return result({ subject }, `Created subject "${subject.name}".`);
      }

      if (!semesterId) {
        throw new Error('semesterId is required to list subjects');
      }
      const subjects = await data.listSubjects(semesterId);
      return result(
        { subjects },
        `Found ${subjects.length} subject(s).\n${formatSubjects(subjects)}`
      );
    }
  );

  // ==================== DAYS / ATTENDANCE ====================

  registerAppTool(
    server,
    'manage_days',
    {
      title: 'Manage Days',
      description:
        'List, look up, or save attendance days for a semester — all in one tool.\n' +
        'No `date` → list every recorded day, most recent first.\n' +
        '`date` alone (no `collegeStatus`/`lectures`) → look up attendance for that one day.\n' +
        '`date` + `collegeStatus` and/or `lectures` → save/overwrite attendance for that day ' +
        '(creates it if it does not exist yet).',
      inputSchema: dayManageSchema,
      outputSchema: { days: z.array(z.any()).optional(), day: z.any().optional() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { semesterId, date, collegeStatus, lectures, notes } = args;
      const isSave = collegeStatus !== undefined || lectures !== undefined;

      if (isSave) {
        if (!date) throw new Error('date is required to save attendance');
        const day = await data.saveDay({
          date,
          semesterId,
          collegeStatus: collegeStatus || 'present',
          lectures: lectures || [],
          notes,
        });
        const presentCount = (day.lectures || []).filter((l) => l.status === 'present').length;
        return result(
          { day },
          `Saved attendance for ${date}: college ${day.collegeStatus}, ${presentCount} lecture(s) present.`
        );
      }

      if (date) {
        const day = await data.getDay(date, semesterId);
        if (!day) return result({ days: [] }, `No record for ${date}.`);
        return result({ days: [day] }, `Loaded attendance for ${date}.\n${formatDays([day])}`);
      }

      const days = await data.listDays(semesterId);
      return result({ days }, `Found ${days.length} recorded day(s).\n${formatDays(days)}`);
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
        "Get the weekly timetable for a semester. Read-only — use update_timetable to change a day's slots.",
      inputSchema: { semesterId: z.string().min(1) },
      outputSchema: { timetable: z.any() },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const timetable = await data.getTimetable(args.semesterId);
      const dayCount = (timetable.days || []).length;
      return result(
        { timetable },
        `Timetable has ${dayCount} day(s) with scheduled lectures.\n${formatTimetable(timetable)}`
      );
    }
  );

  registerAppTool(
    server,
    'update_timetable',
    {
      title: 'Update Timetable',
      description:
        'Replace the lecture slots for one day of the week, then return the full updated timetable.',
      inputSchema: {
        semesterId: z.string().min(1),
        dayOfWeek: z
          .number()
          .min(0)
          .max(6)
          .describe('Day of week to update (0=Sunday..6=Saturday).'),
        slots: z
          .array(timetableSlotSchema)
          .describe(
            'Complete list of lecture slots for `dayOfWeek`, replacing whatever was there before.'
          ),
      },
      outputSchema: { timetable: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      await data.updateTimetableSlots(args.semesterId, args.dayOfWeek, args.slots);
      const timetable = await data.getTimetable(args.semesterId);
      const dayCount = (timetable.days || []).length;
      return result(
        { timetable },
        `Updated ${DAY_NAMES[args.dayOfWeek]} with ${args.slots.length} slot(s). ` +
          `Timetable has ${dayCount} day(s) with scheduled lectures.\n${formatTimetable(timetable)}`
      );
    }
  );

  // ==================== HOLIDAYS ====================

  registerAppTool(
    server,
    'manage_holidays',
    {
      title: 'Manage Holidays',
      description:
        'List, add, or remove holidays for a semester, chosen via `action`. Supports single ' +
        'days AND multi-day ranges (e.g. "Winter Break") in one call — never loop calling this ' +
        'once per day. Deleting does NOT require an ID: match by `date` or `startDate`+`endDate` ' +
        'instead, or use `id` from action="list" if you already have it. ' +
        'To fix a wrong range (e.g. it should only cover part of what was entered), delete the ' +
        'incorrect dates with action="delete" and (re)create the correct range with action="create" ' +
        '— re-creating a range is safe to repeat, it corrects existing entries instead of duplicating them.\n' +
        'action="list": needs `semesterId`.\n' +
        'action="create": needs `semesterId` and `name`, plus either `date` (single day) or ' +
        '`startDate`+`endDate` (inclusive range).\n' +
        'action="delete": needs `semesterId` plus one of `id`, `date`, or `startDate`+`endDate`.',
      inputSchema: {
        action: z.enum(['list', 'create', 'delete']).describe('Which operation to perform.'),
        semesterId: optionalString.describe('Required for all actions.'),
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
          'Holiday ID (from action="list") to remove. Only needed if you already have it — ' +
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
      if (args.action === 'list') {
        if (!args.semesterId) throw new Error('semesterId is required to list holidays');
        const holidays = await data.listHolidays(args.semesterId);
        return result(
          { holidays },
          `Found ${holidays.length} holiday(s).\n${formatHolidays(holidays)}`
        );
      }

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

  // ==================== SYLLABUS ====================

  registerAppTool(
    server,
    'manage_syllabus',
    {
      title: 'Manage Syllabus',
      description:
        'All-in-one tool to manage a subject syllabus — list, add/delete modules, add/delete ' +
        'topics, and update topic statuses. Use `action` to pick the operation.\n' +
        '\n' +
        'action="list": get the syllabus and completion stats (requires `subjectId`). Call this ' +
        'first to get module IDs and current progress.\n' +
        'action="add_module": adds a new top-level module (requires `subjectId`, `title`).\n' +
        'action="add_topic": adds a topic inside a module (requires `subjectId`, `moduleId`, `title`).\n' +
        'action="update_topic": changes a topic completion status (requires `subjectId`, `topicSearch`, `status`).\n' +
        '  `topicSearch` can be a topic ID or a case-insensitive title substring — searches across all modules.\n' +
        'action="delete_module": removes a module and all its topics (requires `subjectId`, `moduleId`).\n' +
        'action="delete_topic": removes a single topic from a module (requires `subjectId`, `moduleId`, `topicSearch`).',
      inputSchema: {
        action: z
          .enum([
            'list',
            'add_module',
            'add_topic',
            'update_topic',
            'delete_module',
            'delete_topic',
          ])
          .describe('Which syllabus operation to perform.'),
        subjectId: z.string().min(1).describe('Subject ID.'),
        moduleId: optionalString.describe(
          'Module ID (required for add_topic, delete_topic, delete_module).' +
            ' Get it from action="list" output.'
        ),
        title: optionalString.describe(
          'Title for the module or topic being created (required for add_module and add_topic).'
        ),
        topicSearch: optionalString.describe(
          'Topic ID or title substring to match (required for update_topic and delete_topic).' +
            ' Searches across all modules in the subject.'
        ),
        status: z
          .enum(['not_started', 'in_progress', 'completed'])
          .optional()
          .describe('Target completion status (required for update_topic).'),
      },
      outputSchema: {
        subjectName: z.string(),
        syllabus: z.array(z.any()),
        stats: z.any(),
      },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { action, subjectId, moduleId, title, topicSearch, status } = args;

      switch (action) {
        case 'list': {
          const dataRes = await data.getSyllabus(subjectId);
          return result(dataRes, formatSyllabus(dataRes));
        }

        case 'add_module': {
          if (!title) throw new Error('title is required for add_module');
          const dataRes = await data.addSyllabusModule(subjectId, title);
          return result(
            dataRes,
            `Added module "${title}" to "${dataRes.subjectName}". Total modules: ${dataRes.syllabus.length}.` +
              `\n${formatSyllabus(dataRes)}`
          );
        }

        case 'add_topic': {
          if (!moduleId || !title) throw new Error('moduleId and title are required for add_topic');
          const dataRes = await data.addSyllabusTopic(subjectId, moduleId, title);
          return result(
            dataRes,
            `Added topic "${title}" to "${dataRes.subjectName}". Total topics: ${dataRes.stats.total}.` +
              `\n${formatSyllabus(dataRes)}`
          );
        }

        case 'update_topic': {
          if (!topicSearch || !status) {
            throw new Error('topicSearch and status are required for update_topic');
          }
          const dataRes = await data.updateSyllabusTopic(subjectId, topicSearch, status);
          return result(
            dataRes,
            `Updated topic status to "${status}" in "${dataRes.subjectName}". New progress: ${dataRes.stats.percentage}%.` +
              `\n${formatSyllabus(dataRes)}`
          );
        }

        case 'delete_module': {
          if (!moduleId) throw new Error('moduleId is required for delete_module');
          const dataRes = await data.deleteSyllabusModule(subjectId, moduleId);
          return result(
            dataRes,
            `Deleted module from "${dataRes.subjectName}". Remaining modules: ${dataRes.syllabus.length}.` +
              `\n${formatSyllabus(dataRes)}`
          );
        }

        case 'delete_topic': {
          if (!moduleId || !topicSearch) {
            throw new Error('moduleId and topicSearch are required for delete_topic');
          }
          const dataRes = await data.deleteSyllabusTopic(subjectId, moduleId, topicSearch);
          return result(
            dataRes,
            `Deleted topic from "${dataRes.subjectName}". New progress: ${dataRes.stats.percentage}%.` +
              `\n${formatSyllabus(dataRes)}`
          );
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }
  );
}
