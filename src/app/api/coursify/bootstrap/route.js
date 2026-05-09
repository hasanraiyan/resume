import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyUnit from '@/models/CoursifyUnit';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();

    const courses = await CoursifyCourse.find({ deletedAt: null }).sort({ updatedAt: -1 }).lean();

    const courseIds = courses.map((c) => c._id);
    const units = await CoursifyUnit.find({
      courseId: { $in: courseIds },
      deletedAt: null,
    })
      .select('courseId order')
      .lean();

    const unitCountMap = {};
    for (const u of units) {
      const id = u.courseId.toString();
      unitCountMap[id] = (unitCountMap[id] || 0) + 1;
    }

    const result = courses.map((c) => ({
      ...c,
      _id: c._id.toString(),
      unitCount: unitCountMap[c._id.toString()] || 0,
      authoringStatus: c.authoringStatus || 'idea',
    }));

    return NextResponse.json({ success: true, courses: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
