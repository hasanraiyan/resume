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
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
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
        await dbConnect();
        const module = await CoursifyModule.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
        ).lean();

        if (!module) return errorResult('Module not found.');
        // Unassign sections from this module (don't delete them — they become Uncategorized)
        await CoursifySection.updateMany(
          { moduleId: id, deletedAt: null },
          { $set: { moduleId: null }, $inc: { syncVersion: 1 } }
        );

        await CoursifyCourse.updateOne(
          { _id: module.courseId, deletedAt: null },
          { $inc: { syncVersion: 1 } }
        );
        return textResult(`Deleted module "${module.title}".`, {
          success: true,
          deletedId: id,
        });
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
          .describe(
            'All module IDs in the desired order, from first to last. Every active module should be included.'
          ),
      },
      _meta: toolMeta('Reordering modules...', 'Modules reordered.'),
    },
    async ({ courseId, moduleIds }) => {
      try {
        await dbConnect();
        if (!moduleIds.length) return errorResult('moduleIds must not be empty.');

        const results = await Promise.all(
          moduleIds.map((id, index) =>
            CoursifyModule.updateOne(
              { _id: id, courseId, deletedAt: null },
              { $set: { order: index }, $inc: { syncVersion: 1 } }
            )
          )
        );
        const matched = results.reduce((sum, r) => sum + r.matchedCount, 0);
        if (matched < moduleIds.length) {
          return errorResult(
            `Only ${matched}/${moduleIds.length} modules found. Some IDs may be invalid or belong to a different course.`
          );
        }
        await CoursifyCourse.updateOne(
          { _id: courseId, deletedAt: null },
          { $inc: { syncVersion: 1 } }
        );

        return textResult(`Reordered ${moduleIds.length} modules.`, { success: true });
      } catch (err) {
        return errorResult(`Error reordering modules: ${err.message}`);
      }
    }
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
        'Use this before revising an existing course. Returns course metadata, planning fields, modules, and sections grouped by module — but only section titles, summaries, and statuses (NOT full content). Call get_section_content when you need the full Markdown body of a specific section.',
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
          CoursifySection.find({ courseId: id, deletedAt: null })
            .select('moduleId title summary status order learningGoals estimatedDuration resources')
            .sort({ order: 1 })
            .lean(),
        ]);

        // Group sections by module
        const sectionsByModule = {};
        const unassigned = [];
        for (const s of sections) {
          const mid = s.moduleId?.toString();
          const sectionMeta = {
            id: s._id.toString(),
            title: s.title,
            summary: s.summary || '',
            status: s.status || 'draft',
            order: s.order ?? 0,
            learningGoals: s.learningGoals || [],
            estimatedDuration: s.estimatedDuration || '',
            resources: s.resources || [],
          };
          if (mid) {
            if (!sectionsByModule[mid]) sectionsByModule[mid] = [];
            sectionsByModule[mid].push(sectionMeta);
          } else {
            unassigned.push(sectionMeta);
          }
        }

        const modulesWithSections = modules.map((m) => ({
          ...normalizeModule(m),
          sections: sectionsByModule[m._id.toString()] || [],
        }));

        return textResult(
          `Course "${course.title}" has ${modules.length} modules and ${sections.length} sections. Use get_section_content to read or edit a section's full Markdown body.`,
          {
            kind: 'course_detail',
            course: normalizeCourse({ ...course, sectionCount: sections.length }),
            modules: modulesWithSections,
            uncategorizedSections: unassigned,
          }
        );
      } catch (err) {
        return errorResult(`Error fetching course: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'get_section_content',
    {
      title: 'Get Section Content',
      description:
        'Retrieve the full Markdown content of a single section by its ID. Use this after get_course or list_course_modules to read the body of a section you want to revise or review.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the section'),
      },
      _meta: toolMeta('Loading section...', 'Section loaded.'),
    },
    async ({ id }) => {
      try {
        await dbConnect();
        const section = await CoursifySection.findOne({ _id: id, deletedAt: null }).lean();
        if (!section) return errorResult('Section not found.');

        const moduleTitle = section.moduleId
          ? (await CoursifyModule.findOne({ _id: section.moduleId, deletedAt: null }).lean())
              ?.title || ''
          : '';

        return textResult(`Section "${section.title}" loaded.`, {
          kind: 'section_content',
          section: {
            id: section._id.toString(),
            courseId: section.courseId.toString(),
            moduleId: section.moduleId?.toString() || null,
            moduleTitle,
            title: section.title,
            content: section.content || '',
            summary: section.summary || '',
            status: section.status || 'draft',
            order: section.order ?? 0,
            learningGoals: section.learningGoals || [],
            estimatedDuration: section.estimatedDuration || '',
            resources: section.resources || [],
          },
        });
      } catch (err) {
        return errorResult(`Error fetching section: ${err.message}`);
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
        status: z.enum(['draft', 'published']).optional(),
      },
      _meta: toolMeta('Updating course...', 'Course updated.'),
    },
    async ({ id, title, description, difficulty, estimatedDuration, tags, status }) => {
      try {
        await dbConnect();
        const clean = cleanPatch({
          title,
          description,
          difficulty,
          estimatedDuration,
          tags,
          status,
        });
        if (clean.title) {
          clean.slug = await generateUniqueSlug(clean.title, id);
        }
        // Mirror publish_course side effects so agents don't produce inconsistent state
        if (clean.status === 'published') {
          clean.authoringStatus = 'published';
        } else if (clean.status === 'draft') {
          clean.authoringStatus = undefined;
        }
        const course = await CoursifyCourse.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: clean, $inc: { syncVersion: 1 } },
          { new: true }
        ).lean();

        if (!course) return errorResult('Course not found.');
        const sectionCount = await CoursifySection.countDocuments({
          courseId: id,
          deletedAt: null,
        });
        return textResult(`Updated course "${course.title}".`, {
          success: true,
          course: normalizeCourse({ ...course, sectionCount }),
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
          { $set: { status: 'published', authoringStatus: 'published' }, $inc: { syncVersion: 1 } },
          { new: true }
        ).lean();

        if (!course) return errorResult('Course not found.');
        const sectionCount = await CoursifySection.countDocuments({
          courseId: id,
          deletedAt: null,
        });
        return textResult(`Published course "${course.title}".`, {
          success: true,
          course: normalizeCourse({ ...course, sectionCount }),
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
        summary: z.string().optional().describe('Brief summary of the section.'),
        learningGoals: z
          .array(z.string())
          .optional()
          .describe('Key learning objectives for this section.'),
        estimatedDuration: z
          .string()
          .optional()
          .describe('Estimated time to complete, e.g. "15 mins".'),
        resources: z.array(resourceSchema).optional().describe('Optional supplementary resources.'),
      },
      _meta: toolMeta('Adding section...', 'Section added.'),
    },
    async ({
      courseId,
      title,
      content,
      order,
      resources,
      moduleId,
      status,
      summary,
      learningGoals,
      estimatedDuration,
    }) => {
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
          summary: summary || '',
          learningGoals: learningGoals || [],
          estimatedDuration: estimatedDuration || '',
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
      content,
      summary,
      learningGoals,
      estimatedDuration,
      order,
      status,
      moduleId,
      resources,
    }) => {
      try {
        await dbConnect();
        const clean = cleanPatch({
          title,
          content,
          summary,
          learningGoals,
          estimatedDuration,
          order,
          status,
          moduleId,
          resources,
        });
        const section = await CoursifySection.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: clean, $inc: { syncVersion: 1 } },
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
        if (!sectionIds.length) return errorResult('sectionIds must not be empty.');

        const results = await Promise.all(
          sectionIds.map((id, index) =>
            CoursifySection.updateOne(
              { _id: id, courseId, deletedAt: null },
              { $set: { order: index }, $inc: { syncVersion: 1 } }
            )
          )
        );
        const matched = results.reduce((sum, r) => sum + r.matchedCount, 0);
        if (matched < sectionIds.length) {
          return errorResult(
            `Only ${matched}/${sectionIds.length} sections found. Some IDs may be invalid or belong to a different course.`
          );
        }
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
          .enum(['idea', 'researching', 'planned', 'drafting', 'reviewing', 'ready', 'published'])
          .optional(),
      },
      _meta: toolMeta('Saving course plan...', 'Course plan saved.'),
    },
    async ({ courseId, ...patch }) => {
      try {
        await dbConnect();
        const clean = cleanPatch(patch);
        const course = await CoursifyCourse.findOneAndUpdate(
          { _id: courseId, deletedAt: null },
          { $set: clean, $inc: { syncVersion: 1 } },
          { new: true }
        ).lean();
        if (!course) return errorResult('Course not found.');
        const sectionCount = await CoursifySection.countDocuments({
          courseId,
          deletedAt: null,
        });

        // Compute plan completeness
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

        // Generate suggestions for missing fields
        const suggestions = [];
        if (!planFields.targetAudience)
          suggestions.push(
            'Define who this course is for (e.g. "Developers with basic React experience who want to build full-stack apps")'
          );
        if (!planFields.learningObjectives)
          suggestions.push(
            'Add 3-5 concrete learning objectives (what the learner can DO after completing this course)'
          );
        if (!planFields.prerequisites)
          suggestions.push(
            'List prerequisites (even "None — this is a beginner course" is useful)'
          );
        if (!planFields.outcome)
          suggestions.push(
            'Add a clear outcome statement (e.g. "By the end, learners will be able to build X from scratch")'
          );
        if (!planFields.outline)
          suggestions.push(
            'Write a Markdown outline grouping planned sections into logical modules'
          );

        // Determine next step
        let nextStep =
          'Call suggest_modules_from_outline to get a recommended module structure, then create_module for each.';
        if (filled < 3) nextStep = 'Fill the missing plan fields above before structuring modules.';
        else if (course.authoringStatus === 'researching')
          nextStep = 'Set authoringStatus to "planned" and call suggest_modules_from_outline.';

        return textResult(
          `Course plan saved for "${course.title}" (${filled}/5 fields complete).`,
          {
            success: true,
            course: normalizeCourse({ ...course, sectionCount }),
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
        'Read-only. Analyzes the saved course outline and returns a suggested module structure — titles, summaries, learning goals, and which outline sections belong to each module. Does NOT create modules; review the suggestions then call create_module for each you want.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
      },
      _meta: toolMeta('Analyzing outline...', 'Module suggestions ready.'),
    },
    async ({ courseId }) => {
      try {
        await dbConnect();
        const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
        if (!course) return errorResult('Course not found.');
        if (!course.outline)
          return errorResult(
            'No outline found. Call save_course_plan first with a Markdown outline of planned modules and sections.'
          );

        const outline = course.outline.trim();
        const lines = outline.split('\n');

        // Extract section titles from the outline (## headers or bullet items that look like section titles)
        const sectionTitles = [];
        let currentGroup = '';
        for (const line of lines) {
          const trimmed = line.trim();
          // Match ## headers as section titles
          if (trimmed.startsWith('## ') && !trimmed.toLowerCase().includes('module')) {
            const title = trimmed.replace(/^##\s+/, '').trim();
            if (title) sectionTitles.push({ title, group: currentGroup });
          }
          // Match ### headers as section titles
          else if (trimmed.startsWith('### ')) {
            const title = trimmed.replace(/^###\s+/, '').trim();
            if (title && title.length < 100) sectionTitles.push({ title, group: currentGroup });
          }
          // Track module/group context from headers
          else if (trimmed.match(/^#{1,2}\s+(module|phase|part|step)/i)) {
            currentGroup = trimmed.replace(/^#{1,2}\s+/, '').trim();
          }
        }

        // If no structured sections found, fall back to splitting by blank-line paragraphs
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
            'Could not parse any section titles from the outline. Make sure it uses ## or ### headers for section names.'
          );

        // Semantic module grouping
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

        // Group sections into modules, merging consecutive unassigned sections
        const moduleMap = {};
        let unassignedBuffer = [];
        for (const s of sectionTitles) {
          const mod = s.group || assignModule(s.title);
          if (mod) {
            // Flush any buffered unassigned sections into a "Misc" module first
            if (unassignedBuffer.length > 0) {
              const key = 'Miscellaneous';
              if (!moduleMap[key]) moduleMap[key] = { sections: [], label: key };
              moduleMap[key].sections.push(...unassignedBuffer);
              unassignedBuffer = [];
            }
            if (!moduleMap[mod]) moduleMap[mod] = { sections: [], label: mod };
            moduleMap[mod].sections.push(s.title);
          } else {
            unassignedBuffer.push(s.title);
          }
        }
        // Flush remaining unassigned
        if (unassignedBuffer.length > 0) {
          const key = 'Miscellaneous';
          if (!moduleMap[key]) moduleMap[key] = { sections: [], label: key };
          moduleMap[key].sections.push(...unassignedBuffer);
        }

        // Cap at 4 modules — merge excess into the last one
        const moduleKeys = Object.keys(moduleMap);
        if (moduleKeys.length > 4) {
          const keep = moduleKeys.slice(0, 3);
          const mergeInto = keep[keep.length - 1];
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
    'research_findings',
    {
      title: 'Save Research Findings (Batch)',
      description:
        'Save multiple research findings, sources, or key takeaways for a course in a single call. Use this during the research phase to batch-persist findings gathered from web search or browsing. Prefer this over calling add_research_note repeatedly. Max 20 findings per call.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course'),
        findings: z
          .array(
            z.object({
              title: z.string().describe('Short title for this finding'),
              summary: z.string().describe('Key takeaway or finding'),
              sourceUrl: z.string().optional().describe('Source URL if available'),
              sourceType: z
                .enum(['web', 'paper', 'book', 'video', 'other'])
                .optional()
                .describe('Type of source'),
              notes: z.string().optional().describe('Detailed notes or quotes'),
            })
          )
          .max(20)
          .describe('Array of research findings to save (max 20)'),
      },
      _meta: toolMeta('Saving research findings...', 'Research findings saved.'),
    },
    async ({ courseId, findings }) => {
      try {
        await dbConnect();
        const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
        if (!course) return errorResult('Course not found.');
        if (!findings || findings.length === 0) return errorResult('Provide at least one finding.');

        const notes = findings.map((f) => ({
          title: f.title.trim(),
          summary: f.summary.trim(),
          sourceUrl: f.sourceUrl || '',
          sourceType: f.sourceType || 'other',
          notes: f.notes || '',
        }));

        await CoursifyCourse.updateOne(
          { _id: courseId, deletedAt: null },
          { $push: { researchNotes: { $each: notes } }, $inc: { syncVersion: 1 } }
        );

        return textResult(`Saved ${notes.length} research finding(s).`, {
          success: true,
          count: notes.length,
          findings: notes.map((n, i) => ({ index: i, title: n.title, sourceType: n.sourceType })),
        });
      } catch (err) {
        return errorResult(`Error saving research findings: ${err.message}`);
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
    async ({ id, title, summary, learningGoals, order, status }) => {
      try {
        await dbConnect();
        const clean = cleanPatch({
          title,
          summary,
          learningGoals,
          order,
          status,
        });
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
        const sectionCount = await CoursifySection.countDocuments({
          courseId: module.courseId,
          deletedAt: null,
        });
        return textResult(`Updated module "${module.title}".`, {
          success: true,
          module: normalizeModule({ ...module, sectionCount }),
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
