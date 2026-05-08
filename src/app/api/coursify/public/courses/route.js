import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyModule from '@/models/CoursifyModule';
import CoursifySection from '@/models/CoursifySection';
import { generateUniqueSlug } from '@/lib/coursify/slugify';

export async function GET() {
  try {
    await dbConnect();

    const courses = await CoursifyCourse.find({ status: 'published', deletedAt: null })
      .select(
        'title slug description difficulty estimatedDuration tags thumbnail createdAt updatedAt'
      )
      .sort({ updatedAt: -1 })
      .lean();

    // Lazy-generate slugs for any courses that predate the slug field
    const needsSlugs = courses.filter((c) => !c.slug);
    if (needsSlugs.length > 0) {
      await Promise.all(
        needsSlugs.map(async (c) => {
          const slug = await generateUniqueSlug(c.title, c._id);
          if (slug) {
            await CoursifyCourse.updateOne({ _id: c._id }, { $set: { slug } });
            c.slug = slug;
          }
        })
      );
    }

    const courseIds = courses.map((c) => c._id);

    const [sections, modules] = await Promise.all([
      CoursifySection.find({ courseId: { $in: courseIds }, deletedAt: null })
        .select('courseId')
        .lean(),
      CoursifyModule.find({ courseId: { $in: courseIds }, deletedAt: null })
        .select('courseId')
        .lean(),
    ]);

    const sectionCountMap = {};
    for (const s of sections) {
      const id = s.courseId.toString();
      sectionCountMap[id] = (sectionCountMap[id] || 0) + 1;
    }

    const moduleCountMap = {};
    for (const m of modules) {
      const id = m.courseId.toString();
      moduleCountMap[id] = (moduleCountMap[id] || 0) + 1;
    }

    const result = courses.map((c) => ({
      _id: c._id.toString(),
      slug: c.slug || c._id.toString(),
      title: c.title,
      description: c.description || '',
      difficulty: c.difficulty || 'beginner',
      estimatedDuration: c.estimatedDuration || '',
      tags: c.tags || [],
      thumbnail: c.thumbnail || null,
      sectionCount: sectionCountMap[c._id.toString()] || 0,
      moduleCount: moduleCountMap[c._id.toString()] || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ success: true, courses: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
