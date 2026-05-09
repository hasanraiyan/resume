import { Pacifico, Nunito } from 'next/font/google';
import { dbListCourses } from '@/lib/coursify/db-ops';
import { CourseListClient } from '@/components/coursify/CourseListClient';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-logo',
  display: 'swap',
});

const nunito = Nunito({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export default async function CoursifyPublicPage() {
  const courses = await dbListCourses({ status: 'published' });

  return (
    <div
      className={`min-h-screen bg-[#fcfbf5] ${pacifico.variable} ${nunito.variable} font-[family-name:var(--font-sans)]`}
    >
      <CourseListClient initialCourses={JSON.parse(JSON.stringify(courses))} />
    </div>
  );
}
