import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifySection from '@/models/CoursifySection';
import CoursifyModule from '@/models/CoursifyModule';

// ─── Catalog tools (no courseId required) ────────────────────────────────────

const searchCourses = tool(
  async ({ query, difficulty }) => {
    await dbConnect();
    const filter = { deletedAt: null, status: 'published' };
    if (difficulty && difficulty !== 'all') filter.difficulty = difficulty;
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $elemMatch: { $regex: query, $options: 'i' } } },
      ];
    }

    const courses = await CoursifyCourse.find(filter)
      .select('_id slug title description difficulty estimatedDuration tags')
      .lean();

    if (!courses.length) return 'No courses found matching that query.';

    return JSON.stringify(
      courses.map((c) => ({
        id: c._id.toString(),
        slug: c.slug || c._id.toString(),
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        estimatedDuration: c.estimatedDuration,
        tags: c.tags,
        url: `/coursify/${c.slug || c._id}`,
      }))
    );
  },
  {
    name: 'search_courses',
    description:
      'Search the Coursify course catalog by keyword, topic, or difficulty level. Returns matching published courses with their URLs. Use this when the user asks about available courses or what to learn.',
    schema: z.object({
      query: z.string().optional().describe('Search keyword or topic (optional)'),
      difficulty: z
        .enum(['beginner', 'intermediate', 'advanced', 'all'])
        .optional()
        .describe('Filter by difficulty level'),
    }),
  }
);

const listCourses = tool(
  async ({ difficulty }) => {
    await dbConnect();
    const filter = { deletedAt: null, status: 'published' };
    if (difficulty && difficulty !== 'all') filter.difficulty = difficulty;

    const courses = await CoursifyCourse.find(filter)
      .select('_id slug title description difficulty estimatedDuration tags')
      .sort({ createdAt: -1 })
      .lean();

    if (!courses.length) return 'No published courses available yet.';

    return JSON.stringify(
      courses.map((c) => ({
        id: c._id.toString(),
        slug: c.slug || c._id.toString(),
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        estimatedDuration: c.estimatedDuration,
        tags: c.tags,
        url: `/coursify/${c.slug || c._id}`,
      }))
    );
  },
  {
    name: 'list_courses',
    description:
      'List all available published courses, optionally filtered by difficulty. Use this when the user wants to see what courses are available or is deciding what to study.',
    schema: z.object({
      difficulty: z
        .enum(['beginner', 'intermediate', 'advanced', 'all'])
        .optional()
        .describe('Filter by difficulty level (omit for all levels)'),
    }),
  }
);

// ─── Course-specific tools (require courseId) ─────────────────────────────────

export function createCoursifyTools(courseId) {
  const getCourseOutline = tool(
    async () => {
      await dbConnect();
      const course = await CoursifyCourse.findOne({
        _id: courseId,
        deletedAt: null,
        status: 'published',
      })
        .select('title description difficulty estimatedDuration tags')
        .lean();
      if (!course) return 'Course not found.';

      const [sections, modules] = await Promise.all([
        CoursifySection.find({ courseId, deletedAt: null })
          .sort({ order: 1 })
          .select('_id title summary learningGoals estimatedDuration moduleId order')
          .lean(),
        CoursifyModule.find({ courseId, deletedAt: null })
          .sort({ order: 1 })
          .select('_id title summary')
          .lean(),
      ]);

      const moduleMap = {};
      modules.forEach((m) => (moduleMap[m._id.toString()] = m.title));

      return JSON.stringify({
        course: {
          title: course.title,
          description: course.description,
          difficulty: course.difficulty,
          estimatedDuration: course.estimatedDuration,
          tags: course.tags,
        },
        sections: sections.map((s) => ({
          id: s._id.toString(),
          title: s.title,
          module: s.moduleId ? moduleMap[s.moduleId.toString()] || null : null,
          summary: s.summary,
          learningGoals: s.learningGoals,
          estimatedDuration: s.estimatedDuration,
        })),
      });
    },
    {
      name: 'get_course_outline',
      description:
        'Get the complete outline of the current course including all section titles, summaries, and learning goals. Use this to understand the course structure and help the learner navigate.',
      schema: z.object({}),
    }
  );

  const getSectionContent = tool(
    async ({ sectionId }) => {
      await dbConnect();
      const section = await CoursifySection.findOne({
        _id: sectionId,
        courseId,
        deletedAt: null,
      }).lean();
      if (!section) return 'Section not found.';

      return JSON.stringify({
        id: section._id.toString(),
        title: section.title,
        content: section.content,
        summary: section.summary,
        learningGoals: section.learningGoals,
        estimatedDuration: section.estimatedDuration,
        resources: section.resources,
      });
    },
    {
      name: 'get_section_content',
      description:
        'Get the full markdown content of a specific section in the current course by its ID. Use this when the user asks about a specific topic or needs deeper explanation.',
      schema: z.object({
        sectionId: z.string().describe('The section ID from get_course_outline'),
      }),
    }
  );

  const searchCourseSections = tool(
    async ({ query }) => {
      await dbConnect();
      const sections = await CoursifySection.find({
        courseId,
        deletedAt: null,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { summary: { $regex: query, $options: 'i' } },
          { learningGoals: { $elemMatch: { $regex: query, $options: 'i' } } },
        ],
      })
        .select('_id title summary learningGoals order')
        .sort({ order: 1 })
        .lean();

      if (!sections.length) return 'No sections found matching that query.';

      return JSON.stringify(
        sections.map((s) => ({
          id: s._id.toString(),
          title: s.title,
          summary: s.summary,
          learningGoals: s.learningGoals,
        }))
      );
    },
    {
      name: 'search_course_sections',
      description:
        'Search sections within the current course by keyword or topic. Use this to find relevant sections when the user asks about a specific concept.',
      schema: z.object({
        query: z.string().describe('Search keyword or phrase'),
      }),
    }
  );

  return [getCourseOutline, getSectionContent, searchCourseSections];
}

// Returns the full tool set based on context
export function createAllCoursifyTools(courseId = null) {
  const catalogTools = [searchCourses, listCourses];
  if (!courseId) return catalogTools;
  return [...catalogTools, ...createCoursifyTools(courseId)];
}
