import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyModule from '@/models/CoursifyModule';
import CoursifyCourse from '@/models/CoursifyCourse';
import { revalidatePath } from 'next/cache';

export async function POST(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const { moduleIds } = body;
    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'moduleIds array is required' },
        { status: 400 }
      );
    }

    await Promise.all(
      moduleIds.map((moduleId, index) =>
        CoursifyModule.updateOne(
          { _id: moduleId, courseId: id, deletedAt: null },
          { $set: { order: index }, $inc: { syncVersion: 1 } }
        )
      )
    );

    await CoursifyCourse.updateOne({ _id: id, deletedAt: null }, { $inc: { syncVersion: 1 } });

    const course = await CoursifyCourse.findById(id).select('slug').lean();
    if (course?.slug) {
      revalidatePath(`/coursify/${course.slug}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
