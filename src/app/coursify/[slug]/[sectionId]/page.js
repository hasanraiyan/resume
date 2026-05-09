import { notFound } from 'next/navigation';
import { fetchPublicCourse } from '@/lib/coursify/public-fetch';
import { CourseReaderShell } from '@/components/coursify/reader/CourseReaderShell';

export async function generateMetadata({ params }) {
  const { slug, sectionId } = await params;
  const data = await fetchPublicCourse(slug);
  if (!data) return { title: 'Course Not Found' };
  const section = data.sections.find((s) => s._id === sectionId);
  if (!section) return { title: data.course.title };
  return {
    title: `${section.title} | ${data.course.title}`,
    description: section.summary || data.course.description,
  };
}

export default async function SectionPage({ params }) {
  const { slug, sectionId } = await params;
  const data = await fetchPublicCourse(slug);
  if (!data) notFound();
  return <CourseReaderShell initialData={data} slug={slug} activeSectionId={sectionId} />;
}
