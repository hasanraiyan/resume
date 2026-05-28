import { notFound } from 'next/navigation';
import { fetchPublicCourse } from '@/lib/coursify/public-fetch';
import { CourseReaderShell } from '@/components/coursify/reader/CourseReaderShell';
import { getBaseUrl } from '@/lib/baseUrl';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await fetchPublicCourse(slug);
  if (!data || !data.course) return { title: 'Not Found | Coursify' };

  const { course } = data;
  const baseUrl = getBaseUrl();
  const title = `${course.title} | Course | Coursify`;
  const description = course.description || `Take this professional course on ${course.title}`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical: `/coursify/${course.slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `/coursify/${course.slug}`,
      type: 'website',
      siteName: 'Coursify',
      ...(course.thumbnail ? { images: [{ url: course.thumbnail }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(course.thumbnail ? { images: [course.thumbnail] } : {}),
    },
  };
}

export default async function CoursePage({ params }) {
  const { slug } = await params;
  const data = await fetchPublicCourse(slug);
  if (!data || !data.course) notFound();

  const baseUrl = getBaseUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: data.course.title,
    description: data.course.description || `Take this professional course on ${data.course.title}`,
    provider: {
      '@type': 'Person',
      name: 'Hasan Raiyan',
      sameAs: baseUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CourseReaderShell initialData={data} slug={slug} />
    </>
  );
}
