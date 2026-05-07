import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifySection from '@/models/CoursifySection';
import {
  READ_ONLY_ANNOTATIONS,
  MUTATION_ANNOTATIONS,
  DESTRUCTIVE_ANNOTATIONS,
} from './constants.js';
import { textResult, errorResult, toolMeta, normalizeCourse, normalizeSection } from './utils.js';

export function registerCoursifyTools(server) {
  // ─── list_courses ────────────────────────────────────────────────────
  server.registerTool(
    'list_courses',
    {
      title: 'List Courses',
      description:
        'Retrieve all courses in Coursify. Use this first to see what courses exist before creating a new one to avoid duplicates.',
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
        const courseIds = courses.map((c) => c._id);

        const sections = await CoursifySection.find({
          courseId: { $in: courseIds },
          deletedAt: null,
        })
          .select('courseId')
          .lean();

        const countMap = {};
        for (const s of sections) {
          const id = s.courseId.toString();
          countMap[id] = (countMap[id] || 0) + 1;
        }

        const result = courses.map((c) =>
          normalizeCourse({ ...c, sectionCount: countMap[c._id.toString()] || 0 })
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

  // ─── get_course ──────────────────────────────────────────────────────
  server.registerTool(
    'get_course',
    {
      title: 'Get Course',
      description:
        'Retrieve a single course by ID along with all its sections and their full markdown content.',
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

        const sections = await CoursifySection.find({ courseId: id, deletedAt: null })
          .sort({ order: 1 })
          .lean();

        return textResult(`Course "${course.title}" has ${sections.length} sections.`, {
          kind: 'course_detail',
          course: normalizeCourse({ ...course, sectionCount: sections.length }),
          sections: sections.map(normalizeSection),
        });
      } catch (err) {
        return errorResult(`Error fetching course: ${err.message}`);
      }
    }
  );

  // ─── create_course ───────────────────────────────────────────────────
  server.registerTool(
    'create_course',
    {
      title: 'Create Course',
      description:
        'Create a new course in Coursify. Call this before adding sections. The course starts as a draft. After calling this, use add_section to build out the curriculum.',
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
        const course = await CoursifyCourse.create({
          title: title.trim(),
          description: description?.trim() || '',
          difficulty: difficulty || 'beginner',
          estimatedDuration: estimatedDuration || '',
          tags: tags || [],
        });

        return textResult(`Created course "${course.title}" (id: ${course._id}).`, {
          success: true,
          course: normalizeCourse({ ...course.toObject(), sectionCount: 0 }),
        });
      } catch (err) {
        return errorResult(`Error creating course: ${err.message}`);
      }
    }
  );

  // ─── update_course ───────────────────────────────────────────────────
  server.registerTool(
    'update_course',
    {
      title: 'Update Course',
      description: 'Update a course title, description, difficulty, duration, or tags.',
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
        const course = await CoursifyCourse.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: patch, $inc: { syncVersion: 1 } },
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

  // ─── publish_course ──────────────────────────────────────────────────
  server.registerTool(
    'publish_course',
    {
      title: 'Publish Course',
      description:
        'Mark a course as published so it appears ready to use. Call this after all sections have been added and the content is complete.',
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

  // ─── delete_course ───────────────────────────────────────────────────
  server.registerTool(
    'delete_course',
    {
      title: 'Delete Course',
      description: 'Permanently remove a course and all its sections from Coursify.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the course to delete'),
      },
      _meta: toolMeta('Deleting course...', 'Course deleted.'),
    },
    async ({ id }) => {
      try {
        await dbConnect();
        const course = await CoursifyCourse.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: { deletedAt: new Date() } }
        ).lean();

        if (!course) return errorResult('Course not found.');
        await CoursifySection.updateMany(
          { courseId: id, deletedAt: null },
          { $set: { deletedAt: new Date() } }
        );

        return textResult(`Deleted course "${course.title}" and all its sections.`, {
          success: true,
          deletedId: id,
        });
      } catch (err) {
        return errorResult(`Error deleting course: ${err.message}`);
      }
    }
  );

  // ─── add_section ─────────────────────────────────────────────────────
  server.registerTool(
    'add_section',
    {
      title: 'Add Section',
      description:
        'Add a new section to a course. Write the full section content in Markdown — include explanations, code examples, key concepts, and a summary. Call this once per section of the course outline.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        courseId: z.string().describe('MongoDB _id of the course to add this section to'),
        title: z.string().describe('Section title, e.g. "Introduction to LangChain Runnables"'),
        content: z
          .string()
          .describe(
            'Full section content in Markdown. Include headers, bullet points, code blocks, and examples. Aim for comprehensive coverage of the topic.'
          ),
        order: z
          .number()
          .int()
          .optional()
          .describe(
            'Zero-based position in the course. If omitted, the section is appended at the end.'
          ),
        resources: z
          .array(
            z.object({
              type: z.enum(['video', 'article', 'doc', 'other']),
              url: z.string(),
              title: z.string(),
            })
          )
          .optional()
          .describe(
            'Optional list of supplementary resources (YouTube videos, docs, articles) relevant to this section.'
          ),
      },
      _meta: toolMeta('Adding section...', 'Section added.'),
    },
    async ({ courseId, title, content, order, resources }) => {
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
        });

        return textResult(
          `Added section "${section.title}" to course "${course.title}" (order: ${resolvedOrder}).`,
          { success: true, section: normalizeSection(section.toObject()) }
        );
      } catch (err) {
        return errorResult(`Error adding section: ${err.message}`);
      }
    }
  );

  // ─── update_section ──────────────────────────────────────────────────
  server.registerTool(
    'update_section',
    {
      title: 'Update Section',
      description: 'Edit the title, content, order, or resources of an existing section.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the section to update'),
        title: z.string().optional(),
        content: z.string().optional().describe('Full replacement content in Markdown'),
        order: z.number().int().optional(),
        resources: z
          .array(
            z.object({
              type: z.enum(['video', 'article', 'doc', 'other']),
              url: z.string(),
              title: z.string(),
            })
          )
          .optional(),
      },
      _meta: toolMeta('Updating section...', 'Section updated.'),
    },
    async ({ id, ...patch }) => {
      try {
        await dbConnect();
        const section = await CoursifySection.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: patch, $inc: { syncVersion: 1 } },
          { new: true }
        ).lean();

        if (!section) return errorResult('Section not found.');
        return textResult(`Updated section "${section.title}".`, {
          success: true,
          section: normalizeSection(section),
        });
      } catch (err) {
        return errorResult(`Error updating section: ${err.message}`);
      }
    }
  );

  // ─── delete_section ──────────────────────────────────────────────────
  server.registerTool(
    'delete_section',
    {
      title: 'Delete Section',
      description: 'Remove a section from a course.',
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
          { $set: { deletedAt: new Date() } }
        ).lean();

        if (!section) return errorResult('Section not found.');
        return textResult(`Deleted section "${section.title}".`, {
          success: true,
          deletedId: id,
        });
      } catch (err) {
        return errorResult(`Error deleting section: ${err.message}`);
      }
    }
  );

  // ─── reorder_sections ────────────────────────────────────────────────
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
              { $set: { order: index } }
            )
          )
        );

        return textResult(`Reordered ${sectionIds.length} sections.`, { success: true });
      } catch (err) {
        return errorResult(`Error reordering sections: ${err.message}`);
      }
    }
  );
}
