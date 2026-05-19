import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  try {
    await dbConnect();
    const course = await CoursifyCourse.findOne({ slug, status: 'published', deletedAt: null })
      .select('title description thumbnail difficulty tags')
      .lean();

    if (!course) return { title: 'Course Not Found' };

    const title = course.title;
    const description =
      course.description || `Learn ${title} on Coursify — free, read at your own pace.`;
    const image = course.thumbnail || '/images/apps/coursify.png';

    return {
      metadataBase: new URL(baseUrl),
      title,
      description,
      keywords: course.tags || [],
      alternates: {
        canonical: `/coursify/${slug}`,
      },
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        title,
        description,
        url: `/coursify/${slug}`,
        images: [{ url: image, alt: title }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return { title: 'Coursify' };
  }
}

export default async function CourseDetailLayout({ children, params }) {
  const { slug } = await params;

  let jsonLd = null;
  try {
    await dbConnect();
    const course = await CoursifyCourse.findOne({ slug, status: 'published', deletedAt: null })
      .select('title description thumbnail difficulty estimatedDuration tags')
      .lean();

    if (course) {
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.title,
        description: course.description || '',
        image: course.thumbnail || undefined,
        isAccessibleForFree: true,
        courseLevel: course.difficulty || 'beginner',
        keywords: (course.tags || []).join(', '),
        timeRequired: course.estimatedDuration || undefined,
        provider: {
          '@type': 'Organization',
          name: 'Coursify',
        },
      };
    }
  } catch {
    // silently skip JSON-LD if DB fails
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
