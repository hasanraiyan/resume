'use server';

import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifySection from '@/models/CoursifySection';
import { serializeForClient } from '@/lib/serialize';

/**
 * Fetches featured/published courses from Coursify for the homepage.
 * Includes section count for each course.
 *
 * @param {number} [limit=6] - Maximum number of courses to return
 * @returns {Object} { success: boolean, courses: Array }
 */
export async function getFeaturedCourses(limit = 6) {
  await dbConnect();

  try {
    const courses = await CoursifyCourse.find({
      status: 'published',
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get section counts for all courses
    const courseIds = courses.map((c) => c._id);
    const sectionCounts = await CoursifySection.aggregate([
      { $match: { courseId: { $in: courseIds }, deletedAt: null } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    sectionCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const serialized = courses.map((course) => {
      const serialized = serializeForClient(course);
      return {
        ...serialized,
        id: course._id.toString(),
        _id: course._id.toString(),
        sectionCount: countMap[course._id.toString()] || 0,
      };
    });

    return { success: true, courses: serialized };
  } catch (error) {
    console.error('Get Featured Courses Error:', error);
    return { success: false, courses: [] };
  }
}
