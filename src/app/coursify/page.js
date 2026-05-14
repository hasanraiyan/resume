import { dbListCourses } from '@/lib/coursify/db-ops';
import { CourseListClient } from '@/components/coursify/CourseListClient';
import dbConnect from '@/lib/dbConnect';
import Lead from '@/models/Lead';

export default async function CoursifyPublicPage() {
  await dbConnect();

  const [courses, waitlistCount] = await Promise.all([
    dbListCourses({ status: 'published' }),
    Lead.countDocuments({ type: 'coursify-waitlist' }),
  ]);

  return (
    <CourseListClient
      initialCourses={JSON.parse(JSON.stringify(courses))}
      waitlistCount={waitlistCount}
    />
  );
}
