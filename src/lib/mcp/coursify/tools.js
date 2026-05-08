import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifySection from '@/models/CoursifySection';
import CoursifyModule from '@/models/CoursifyModule';
import {
  COURSE_AUTHORING_GUIDE,
  READ_ONLY_ANNOTATIONS,
  MUTATION_ANNOTATIONS,
  DESTRUCTIVE_ANNOTATIONS,
} from './constants.js';
import {
  textResult,
  errorResult,
  toolMeta,
  normalizeCourse,
  normalizeSection,
  normalizeModule,
} from './utils.js';
import { generateCourseThumbnail } from '@/lib/coursify/thumbnailGen.js';
import { generateUniqueSlug } from '@/lib/coursify/slugify.js';

const resourceSchema = z.object({
  type: z.enum(['video', 'article', 'doc', 'other']),
  url: z.string(),
  title: z.string(),
});

function cleanPatch(patch) {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined && value !== null)
  );
}

function createThumbnailInBackground(course) {
  generateCourseThumbnail(course._id.toString(), course.title, course.description).catch(() => {});
}

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

  server.registerTool(
    'list_courses',
    {
      title: 'List Courses',
      description:
        'Use this first before creating a course. Retrieve all Coursify courses so you can avoid duplicate topics and decide whether to create a new course or update an existing draft.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        status: z
          .enum(['draft', 'published', 'all'])
          .optional()
          .describe('Filter by status. Defaults to "all".'),
      },
      _meta: toolMeta('Fetching courses...', 'Courses loaded.'),
    },
    async ({ status } = {}) => {
      try {
        await dbConnect();
        const query = { deletedAt: null };
        if (status && status !== 'all') query.status = status;

        const courses = await CoursifyCourse.find(query).sort({ updatedAt: -1 }).lean();
        const courseIds = courses.map((course) => course._id);

        const sections = await CoursifySection.find({
          courseId: { $in: courseIds },
          deletedAt: null,
        })
          .select('courseId')
          .lean();

        const countMap = {};
        for (const section of sections) {
          const id = section.courseId.toString();
          countMap[id] = (countMap[id] || 0) + 1;
        }

        const result = courses.map((course) =>
          normalizeCourse({
            ...course,
            sectionCount: countMap[course._id.toString()] || 0,
          })
        );

        return textResult(`Found ${result.length} courses in Coursify.`, {
          kind: 'courses',
          courses: result,
        });
      } catch (err) {
        return errorResult(`Error fetching courses: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'get_course',
    {
      title: 'Get Course',
      description:
        'Use this before revising an existing course. Retrieve a single course by ID, including all planning fields (targetAudience, learningObjectives, prerequisites, outcome, outline, researchNotes, authoringStatus), all modules in order, and all sections with their full Markdown content.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the course'),
      },
      _meta: toolMeta('Loading course...', 'Course loaded.'),
    },
    async ({ id }) => {
      try {
        await dbConnect();
        const course = await CoursifyCourse.findOne({ _id: id, deletedAt: null }).lean();
        if (!course) return errorResult('Course not found.');

        const [modules, sections] = await Promise.all([
          CoursifyModule.find({ courseId: id, deletedAt: null }).sort({ order: 1 }).lean(),
          CoursifySection.find({ courseId: id, deletedAt: null }).sort({ order: 1 }).lean(),
        ]);

        return textResult(
          `Course "${course.title}" has ${modules.length} modules and ${sections.length} sections.`,
          {
            kind: 'course_detail',
            course: normalizeCourse({ ...course, sectionCount: sections.length }),
            modules: modules.map(normalizeModule),
            sections: sections.map(normalizeSection),
          }
        );
      } catch (err) {
        return errorResult(`Error fetching course: ${err.message}`);
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
        await dbConnect();
        const slug = await generateUniqueSlug(title.trim());
        const course = await CoursifyCourse.create({
          title: title.trim(),
          slug,
          description: description?.trim() || '',
          difficulty: difficulty || 'beginner',
          estimatedDuration: estimatedDuration || '',
          tags: tags || [],
          thumbnailGenerating: true,
        });

        createThumbnailInBackground(course);

        return textResult(`Created course "${course.title}" (id: ${course._id}).`, {
          success: true,
          course: normalizeCourse({ ...course.toObject(), sectionCount: 0 }),
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
      },
      _meta: toolMeta('Updating course...', 'Course updated.'),
    },
    async ({ id, ...patch }) => {
      try {
        await dbConnect();
        const clean = cleanPatch(patch);
        if (clean.title) {
          clean.slug = await generateUniqueSlug(clean.title, id);
        }
        const course = await CoursifyCourse.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: clean, $inc: { syncVersion: 1 } },
          { new: true }
        ).lean();

        if (!course) return errorResult('Course not found.');
        return textResult(`Updated course "${course.title}".`, {
          success: true,
          course: normalizeCourse(course),
        });
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
        await dbConnect();
        const course = await CoursifyCourse.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: { status: 'published' }, $inc: { syncVersion: 1 } },
          { new: true }
        ).lean();

        if (!course) return errorResult('Course not found.');
        return textResult(`Published course "${course.title}".`, {
          success: true,
          course: normalizeCourse(course),
        });
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
        await dbConnect();
        const deletedAt = new Date();
        const course = await CoursifyCourse.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: { deletedAt }, $inc: { syncVersion: 1 } }
        ).lean();

        if (!course) return errorResult('Course not found.');
        await Promise.all([
          CoursifySection.updateMany(
            { courseId: id, deletedAt: null },
            { $set: { deletedAt }, $inc: { syncVersion: 1 } }
          ),
          CoursifyModule.updateMany(
            { courseId: id, deletedAt: null },
            { $set: { deletedAt }, $inc: { syncVersion: 1 } }
          ),
        ]);

        return textResult(`Deleted course "${course.title}" and all its sections and modules.`, {
          success: true,
          deletedId: id,
        });
      } catch (err) {
        return errorResult(`Error deleting course: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'add_section',
    {
      title: 'Add Section',
      description:
        'Use this once per planned course section after research and outlining. Specify the moduleId to group it correctly. Write full Markdown content that follows the authoring guide: learning goals, explanation, walkthrough, examples, practice, common mistakes, and recap.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course to add this section to'),
        title: z.string().describe('Section title, e.g. "Introduction to LangChain Runnables"'),
        content: z
          .string()
          .describe(
            'Full section content in Markdown. Include headers, bullet points, code blocks, and examples. Aim for comprehensive coverage of the topic.'
          ),
        moduleId: z
          .string()
          .optional()
          .describe(
            'MongoDB _id of the module this section belongs to. Strongly recommended after calling create_module.'
          ),
        order: z
          .number()
          .int()
          .optional()
          .describe('Zero-based position. If omitted, appended at the end.'),
        status: z
          .enum(['planned', 'draft', 'needs_review', 'complete'])
          .optional()
          .describe('Section authoring status. Defaults to "draft".'),
        resources: z.array(resourceSchema).optional().describe('Optional supplementary resources.'),
      },
      _meta: toolMeta('Adding section...', 'Section added.'),
    },
    async ({ courseId, title, content, order, resources, moduleId, status }) => {
      try {
        await dbConnect();
        const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
        if (!course) return errorResult('Course not found.');

        const last = await CoursifySection.findOne({ courseId, deletedAt: null })
          .sort({ order: -1 })
          .lean();
        const resolvedOrder = order !== undefined ? order : last ? last.order + 1 : 0;

        const section = await CoursifySection.create({
          courseId,
          title: title.trim(),
          content: content || '',
          order: resolvedOrder,
          resources: resources || [],
          moduleId: moduleId || null,
          status: status || 'draft',
        });
        await CoursifyCourse.updateOne(
          { _id: courseId, deletedAt: null },
          { $inc: { syncVersion: 1 } }
        );

        return textResult(
          `Added section "${section.title}" to course "${course.title}" (order: ${resolvedOrder}).`,
          { success: true, section: normalizeSection(section.toObject()) }
        );
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
        'Edit the title, content, order, or resources of an existing section. Use full replacement Markdown when changing content.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the section to update'),
        title: z.string().optional(),
        content: z.string().optional().describe('Full replacement content in Markdown'),
        order: z.number().int().optional(),
        resources: z.array(resourceSchema).optional(),
      },
      _meta: toolMeta('Updating section...', 'Section updated.'),
    },
    async ({ id, ...patch }) => {
      try {
        await dbConnect();
        const section = await CoursifySection.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: cleanPatch(patch), $inc: { syncVersion: 1 } },
          { new: true }
        ).lean();

        if (!section) return errorResult('Section not found.');
        await CoursifyCourse.updateOne(
          { _id: section.courseId, deletedAt: null },
          { $inc: { syncVersion: 1 } }
        );
        return textResult(`Updated section "${section.title}".`, {
          success: true,
          section: normalizeSection(section),
        });
      } catch (err) {
        return errorResult(`Error updating section: ${err.message}`);
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
        await dbConnect();
        const section = await CoursifySection.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
        ).lean();

        if (!section) return errorResult('Section not found.');
        await CoursifyCourse.updateOne(
          { _id: section.courseId, deletedAt: null },
          { $inc: { syncVersion: 1 } }
        );
        return textResult(`Deleted section "${section.title}".`, {
          success: true,
          deletedId: id,
        });
      } catch (err) {
        return errorResult(`Error deleting section: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'reorder_sections',
    {
      title: 'Reorder Sections',
      description:
        'Set the display order of all sections in a course by providing the full ordered list of section IDs.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
        sectionIds: z
          .array(z.string())
          .describe(
            'All section IDs in the desired order, from first to last. Every active section should be included.'
          ),
      },
      _meta: toolMeta('Reordering sections...', 'Sections reordered.'),
    },
    async ({ courseId, sectionIds }) => {
      try {
        await dbConnect();
        await Promise.all(
          sectionIds.map((id, index) =>
            CoursifySection.updateOne(
              { _id: id, courseId, deletedAt: null },
              { $set: { order: index }, $inc: { syncVersion: 1 } }
            )
          )
        );
        await CoursifyCourse.updateOne(
          { _id: courseId, deletedAt: null },
          { $inc: { syncVersion: 1 } }
        );

        return textResult(`Reordered ${sectionIds.length} sections.`, { success: true });
      } catch (err) {
        return errorResult(`Error reordering sections: ${err.message}`);
      }
    }
  );

  // ── Planning tools ────────────────────────────────────────────

  server.registerTool(
    'save_course_plan',
    {
      title: 'Save Course Plan',
      description:
        'Save the course planning workspace: target audience, learning objectives, prerequisites, outcome, outline (Markdown), planning notes, and authoringStatus. Call this after research and before creating modules or sections.',
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
        authoringStatus: z
          .enum(['idea', 'researching', 'planned', 'drafting', 'reviewing', 'ready'])
          .optional(),
      },
      _meta: toolMeta('Saving course plan...', 'Course plan saved.'),
    },
    async ({ courseId, ...patch }) => {
      try {
        await dbConnect();
        const clean = Object.fromEntries(
          Object.entries(patch).filter(([, v]) => v !== undefined && v !== null)
        );
        const course = await CoursifyCourse.findOneAndUpdate(
          { _id: courseId, deletedAt: null },
          { $set: clean, $inc: { syncVersion: 1 } },
          { new: true }
        ).lean();
        if (!course) return errorResult('Course not found.');
        return textResult(`Course plan saved for "${course.title}".`, {
          success: true,
          course: normalizeCourse(course),
        });
      } catch (err) {
        return errorResult(`Error saving plan: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'add_research_note',
    {
      title: 'Add Research Note',
      description:
        'Persist a research finding, source note, or key takeaway for a course. Call during the research phase to build context that survives across sessions.',
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
        await dbConnect();
        const note = {
          title: title.trim(),
          summary: summary.trim(),
          sourceUrl: sourceUrl || '',
          sourceType: sourceType || 'other',
          notes: notes || '',
        };
        const course = await CoursifyCourse.findOneAndUpdate(
          { _id: courseId, deletedAt: null },
          { $push: { researchNotes: note }, $inc: { syncVersion: 1 } },
          { new: true }
        ).lean();
        if (!course) return errorResult('Course not found.');
        const saved = course.researchNotes[course.researchNotes.length - 1];
        return textResult(`Research note "${saved.title}" saved.`, {
          success: true,
          note: { id: saved._id?.toString(), ...saved },
        });
      } catch (err) {
        return errorResult(`Error saving research note: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'list_course_modules',
    {
      title: 'List Course Modules',
      description:
        'List all modules for a course with their section progress. Use to review the course structure and identify incomplete modules or sections before publishing.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
      },
      _meta: toolMeta('Loading modules...', 'Modules loaded.'),
    },
    async ({ courseId }) => {
      try {
        await dbConnect();
        const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
        if (!course) return errorResult('Course not found.');

        const modules = await CoursifyModule.find({ courseId, deletedAt: null })
          .sort({ order: 1 })
          .lean();

        const sections = await CoursifySection.find({ courseId, deletedAt: null })
          .select('moduleId title status order')
          .sort({ order: 1 })
          .lean();

        const sectionsByModule = {};
        const unassigned = [];
        for (const s of sections) {
          const mid = s.moduleId?.toString();
          if (mid) {
            if (!sectionsByModule[mid]) sectionsByModule[mid] = [];
            sectionsByModule[mid].push({ id: s._id.toString(), title: s.title, status: s.status });
          } else {
            unassigned.push({ id: s._id.toString(), title: s.title, status: s.status });
          }
        }

        const result = modules.map((m) => ({
          ...normalizeModule({
            ...m,
            sectionCount: (sectionsByModule[m._id.toString()] || []).length,
          }),
          sections: sectionsByModule[m._id.toString()] || [],
        }));

        return textResult(
          `Course "${course.title}" has ${modules.length} modules and ${sections.length} sections.`,
          {
            kind: 'course_modules',
            modules: result,
            uncategorizedSections: unassigned,
            authoringStatus: course.authoringStatus || 'idea',
          }
        );
      } catch (err) {
        return errorResult(`Error listing modules: ${err.message}`);
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
        await dbConnect();
        const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
        if (!course) return errorResult('Course not found.');

        let resolvedOrder = order;
        if (resolvedOrder === undefined) {
          const last = await CoursifyModule.findOne({ courseId, deletedAt: null })
            .sort({ order: -1 })
            .lean();
          resolvedOrder = last ? last.order + 1 : 0;
        }

        const module = await CoursifyModule.create({
          courseId,
          title: title.trim(),
          summary: summary || '',
          learningGoals: learningGoals || [],
          order: resolvedOrder,
        });
        await CoursifyCourse.updateOne(
          { _id: courseId, deletedAt: null },
          { $inc: { syncVersion: 1 } }
        );

        return textResult(`Created module "${module.title}" (id: ${module._id}).`, {
          success: true,
          module: normalizeModule(module.toObject()),
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
    async ({ id, ...patch }) => {
      try {
        await dbConnect();
        const clean = Object.fromEntries(
          Object.entries(patch).filter(([, v]) => v !== undefined && v !== null)
        );
        const module = await CoursifyModule.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: clean, $inc: { syncVersion: 1 } },
          { new: true }
        ).lean();
        if (!module) return errorResult('Module not found.');
        await CoursifyCourse.updateOne(
          { _id: module.courseId, deletedAt: null },
          { $inc: { syncVersion: 1 } }
        );
        return textResult(`Updated module "${module.title}".`, {
          success: true,
          module: normalizeModule(module),
        });
      } catch (err) {
        return errorResult(`Error updating module: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'get_course_progress',
    {
      title: 'Get Course Progress',
      description:
        'Return a summary of course plan completeness, module statuses, section statuses, and a recommended next action. Use to review what is left before publishing.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
      },
      _meta: toolMeta('Checking progress...', 'Progress report ready.'),
    },
    async ({ courseId }) => {
      try {
        await dbConnect();
        const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
        if (!course) return errorResult('Course not found.');

        const [modules, sections] = await Promise.all([
          CoursifyModule.find({ courseId, deletedAt: null }).sort({ order: 1 }).lean(),
          CoursifySection.find({ courseId, deletedAt: null })
            .select('moduleId title status order')
            .sort({ order: 1 })
            .lean(),
        ]);

        const planFields = {
          targetAudience: !!course.targetAudience,
          learningObjectives: (course.learningObjectives || []).length > 0,
          prerequisites: (course.prerequisites || []).length > 0,
          outcome: !!course.outcome,
          outline: !!course.outline,
        };
        const planComplete = Object.values(planFields).filter(Boolean).length;

        const sectionsByStatus = sections.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {});
        const unassigned = sections.filter((s) => !s.moduleId).length;
        const incompleteSections = sections.filter((s) => s.status !== 'complete').length;
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
          `Progress for "${course.title}": ${planComplete}/5 plan fields, ${modules.length} modules, ${sections.length} sections.`,
          {
            kind: 'course_progress',
            authoringStatus: course.authoringStatus || 'idea',
            planCompleteness: { filled: planComplete, total: 5, fields: planFields },
            researchNotesCount: (course.researchNotes || []).length,
            moduleCount: modules.length,
            sectionCount: sections.length,
            sectionsByStatus,
            unassignedSections: unassigned,
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
