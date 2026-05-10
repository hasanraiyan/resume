import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import { dbUpdateCourse } from '@/lib/coursify/db-ops';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import { revalidatePath } from 'next/cache';

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
    const { course: updated } = await dbUpdateCourse({ id, status: newStatus });

    revalidatePath('/coursify');
    revalidatePath(`/coursify/${updated.slug}`);

    return NextResponse.json({
      success: true,
      course: updated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
