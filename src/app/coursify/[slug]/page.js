import { notFound } from 'next/navigation';
import { fetchPublicCourse } from '@/lib/coursify/public-fetch';
import { CourseReaderShell } from '@/components/coursify/reader/CourseReaderShell';

export default async function CoursePage({ params }) {
  const { slug } = await params;
  const data = await fetchPublicCourse(slug);
  if (!data) notFound();
  return <CourseReaderShell initialData={data} slug={slug} />;
}
