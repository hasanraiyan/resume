import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifySection from '@/models/CoursifySection';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();

    const courses = await CoursifyCourse.find({ deletedAt: null }).sort({ updatedAt: -1 }).lean();

    const courseIds = courses.map((c) => c._id);
    const sections = await CoursifySection.find({
      courseId: { $in: courseIds },
      deletedAt: null,
    })
      .select('courseId order')
      .lean();

    const sectionCountMap = {};
    for (const s of sections) {
      const id = s.courseId.toString();
      sectionCountMap[id] = (sectionCountMap[id] || 0) + 1;
    }

    const result = courses.map((c) => ({
      ...c,
      _id: c._id.toString(),
      sectionCount: sectionCountMap[c._id.toString()] || 0,
    }));

    return NextResponse.json({ success: true, courses: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
