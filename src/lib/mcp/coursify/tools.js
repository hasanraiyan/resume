import { z } from 'zod';
import {
  COURSE_AUTHORING_GUIDE,
  READ_ONLY_ANNOTATIONS,
  MUTATION_ANNOTATIONS,
  DESTRUCTIVE_ANNOTATIONS,
} from './constants.js';
import { textResult, errorResult, toolMeta } from './utils.js';
import {
  dbListCourses,
  dbGetCourse,
  dbCreateCourse,
  dbUpdateCourse,
  dbPublishCourse,
  dbDeleteCourse,
  dbSaveCoursePlan,
  dbCreateModule,
  dbUpdateModule,
  dbDeleteModule,
  dbReorderModules,
  dbAddSection,
  dbUpdateSection,
  dbDeleteSection,
  dbReorderSections,
  dbGetSectionContent,
  dbSetQuizQuestions,
  dbListCourseModules,
  dbAddResearchNote,
  dbResearchFindings,
  dbGetResearchNotes,
  dbGetCourseWorkspace,
  dbSearchCourses,
  dbGetModule,
  dbDeleteModules,
  dbAddSections,
  dbDeleteSections,
  dbAddSectionResource,
  dbApplySuggestedModules,
} from '@/lib/coursify/db-ops.js';

// Shared schemas
const resourceSchema = z.object({
  type: z.enum(['video', 'article', 'doc', 'other']),
  url: z.string(),
  title: z.string(),
});

const questionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'multi_select']),
  question: z.string().describe('The question text'),
  options: z
    .array(z.string())
    .optional()
    .describe(
      'Answer options. Required for multiple_choice and multi_select. Omit for true_false and short_answer.'
    ),
  correctAnswer: z
    .union([z.string(), z.number(), z.array(z.number())])
    .describe(
      'Correct answer. multiple_choice → option index. true_false → "true"/"false". short_answer → reference string. multi_select → array of indices.'
    ),
  explanation: z
    .string()
    .optional()
    .describe('Explanation shown after submission. Always include this.'),
  points: z.number().int().optional().describe('Point value. Defaults to 1.'),
});

