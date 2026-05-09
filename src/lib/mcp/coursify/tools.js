import { z } from 'zod';
import {
  COURSE_AUTHORING_GUIDE,
  READ_ONLY_ANNOTATIONS,
  MUTATION_ANNOTATIONS,
  DESTRUCTIVE_ANNOTATIONS,
} from './constants.js';
import { textResult, errorResult, toolMeta, parseOutlineToModules } from './utils.js';
import {
  dbListCourses,
  dbGetCourse,
  dbCreateCourse,
  dbUpdateCourse,
  dbDeleteCourse,
  dbSaveCoursePlan,
  dbCreateModule,
  dbUpdateModule,
  dbDeleteModules,
  dbReorderModules,
  dbAddUnit,
  dbUpdateUnit,
  dbDeleteUnits,
  dbReorderUnits,
  dbGetUnitContent,
  dbAddUnits,
  dbApplySuggestedModules,
  dbSearchCourses,
  dbGetResearchNotes,
  dbResearchFindings,
  dbMarkUnitComplete,
} from '@/lib/coursify/db-ops.js';

// --- Shared Schemas ---

const questionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'multi_select']),
  question: z.string().describe('The question text'),
  options: z
    .array(z.string())
    .optional()
    .describe('Required for multiple_choice and multi_select.'),
  correctAnswer: z.union([z.string(), z.number(), z.array(z.number())]),
  explanation: z.string().optional().describe('Explanation shown after submission.'),
  points: z.number().int().optional().default(1),
});

const resourceSchema = z.object({
  type: z.enum(['video', 'article', 'doc', 'other']),
  url: z.string(),
  title: z.string(),
});

