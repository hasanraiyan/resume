import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';

export async function POST(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    const course = await CoursifyCourse.findOne({ _id: id, deletedAt: null }).lean();
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const newStatus = course.status === 'published' ? 'draft' : 'published';
    const updated = await CoursifyCourse.findByIdAndUpdate(
      id,
      { $set: { status: newStatus }, $inc: { syncVersion: 1 } },
      { new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      course: { ...updated, _id: updated._id.toString() },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
