import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifySection from '@/models/CoursifySection';
import CoursifyModule from '@/models/CoursifyModule';

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
        'Get the complete course outline including all section titles, summaries, and learning goals. Use this to understand the course structure and help the learner navigate.',
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
        'Get the full markdown content of a specific course section by its ID. Use this when the user asks about a specific topic or needs deeper explanation of a section.',
      schema: z.object({
        sectionId: z.string().describe('The section ID from the course outline'),
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
        'Search course sections by keyword or topic. Returns sections that match the query. Use this to find relevant sections when the user asks about a specific concept.',
      schema: z.object({
        query: z.string().describe('Search keyword or phrase'),
      }),
    }
  );

  return [getCourseOutline, getSectionContent, searchCourseSections];
}