const videoBlockSchema = z.object({
  videoUrl: z.string(),
  duration: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

const articleBlockSchema = z.object({
  content: z.string(),
  attachments: z.array(resourceSchema).optional(),
});

const blockSchema = z.object({
  type: z.enum(['video', 'article', 'quiz']),
  video: videoBlockSchema.optional(),
  article: articleBlockSchema.optional(),
  quiz: z
    .object({
      questions: z.array(questionSchema),
      passingScore: z.number().optional().default(80),
    })
    .optional(),
});

export function registerCoursifyTools(server) {
  // ─── Meta & Discovery ──────────────────────────────────────────────────────

  server.registerTool(
    'get_authoring_guide',
    {
      title: 'Get Authoring Guide',
      description:
        'Returns the full Coursify authoring guide, workflow, quality bar, and Mermaid/LaTeX templates. Call this before creating any new content.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {},
      _meta: toolMeta('Loading guide...', 'Guide ready.'),
    },
    async () =>
      textResult('Coursify Authoring Guide', { kind: 'guide', guide: COURSE_AUTHORING_GUIDE })
  );

  server.registerTool(
    'list_courses',
    {
      title: 'List or Search Courses',
      description:
        'Retrieve all courses or search by keywords. Includes progress summaries and authoringStatus.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        query: z.string().optional().describe('Search keyword for title, description, or tags.'),
        status: z.enum(['draft', 'published', 'all']).optional().default('all'),
        limit: z.number().int().optional().default(20),
        offset: z.number().int().optional().default(0),
      },
      _meta: toolMeta('Fetching courses...', 'Courses loaded.'),
    },
    async ({ query, status, limit, offset }) => {
      try {
        const courses = query
          ? await dbSearchCourses({ query })
          : await dbListCourses({ status, limit, offset });
        return textResult(`Found ${courses.length} courses.`, { kind: 'courses', courses });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  // ─── Course Operations ─────────────────────────────────────────────────────

  server.registerTool(
    'get_course',
    {
      title: 'Get Course Details',
      description:
        'Fetches course metadata. Can optionally include full unit content, module structure, research notes, or a progress report.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the course'),
        includeContent: z
          .boolean()
          .optional()
          .describe('Return full Markdown/blocks for all units.'),
        includeResearch: z.boolean().optional().describe('Return all research notes.'),
        includeProgress: z
          .boolean()
          .optional()
          .describe('Return completeness report and next recommended action.'),
      },
      _meta: toolMeta('Loading course...', 'Course loaded.'),
    },
    async ({ id, includeContent, includeResearch, includeProgress }) => {
      try {
        const data = await dbGetCourse({ id, includeUnitContent: includeContent });
        const res = { kind: 'course_detail', ...data };
        if (includeResearch) res.researchNotes = await dbGetResearchNotes({ courseId: id });
        if (includeProgress) {
          const { course, modules } = data;
          const planFields = {
            targetAudience: !!course.targetAudience,
            learningObjectives: (course.learningObjectives || []).length > 0,
            prerequisites: (course.prerequisites || []).length > 0,
            outcome: !!course.outcome,
            outline: !!course.outline,
          };
          const planComplete = Object.values(planFields).filter(Boolean).length;
          const units = modules.flatMap((m) => m.units || []);
          const incompleteUnits = units.filter((u) => u.status !== 'complete').length;

          let nextAction = 'No action needed.';
          if (planComplete < 3)
            nextAction =
              'Call upsert_course to define the target audience, objectives, and outline.';
          else if (modules.length === 0)
            nextAction =
              'Call analyze_outline(apply: true) or upsert_module to structure the course.';
          else if (incompleteUnits > 0)
            nextAction = `Write the remaining ${incompleteUnits} unit(s) with upsert_unit.`;
          else
            nextAction =
              'Course looks complete. Call upsert_course(status: "published") when ready.';

          res.progressReport = {
            planCompleteness: {
              filled: planComplete,
              total: Object.keys(planFields).length,
              fields: planFields,
            },
            unitStats: { total: units.length, incomplete: incompleteUnits },
            authoringStatus: course.authoringStatus || 'idea',
            nextAction,
          };
        }
        return textResult(`Course "${data.course.title}" loaded.`, res);
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'upsert_course',
    {
      title: 'Create or Update Course',
      description:
        'Create a new course shell or update metadata, planning fields, and status. Use this for saving your plan, agentNotes, or publishing.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().optional().describe('Omit to create a new course.'),
        title: z.string().optional(),
        description: z.string().optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        estimatedDuration: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(['draft', 'published']).optional(),
        authoringStatus: z
          .enum(['idea', 'researching', 'planned', 'drafting', 'reviewing', 'ready', 'published'])
          .optional(),
        targetAudience: z.string().optional(),
        learningObjectives: z.array(z.string()).optional(),
        prerequisites: z.array(z.string()).optional(),
        outcome: z.string().optional(),
        outline: z.string().optional().describe('Markdown outline for module suggestion.'),
        agentNotes: z.string().optional().describe('Internal agent scratchpad.'),
      },
      _meta: toolMeta('Saving course...', 'Course saved.'),
    },
    async ({ id, ...fields }) => {
      const BASIC_KEYS = [
        'title',
        'description',
        'difficulty',
        'estimatedDuration',
        'tags',
        'status',
      ];
      const PLAN_KEYS = [
        'targetAudience',
        'learningObjectives',
        'prerequisites',
        'outcome',
        'outline',
        'authoringStatus',
        'agentNotes',
      ];

      try {
        let result;
        if (!id) {
          result = await dbCreateCourse(fields);
          const hasPlanFields = PLAN_KEYS.some((k) => fields[k] !== undefined);
          if (hasPlanFields) {
            result = await dbSaveCoursePlan({ courseId: result.course.id, ...fields });
          }
        } else {
          const hasBasic = BASIC_KEYS.some((k) => fields[k] !== undefined);
          const hasPlan = PLAN_KEYS.some((k) => fields[k] !== undefined);
          if (hasBasic && hasPlan) {
            await dbUpdateCourse({ id, ...fields });
            result = await dbSaveCoursePlan({ courseId: id, ...fields });
          } else if (hasPlan) {
            result = await dbSaveCoursePlan({ courseId: id, ...fields });
          } else {
            result = await dbUpdateCourse({ id, ...fields });
          }
        }
        return textResult(`Course "${result.course.title}" saved.`, {
          success: true,
          course: result.course,
        });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'delete_courses',
    {
      title: 'Delete Course(s)',
      description: 'Soft-delete one or more courses and their associated content.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        ids: z.array(z.string()).describe('List of course IDs to delete.'),
      },
      _meta: toolMeta('Deleting...', 'Deleted.'),
    },
    async ({ ids }) => {
      try {
        await Promise.all(ids.map((id) => dbDeleteCourse({ id })));
        return textResult(`Deleted ${ids.length} course(s).`, { success: true });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  // ─── Module Operations ─────────────────────────────────────────────────────

  server.registerTool(
    'upsert_module',
    {
      title: 'Create or Update Module',
      description: 'Add a new module to a course or update an existing one.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().optional().describe('Omit to create.'),
        courseId: z.string().describe('Required.'),
        title: z.string().optional(),
        summary: z.string().optional(),
        learningGoals: z.array(z.string()).optional(),
        order: z.number().int().optional(),
        status: z.enum(['planned', 'drafting', 'complete', 'needs_review']).optional(),
      },
      _meta: toolMeta('Saving module...', 'Module saved.'),
    },
    async ({ id, courseId, ...fields }) => {
      try {
        const result = id
          ? await dbUpdateModule({ id, ...fields })
          : await dbCreateModule({ courseId, ...fields });
        return textResult(`Module "${result.module.title}" saved.`, {
          success: true,
          module: result.module,
        });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'delete_modules',
    {
      title: 'Delete Module(s)',
      description: 'Soft-delete one or more modules.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        ids: z.array(z.string()).describe('List of module IDs to delete.'),
      },
      _meta: toolMeta('Deleting modules...', 'Modules deleted.'),
    },
    async ({ ids }) => {
      try {
        const { deletedCount } = await dbDeleteModules({ ids });
        return textResult(`Deleted ${deletedCount} modules.`, { success: true, deletedCount });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'reorder_modules',
    {
      title: 'Reorder Modules',
      description: 'Set the display order of all modules in a course.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
        moduleIds: z.array(z.string()).describe('All module IDs in the desired order.'),
      },
      _meta: toolMeta('Reordering modules...', 'Modules reordered.'),
    },
    async ({ courseId, moduleIds }) => {
      try {
        await dbReorderModules({ courseId, moduleIds });
        return textResult(`Reordered ${moduleIds.length} modules.`, { success: true });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  // ─── Unit Operations ───────────────────────────────────────────────────────

  server.registerTool(
    'get_unit',
    {
      title: 'Get Unit',
      description: 'Fetch a single unit including its content blocks and quiz.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: { id: z.string() },
      _meta: toolMeta('Loading unit...', 'Unit loaded.'),
    },
    async ({ id }) => {
      try {
        const { unit } = await dbGetUnitContent({ id });
        return textResult(`Unit "${unit.title}" loaded.`, {
          kind: 'unit_detail',
          unit,
        });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'upsert_unit',
    {
      title: 'Create or Update Unit',
      description:
        'Add one or more units, or update an existing one. Can also set blocks, quiz questions or resources.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().optional().describe('Update existing if provided.'),
        courseId: z.string().describe('Required for creation.'),
        moduleId: z.string().optional(),
        title: z.string().optional(),
        unitType: z.enum(['lesson', 'quiz']).optional(),
        content: z.string().optional().describe('Markdown content (legacy). Prefer blocks.'),
        blocks: z.array(blockSchema).optional().describe('Structured content blocks.'),
        status: z.enum(['planned', 'draft', 'needs_review', 'complete']).optional(),
        completionStatus: z.enum(['not_started', 'in_progress', 'complete']).optional(),
        order: z.number().int().optional(),
        summary: z.string().optional(),
        learningGoals: z.array(z.string()).optional(),
        estimatedDuration: z.string().optional(),
        resources: z.array(resourceSchema).optional(),
        questions: z
          .array(questionSchema)
          .optional()
          .describe('Quiz questions. Replaces existing list.'),
        batch: z
          .array(
            z.object({
              title: z.string(),
              moduleId: z.string().optional(),
              unitType: z.enum(['lesson', 'quiz']).optional(),
              content: z.string().optional(),
              blocks: z.array(blockSchema).optional(),
              order: z.number().int().optional(),
              status: z.enum(['planned', 'draft', 'needs_review', 'complete']).optional(),
              summary: z.string().optional(),
              learningGoals: z.array(z.string()).optional(),
              estimatedDuration: z.string().optional(),
              resources: z.array(resourceSchema).optional(),
            })
          )
          .optional()
          .describe('Create multiple units in one call.'),
      },
      _meta: toolMeta('Saving unit(s)...', 'Unit(s) saved.'),
    },
    async ({ id, courseId, batch, ...fields }) => {
      try {
        if (batch) {
          const { units } = await dbAddUnits({ courseId, units: batch });
          return textResult(`Added ${units.length} units.`, { success: true, units });
        }
        if (id) {
          const { unit } = await dbUpdateUnit({ id, ...fields });
          return textResult(`Updated unit "${unit.title}".`, { success: true, unit });
        }
        const { unit } = await dbAddUnit({ courseId, ...fields });
        return textResult(`Added unit "${unit.title}".`, { success: true, unit });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'mark_unit_complete',
    {
      title: 'Mark Unit Complete',
      description: 'Update the completion status of a unit.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('Unit ID'),
        completionStatus: z.enum(['not_started', 'in_progress', 'complete']),
      },
      _meta: toolMeta('Updating status...', 'Status updated.'),
    },
    async ({ id, completionStatus }) => {
      try {
        const { unit } = await dbMarkUnitComplete({ id, completionStatus });
        return textResult(`Unit "${unit.title}" status updated to ${completionStatus}.`, {
          success: true,
          unit,
        });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'delete_units',
    {
      title: 'Delete Unit(s)',
      description: 'Soft-delete one or more units.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        ids: z.array(z.string()).describe('List of unit IDs to delete.'),
      },
      _meta: toolMeta('Deleting units...', 'Units deleted.'),
    },
    async ({ ids }) => {
      try {
        const { deletedCount } = await dbDeleteUnits({ ids });
        return textResult(`Deleted ${deletedCount} units.`, { success: true, deletedCount });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'reorder_units',
    {
      title: 'Reorder Units',
      description: 'Set the order of units within a course or module.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string(),
        unitIds: z.array(z.string()),
        moduleId: z.string().optional().describe('Reorder within this module only.'),
      },
      _meta: toolMeta('Reordering...', 'Reordered.'),
    },
    async ({ courseId, unitIds, moduleId }) => {
      try {
        await dbReorderUnits({ courseId, unitIds, moduleId });
        return textResult(`Reordered ${unitIds.length} units.`, { success: true });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  // ─── Research & Planning ───────────────────────────────────────────────────

  server.registerTool(
    'manage_research',
    {
      title: 'Manage Research Notes',
      description: 'Add single or multiple research findings/notes to a course.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string(),
        findings: z
          .array(
            z.object({
              title: z.string(),
              summary: z.string(),
              sourceUrl: z.string().optional(),
              sourceType: z.enum(['web', 'paper', 'book', 'video', 'other']).optional(),
              notes: z.string().optional(),
            })
          )
          .describe('Add one or more findings.'),
      },
      _meta: toolMeta('Saving research...', 'Research saved.'),
    },
    async ({ courseId, findings }) => {
      try {
        const { count } = await dbResearchFindings({ courseId, findings });
        return textResult(`Saved ${count} research finding(s).`, { success: true, count });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'analyze_outline',
    {
      title: 'Analyze or Apply Outline',
      description:
        'Analyze a course outline for module suggestions, or apply them to create modules and units automatically.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string(),
        apply: z
          .boolean()
          .optional()
          .describe('If true, creates the modules and units. If false, only returns suggestions.'),
      },
      _meta: toolMeta('Processing outline...', 'Outline processed.'),
    },
    async ({ courseId, apply }) => {
      try {
        if (apply) {
          const { modulesCreated } = await dbApplySuggestedModules({ courseId });
          return textResult(`Created ${modulesCreated} modules from outline.`, {
            success: true,
            modulesCreated,
          });
        }
        const { course } = await dbGetCourse({ id: courseId });
        if (!course.outline)
          return errorResult('No outline found. Call upsert_course with an outline first.');

        const suggestions = parseOutlineToModules(course.outline);
        if (suggestions.length === 0)
          return errorResult('Could not parse unit titles. Use ## or ### headers for unit names.');

        return textResult(`Suggested ${suggestions.length} modules.`, {
          kind: 'module_suggestions',
          suggestedModules: suggestions,
        });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );
}
