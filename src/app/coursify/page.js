import { dbListCourses } from '@/lib/coursify/db-ops';
import { CourseListClient } from '@/components/coursify/CourseListClient';

export default async function CoursifyPublicPage() {
  const courses = await dbListCourses({ status: 'published' });

  return <CourseListClient initialCourses={JSON.parse(JSON.stringify(courses))} />;
}