export function registerCoursifyTools(server) {
  server.registerTool(
    'get_course_authoring_guide',
    {
      title: 'Get Course Authoring Guide',
      description:
        'Use this when the user asks you to create, improve, or plan a Coursify course. Returns the full research → save_course_plan → create_module → add_section workflow, the per-section Markdown template, authoring status meanings, and quality bar. Always call this before writing any course content.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {},
      _meta: toolMeta('Loading authoring guide...', 'Authoring guide ready.'),
    },
    async () =>
      textResult('Use this Coursify authoring guide before creating or revising course content.', {
        kind: 'course_authoring_guide',
        guide: COURSE_AUTHORING_GUIDE,
      })
  );

  // ── Courses ──────────────────────────────────────────────────────────────

  server.registerTool(
    'list_courses',
    {
      title: 'List Courses',
      description:
        'Retrieve all Coursify courses, sorted by last updated. Includes progress summary (sections complete/total) and authoringStatus.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        status: z
          .enum(['draft', 'published', 'all'])
          .optional()
          .describe('Filter by status. Defaults to "all".'),
        limit: z.number().int().optional().default(20),
        offset: z.number().int().optional().default(0),
      },
      _meta: toolMeta('Fetching courses...', 'Courses loaded.'),
    },
    async ({ status, limit, offset } = {}) => {
      try {
        const courses = await dbListCourses({ status, limit, offset });
        return textResult(`Found ${courses.length} courses in Coursify.`, {
          kind: 'courses',
          courses,
        });
      } catch (err) {
        return errorResult(`Error fetching courses: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'delete_modules',
    {
      title: 'Delete Modules (Bulk)',
      description: 'Delete multiple modules in a single call.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        ids: z.array(z.string()).describe('Array of module IDs to delete'),
      },
      _meta: toolMeta('Deleting modules...', 'Modules deleted.'),
    },
    async ({ ids }) => {
      try {
        const { deletedCount } = await dbDeleteModules({ ids });
        return textResult(`Deleted ${deletedCount} modules.`, { success: true, deletedCount });
      } catch (err) {
        return errorResult(`Error deleting modules: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'search_courses',
    {
      title: 'Search Courses',
      description: 'Search for courses by title, description, or tags.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        query: z.string().describe('Search keyword'),
      },
      _meta: toolMeta('Searching courses...', 'Search complete.'),
    },
    async ({ query }) => {
      try {
        const courses = await dbSearchCourses({ query });
        return textResult(`Found ${courses.length} courses matching "${query}".`, {
          kind: 'courses',
          courses,
        });
      } catch (err) {
        return errorResult(`Error searching courses: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'get_course',
    {
      title: 'Get Course',
      description:
        'Returns course metadata, planning fields, and module structure. Set includeSectionContent: true to also fetch all section bodies in one call.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the course'),
        includeSectionContent: z
          .boolean()
          .optional()
          .describe('If true, returns full Markdown content for all sections.'),
      },
      _meta: toolMeta('Loading course...', 'Course loaded.'),
    },
    async ({ id, includeSectionContent }) => {
      try {
        const { course, modules, uncategorizedSections } = await dbGetCourse({
          id,
          includeSectionContent,
        });
        return textResult(
          `Course "${course.title}" loaded. It has ${modules.length} modules and ${course.sectionCount} sections.`,
          { kind: 'course_detail', course, modules, uncategorizedSections }
        );
      } catch (err) {
        return errorResult(`Error fetching course: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'get_course_workspace',
    {
      title: 'Get Course Workspace',
      description:
        'Single-call loader for session resume. Returns course metadata, planning (including agentNotes), research notes, and all modules with full section content.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
      },
      _meta: toolMeta('Loading workspace...', 'Workspace loaded.'),
    },
    async ({ courseId }) => {
      try {
        const data = await dbGetCourseWorkspace({ id: courseId });
        return textResult(`Full workspace for "${data.course.title}" loaded.`, {
          kind: 'course_workspace',
          ...data,
        });
      } catch (err) {
        return errorResult(`Error fetching workspace: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'create_course',
    {
      title: 'Create Course',
      description:
        'Use this after researching and planning the course. It creates only the course shell as a draft; then call add_section once per planned section.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        title: z.string().describe('Course title, e.g. "Mastering LangChain with CopilotKit"'),
        description: z
          .string()
          .optional()
          .describe('A 1-3 sentence description of what this course covers and who it is for'),
        difficulty: z
          .enum(['beginner', 'intermediate', 'advanced'])
          .optional()
          .describe('Skill level required. Defaults to "beginner".'),
        estimatedDuration: z
          .string()
          .optional()
          .describe('Human-readable duration, e.g. "2 hours" or "45 minutes"'),
        tags: z
          .array(z.string())
          .optional()
          .describe('Relevant topic tags, e.g. ["langchain", "ai", "react"]'),
      },
      _meta: toolMeta('Creating course...', 'Course created.'),
    },
    async ({ title, description, difficulty, estimatedDuration, tags }) => {
      try {
        const { course } = await dbCreateCourse({
          title,
          description,
          difficulty,
          estimatedDuration,
          tags,
        });
        return textResult(`Created course "${course.title}" (id: ${course.id}).`, {
          success: true,
          course,
        });
      } catch (err) {
        return errorResult(`Error creating course: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'update_course',
    {
      title: 'Update Course',
      description:
        'Use this to revise course metadata such as title, description, difficulty, duration, tags, or draft status.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the course'),
        title: z.string().optional(),
        description: z.string().optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        estimatedDuration: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(['draft', 'published']).optional(),
      },
      _meta: toolMeta('Updating course...', 'Course updated.'),
    },
    async ({ id, title, description, difficulty, estimatedDuration, tags, status }) => {
      try {
        const { course } = await dbUpdateCourse({
          id,
          title,
          description,
          difficulty,
          estimatedDuration,
          tags,
          status,
        });
        return textResult(`Updated course "${course.title}".`, { success: true, course });
      } catch (err) {
        return errorResult(`Error updating course: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'publish_course',
    {
      title: 'Publish Course',
      description:
        'Mark a course as published so it appears ready to use. Call this only after the user asks to publish or confirms the course content is complete.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the course to publish'),
      },
      _meta: toolMeta('Publishing course...', 'Course published.'),
    },
    async ({ id }) => {
      try {
        const { course } = await dbPublishCourse({ id });
        return textResult(`Published course "${course.title}".`, { success: true, course });
      } catch (err) {
        return errorResult(`Error publishing course: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'delete_course',
    {
      title: 'Delete Course',
      description:
        'Soft-delete a course and all its sections from Coursify so they no longer appear in active records.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the course to delete'),
      },
      _meta: toolMeta('Deleting course...', 'Course deleted.'),
    },
    async ({ id }) => {
      try {
        const { deletedId, title } = await dbDeleteCourse({ id });
        return textResult(`Deleted course "${title}" and all its sections and modules.`, {
          success: true,
          deletedId,
        });
      } catch (err) {
        return errorResult(`Error deleting course: ${err.message}`);
      }
    }
  );

  // ── Planning ──────────────────────────────────────────────────────────────

  server.registerTool(
    'save_course_plan',
    {
      title: 'Save Course Plan',
      description:
        'Save the course planning workspace. Use agentNotes to save your internal working state across sessions.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
        targetAudience: z.string().optional(),
        learningObjectives: z.array(z.string()).optional(),
        prerequisites: z.array(z.string()).optional(),
        outcome: z.string().optional(),
        outline: z
          .string()
          .optional()
          .describe('Free-form Markdown outline of planned modules and sections'),
        planningNotes: z.string().optional(),
        agentNotes: z.string().optional().describe('Internal agent state or scratchpad'),
        authoringStatus: z
          .enum(['idea', 'researching', 'planned', 'drafting', 'reviewing', 'ready', 'published'])
          .optional(),
      },
      _meta: toolMeta('Saving course plan...', 'Course plan saved.'),
    },
    async ({ courseId, ...patch }) => {
      try {
        const { course } = await dbSaveCoursePlan({ courseId, ...patch });

        const planFields = {
          targetAudience: !!course.targetAudience,
          learningObjectives: (course.learningObjectives || []).length > 0,
          prerequisites: (course.prerequisites || []).length > 0,
          outcome: !!course.outcome,
          outline: !!course.outline,
        };
        const filled = Object.values(planFields).filter(Boolean).length;
        const missing = Object.entries(planFields)
          .filter(([, v]) => !v)
          .map(([k]) => k);

        const suggestions = [];
        if (!planFields.targetAudience) suggestions.push('Define who this course is for');
        if (!planFields.learningObjectives)
          suggestions.push('Add 3-5 concrete learning objectives');
        if (!planFields.prerequisites) suggestions.push('List prerequisites');
        if (!planFields.outcome) suggestions.push('Add a clear outcome statement');
        if (!planFields.outline)
          suggestions.push('Write a Markdown outline grouping sections into modules');

        let nextStep =
          'Call suggest_modules_from_outline to get a recommended module structure, then create_module for each.';
        if (filled < 3) nextStep = 'Fill the missing plan fields above before structuring modules.';
        else if (course.authoringStatus === 'researching')
          nextStep = 'Set authoringStatus to "planned" and call suggest_modules_from_outline.';

        return textResult(
          `Course plan saved for "${course.title}" (${filled}/5 fields complete).`,
          {
            success: true,
            course,
            planCompleteness: { filled, total: 5, missing },
            suggestions,
            nextStep,
          }
        );
      } catch (err) {
        return errorResult(`Error saving plan: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'suggest_modules_from_outline',
    {
      title: 'Suggest Modules From Outline',
      description:
        'Read-only analyzer for course outline. Use apply_suggested_modules to create them in one call.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
      },
      _meta: toolMeta('Analyzing outline...', 'Module suggestions ready.'),
    },
    async ({ courseId }) => {
      try {
        const { course } = await dbGetCourse({ id: courseId });
        if (!course.outline)
          return errorResult(
            'No outline found. Call save_course_plan first with a Markdown outline.'
          );

        const outline = course.outline.trim();
        const lines = outline.split('\n');
        const sectionTitles = [];
        let currentGroup = '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('## ') && !trimmed.toLowerCase().includes('module')) {
            const title = trimmed.replace(/^##\s+/, '').trim();
            if (title) sectionTitles.push({ title, group: currentGroup });
          } else if (trimmed.startsWith('### ')) {
            const title = trimmed.replace(/^###\s+/, '').trim();
            if (title && title.length < 100) sectionTitles.push({ title, group: currentGroup });
          } else if (trimmed.match(/^#{1,2}\s+(module|phase|part|step)/i)) {
            currentGroup = trimmed.replace(/^#{1,2}\s+/, '').trim();
          }
        }

        if (sectionTitles.length === 0) {
          const paragraphs = outline
            .split(/\n\n+/)
            .map((p) => p.trim())
            .filter(Boolean);
          for (const p of paragraphs) {
            const firstLine = p
              .split('\n')[0]
              .trim()
              .replace(/^[-*]\s+/, '');
            if (firstLine && firstLine.length > 3 && firstLine.length < 120) {
              sectionTitles.push({ title: firstLine, group: '' });
            }
          }
        }

        if (sectionTitles.length === 0)
          return errorResult(
            'Could not parse section titles. Use ## or ### headers for section names.'
          );

        const moduleKeywords = [
          {
            words: ['fundamental', 'basic', 'intro', 'overview', 'setup', 'what', 'why'],
            label: 'Foundations',
          },
          {
            words: ['core', 'main', 'build', 'implement', 'create', 'develop', 'pattern'],
            label: 'Core Concepts',
          },
          {
            words: ['advanced', 'deep', 'optim', 'scale', 'deploy', 'product', 'real'],
            label: 'Advanced & Applied',
          },
          {
            words: ['review', 'summary', 'next', 'future', 'wrap', 'conclusion', 'recap'],
            label: 'Review & Next Steps',
          },
        ];

        function assignModule(title) {
          const lower = title.toLowerCase();
          for (const mk of moduleKeywords) {
            if (mk.words.some((w) => lower.includes(w))) return mk.label;
          }
          return null;
        }

        const moduleMap = {};
        let unassignedBuffer = [];
        for (const s of sectionTitles) {
          const mod = s.group || assignModule(s.title);
          if (mod) {
            if (unassignedBuffer.length > 0) {
              if (!moduleMap['Miscellaneous'])
                moduleMap['Miscellaneous'] = { sections: [], label: 'Miscellaneous' };
              moduleMap['Miscellaneous'].sections.push(...unassignedBuffer);
              unassignedBuffer = [];
            }
            if (!moduleMap[mod]) moduleMap[mod] = { sections: [], label: mod };
            moduleMap[mod].sections.push(s.title);
          } else {
            unassignedBuffer.push(s.title);
          }
        }
        if (unassignedBuffer.length > 0) {
          if (!moduleMap['Miscellaneous'])
            moduleMap['Miscellaneous'] = { sections: [], label: 'Miscellaneous' };
          moduleMap['Miscellaneous'].sections.push(...unassignedBuffer);
        }

        const moduleKeys = Object.keys(moduleMap);
        if (moduleKeys.length > 4) {
          const mergeInto = moduleKeys[2];
          for (const key of moduleKeys.slice(3)) {
            moduleMap[mergeInto].sections.push(...moduleMap[key].sections);
            delete moduleMap[key];
          }
        }

        const suggestions = Object.values(moduleMap).map((m, i) => ({
          order: i,
          title: m.label,
          summary: `Covers: ${m.sections.slice(0, 3).join(', ')}${m.sections.length > 3 ? `, and ${m.sections.length - 3} more` : ''}`,
          learningGoals: m.sections.slice(0, 3).map((s) => `Understand and apply: ${s}`),
          sections: m.sections,
          sectionCount: m.sections.length,
        }));

        return textResult(
          `Suggested ${suggestions.length} modules from ${sectionTitles.length} outline sections.`,
          {
            kind: 'module_suggestions',
            outlineSectionCount: sectionTitles.length,
            suggestedModules: suggestions,
            note: 'Review these suggestions and call create_module once per module you want to keep.',
          }
        );
      } catch (err) {
        return errorResult(`Error analyzing outline: ${err.message}`);
      }
    }
  );

  // ── Modules ───────────────────────────────────────────────────────────────

  server.registerTool(
    'get_module',
    {
      title: 'Get Module',
      description: 'Fetch details for a specific module including its sections.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the module'),
      },
      _meta: toolMeta('Loading module...', 'Module loaded.'),
    },
    async ({ id }) => {
      try {
        const { module, sections } = await dbGetModule({ id });
        return textResult(`Module "${module.title}" has ${sections.length} sections.`, {
          kind: 'module_detail',
          module,
          sections,
        });
      } catch (err) {
        return errorResult(`Error fetching module: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'create_module',
    {
      title: 'Create Module',
      description:
        'Create a module under a course. Call once per planned module after saving the course plan. Then add sections to each module using add_section with the moduleId.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
        title: z.string().describe('Module title, e.g. "Fundamentals" or "Advanced Patterns"'),
        summary: z.string().optional(),
        learningGoals: z.array(z.string()).optional(),
        order: z.number().int().optional(),
      },
      _meta: toolMeta('Creating module...', 'Module created.'),
    },
    async ({ courseId, title, summary, learningGoals, order }) => {
      try {
        const { module } = await dbCreateModule({ courseId, title, summary, learningGoals, order });
        return textResult(`Created module "${module.title}" (id: ${module.id}).`, {
          success: true,
          module,
        });
      } catch (err) {
        return errorResult(`Error creating module: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'update_module',
    {
      title: 'Update Module',
      description: 'Revise a module title, summary, learning goals, order, or status.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the module'),
        title: z.string().optional(),
        summary: z.string().optional(),
        learningGoals: z.array(z.string()).optional(),
        order: z.number().int().optional(),
        status: z.enum(['planned', 'drafting', 'complete', 'needs_review']).optional(),
      },
      _meta: toolMeta('Updating module...', 'Module updated.'),
    },
    async ({ id, title, summary, learningGoals, order, status }) => {
      try {
        const { module } = await dbUpdateModule({
          id,
          title,
          summary,
          learningGoals,
          order,
          status,
        });
        return textResult(`Updated module "${module.title}".`, { success: true, module });
      } catch (err) {
        return errorResult(`Error updating module: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'delete_module',
    {
      title: 'Delete Module',
      description: 'Soft-delete a module from a course so it no longer appears in active records.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the module to delete'),
      },
      _meta: toolMeta('Deleting module...', 'Module deleted.'),
    },
    async ({ id }) => {
      try {
        const { deletedId, title } = await dbDeleteModule({ id });
        return textResult(`Deleted module "${title}".`, { success: true, deletedId });
      } catch (err) {
        return errorResult(`Error deleting module: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'reorder_modules',
    {
      title: 'Reorder Modules',
      description:
        'Set the display order of all modules in a course by providing the full ordered list of module IDs.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
        moduleIds: z
          .array(z.string())
          .describe('All module IDs in the desired order. Every active module should be included.'),
      },
      _meta: toolMeta('Reordering modules...', 'Modules reordered.'),
    },
    async ({ courseId, moduleIds }) => {
      try {
        const { reordered } = await dbReorderModules({ courseId, moduleIds });
        return textResult(`Reordered ${reordered} modules.`, { success: true });
      } catch (err) {
        return errorResult(`Error reordering modules: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'list_course_modules',
    {
      title: 'List Course Modules',
      description: 'List all modules for a course with their section progress.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
      },
      _meta: toolMeta('Loading modules...', 'Modules loaded.'),
    },
    async ({ courseId }) => {
      try {
        const { course, modules, uncategorizedSections } = await dbListCourseModules({ courseId });
        return textResult(`Course "${course.title}" has ${modules.length} modules.`, {
          kind: 'course_modules',
          modules,
          uncategorizedSections,
          authoringStatus: course.authoringStatus || 'idea',
        });
      } catch (err) {
        return errorResult(`Error listing modules: ${err.message}`);
      }
    }
  );

  // ── Sections ──────────────────────────────────────────────────────────────

  server.registerTool(
    'get_section_content',
    {
      title: 'Get Section Content',
      description: 'Retrieve the full Markdown content of a single section by its ID.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the section'),
      },
      _meta: toolMeta('Loading section...', 'Section loaded.'),
    },
    async ({ id }) => {
      try {
        const { section } = await dbGetSectionContent({ id });
        return textResult(`Section "${section.title}" loaded.`, {
          kind: 'section_content',
          section,
        });
      } catch (err) {
        return errorResult(`Error fetching section: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'add_section',
    {
      title: 'Add Section',
      description:
        'Create a single course section. Use set_quiz_questions to manage questions separately.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course to add this section to'),
        title: z.string().describe('Section title'),
        sectionType: z
          .enum(['lesson', 'quiz'])
          .optional()
          .describe('"lesson" = Markdown content. "quiz" = standalone quiz. Defaults to "lesson".'),
        content: z
          .string()
          .optional()
          .describe('Full section content in Markdown. Required for lesson sections.'),
        questions: z
          .array(questionSchema)
          .optional()
          .describe(
            'DEPRECATED: Use set_quiz_questions instead. Quiz questions for this section.'
          ),
        moduleId: z
          .string()
          .optional()
          .describe('MongoDB _id of the module this section belongs to.'),
        order: z
          .number()
          .int()
          .optional()
          .describe('Zero-based position. If omitted, appended at the end.'),
        status: z.enum(['planned', 'draft', 'needs_review', 'complete']).optional(),
        summary: z.string().optional(),
        learningGoals: z.array(z.string()).optional(),
        estimatedDuration: z.string().optional(),
        resources: z.array(resourceSchema).optional(),
      },
      _meta: toolMeta('Adding section...', 'Section added.'),
    },
    async ({
      courseId,
      title,
      sectionType,
      content,
      questions,
      order,
      resources,
      moduleId,
      status,
      summary,
      learningGoals,
      estimatedDuration,
    }) => {
      try {
        const { section } = await dbAddSection({
          courseId,
          title,
          sectionType,
          content,
          questions,
          order,
          resources,
          moduleId,
          status,
          summary,
          learningGoals,
          estimatedDuration,
        });
        return textResult(`Added section "${section.title}" (order: ${section.order}).`, {
          success: true,
          section,
        });
      } catch (err) {
        return errorResult(`Error adding section: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'update_section',
    {
      title: 'Update Section',
      description:
        'Edit an existing section. Use full replacement Markdown for content. Use set_quiz_questions to manage questions. When all sections reach complete, course authoringStatus automatically advances to reviewing.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the section to update'),
        title: z.string().optional(),
        sectionType: z.enum(['lesson', 'quiz']).optional(),
        content: z.string().optional().describe('Full replacement content in Markdown'),
        questions: z
          .array(questionSchema)
          .optional()
          .describe(
            'DEPRECATED: Use set_quiz_questions instead. Full replacement quiz questions array.'
          ),
        summary: z.string().optional(),
        learningGoals: z.array(z.string()).optional(),
        estimatedDuration: z.string().optional(),
        order: z.number().int().optional(),
        status: z.enum(['planned', 'draft', 'needs_review', 'complete']).optional(),
        moduleId: z.string().optional(),
        resources: z.array(resourceSchema).optional(),
      },
      _meta: toolMeta('Updating section...', 'Section updated.'),
    },
    async ({
      id,
      title,
      sectionType,
      content,
      questions,
      summary,
      learningGoals,
      estimatedDuration,
      order,
      status,
      moduleId,
      resources,
    }) => {
      try {
        const { section } = await dbUpdateSection({
          id,
          title,
          sectionType,
          content,
          questions,
          summary,
          learningGoals,
          estimatedDuration,
          order,
          status,
          moduleId,
          resources,
        });
        return textResult(`Updated section "${section.title}".`, { success: true, section });
      } catch (err) {
        return errorResult(`Error updating section: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'add_sections',
    {
      title: 'Add Sections (Batch)',
      description: 'Create multiple sections in one call.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
        sections: z.array(
          z.object({
            title: z.string(),
            moduleId: z.string().optional(),
            sectionType: z.enum(['lesson', 'quiz']).optional(),
            content: z.string().optional(),
            order: z.number().int().optional(),
            status: z.enum(['planned', 'draft', 'needs_review', 'complete']).optional(),
          })
        ),
      },
      _meta: toolMeta('Adding sections...', 'Sections added.'),
    },
    async ({ courseId, sections }) => {
      try {
        const { sections: created } = await dbAddSections({ courseId, sections });
        return textResult(`Added ${created.length} sections.`, { success: true, sections: created });
      } catch (err) {
        return errorResult(`Error adding sections: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'delete_section',
    {
      title: 'Delete Section',
      description: 'Soft-delete a section from a course so it no longer appears in active records.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the section to delete'),
      },
      _meta: toolMeta('Deleting section...', 'Section deleted.'),
    },
    async ({ id }) => {
      try {
        const { deletedId, title } = await dbDeleteSection({ id });
        return textResult(`Deleted section "${title}".`, { success: true, deletedId });
      } catch (err) {
        return errorResult(`Error deleting section: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'delete_sections',
    {
      title: 'Delete Sections (Bulk)',
      description: 'Delete multiple sections in a single call.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        ids: z.array(z.string()).describe('Array of section IDs to delete'),
      },
      _meta: toolMeta('Deleting sections...', 'Sections deleted.'),
    },
    async ({ ids }) => {
      try {
        const { deletedCount } = await dbDeleteSections({ ids });
        return textResult(`Deleted ${deletedCount} sections.`, { success: true, deletedCount });
      } catch (err) {
        return errorResult(`Error deleting sections: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'add_section_resource',
    {
      title: 'Add Section Resource',
      description: 'Append a single resource link to a section.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        sectionId: z.string().describe('MongoDB _id of the section'),
        resource: resourceSchema,
      },
      _meta: toolMeta('Adding resource...', 'Resource added.'),
    },
    async ({ sectionId, resource }) => {
      try {
        const { section } = await dbAddSectionResource({ sectionId, resource });
        return textResult(`Added resource to "${section.title}".`, { success: true, section });
      } catch (err) {
        return errorResult(`Error adding resource: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'reorder_sections',
    {
      title: 'Reorder Sections',
      description:
        'Set the display order of sections. Optionally provide moduleId to reorder within that module only.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
        sectionIds: z.array(z.string()).describe('Ordered section IDs.'),
        moduleId: z.string().optional().describe('Reorder within this module only.'),
      },
      _meta: toolMeta('Reordering sections...', 'Sections reordered.'),
    },
    async ({ courseId, sectionIds, moduleId }) => {
      try {
        const { reordered } = await dbReorderSections({ courseId, sectionIds, moduleId });
        return textResult(`Reordered ${reordered} sections.`, { success: true });
      } catch (err) {
        return errorResult(`Error reordering sections: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'set_quiz_questions',
    {
      title: 'Set Quiz Questions',
      description:
        'Set or fully replace the quiz questions for a section. Works for standalone quiz sections and lesson sections with an embedded quiz. Provide a complete replacement array — any existing questions are overwritten.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the section'),
        questions: z
          .array(questionSchema)
          .describe('Full replacement list of quiz questions. Pass [] to remove all questions.'),
      },
      _meta: toolMeta('Saving quiz questions...', 'Quiz questions saved.'),
    },
    async ({ id, questions }) => {
      try {
        const { section } = await dbSetQuizQuestions({ id, questions });
        return textResult(
          `Set ${questions.length} quiz question(s) on section "${section.title}".`,
          { success: true, section }
        );
      } catch (err) {
        return errorResult(`Error setting quiz questions: ${err.message}`);
      }
    }
  );

  // ── Research ──────────────────────────────────────────────────────────────

  server.registerTool(
    'get_research_notes',
    {
      title: 'Get Research Notes',
      description: 'Retrieve all research findings for a course.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
      },
      _meta: toolMeta('Loading research notes...', 'Research notes loaded.'),
    },
    async ({ courseId }) => {
      try {
        const notes = await dbGetResearchNotes({ courseId });
        return textResult(`Found ${notes.length} research notes.`, {
          kind: 'research_notes',
          notes,
        });
      } catch (err) {
        return errorResult(`Error fetching research notes: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'add_research_note',
    {
      title: 'Add Research Note',
      description: 'Persist a research finding, source note, or key takeaway for a course.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
        title: z.string().describe('Short title for this research note'),
        summary: z.string().describe('Key takeaway or finding'),
        sourceUrl: z.string().optional(),
        sourceType: z.enum(['web', 'paper', 'book', 'video', 'other']).optional(),
        notes: z.string().optional().describe('Detailed notes or quotes from the source'),
      },
      _meta: toolMeta('Saving research note...', 'Research note saved.'),
    },
    async ({ courseId, title, summary, sourceUrl, sourceType, notes }) => {
      try {
        const { note } = await dbAddResearchNote({
          courseId,
          title,
          summary,
          sourceUrl,
          sourceType,
          notes,
        });
        return textResult(`Research note "${note.title}" saved.`, { success: true, note });
      } catch (err) {
        return errorResult(`Error saving research note: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'research_findings',
    {
      title: 'Save Research Findings (Batch)',
      description:
        'Save multiple research findings for a course in a single call. Prefer this over calling add_research_note repeatedly. Max 20 findings per call.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
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
          .max(20),
      },
      _meta: toolMeta('Saving research findings...', 'Research findings saved.'),
    },
    async ({ courseId, findings }) => {
      try {
        const { count } = await dbResearchFindings({ courseId, findings });
        return textResult(`Saved ${count} research finding(s).`, { success: true, count });
      } catch (err) {
        return errorResult(`Error saving research findings: ${err.message}`);
      }
    }
  );

  // ── Progress ──────────────────────────────────────────────────────────────

  server.registerTool(
    'apply_suggested_modules',
    {
      title: 'Apply Suggested Modules',
      description:
        'Runs suggestions from outline and creates all modules and sections in one call.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
      },
      _meta: toolMeta('Applying modules...', 'Modules applied.'),
    },
    async ({ courseId }) => {
      try {
        const { modulesCreated, moduleIds } = await dbApplySuggestedModules({ courseId });
        return textResult(`Created ${modulesCreated} modules from outline.`, {
          success: true,
          modulesCreated,
          moduleIds,
        });
      } catch (err) {
        return errorResult(`Error applying modules: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'get_course_progress',
    {
      title: 'Get Course Progress',
      description:
        'Return a summary of course plan completeness, module statuses, section statuses, and a recommended next action.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
      },
      _meta: toolMeta('Checking progress...', 'Progress report ready.'),
    },
    async ({ courseId }) => {
      try {
        const { course, modules } = await dbGetCourse({ id: courseId });

        const planFields = {
          targetAudience: !!course.targetAudience,
          learningObjectives: (course.learningObjectives || []).length > 0,
          prerequisites: (course.prerequisites || []).length > 0,
          outcome: !!course.outcome,
          outline: !!course.outline,
        };
        const planComplete = Object.values(planFields).filter(Boolean).length;

        const allSections = modules.flatMap((m) => m.sections || []);
        const sectionsByStatus = allSections.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {});
        const incompleteSections = allSections.filter((s) => s.status !== 'complete').length;
        const incompleteModules = modules.filter((m) => m.status !== 'complete').length;

        let nextAction = 'No action needed.';
        if (planComplete < 3)
          nextAction =
            'Call save_course_plan to define the target audience, objectives, and outline.';
        else if (modules.length === 0)
          nextAction = 'Call create_module to set up the course structure.';
        else if (incompleteSections > 0)
          nextAction = `Write the remaining ${incompleteSections} section(s) with add_section.`;
        else if (incompleteModules > 0)
          nextAction = 'Update module statuses to "complete" using update_module.';
        else nextAction = 'Course looks complete. Call publish_course when the user is ready.';

        return textResult(
          `Progress for "${course.title}": ${planComplete}/5 plan fields, ${modules.length} modules, ${allSections.length} sections.`,
          {
            kind: 'course_progress',
            authoringStatus: course.authoringStatus || 'idea',
            planCompleteness: { filled: planComplete, total: 5, fields: planFields },
            researchNotesCount: (course.researchNotes || []).length,
            moduleCount: modules.length,
            sectionCount: allSections.length,
            sectionsByStatus,
            incompleteModules,
            nextAction,
          }
        );
      } catch (err) {
        return errorResult(`Error getting progress: ${err.message}`);
      }
    }
  );
}
