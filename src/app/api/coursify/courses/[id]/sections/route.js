import { requireCoursifyAuth } from '@/lib/coursify-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import { dbAddSection } from '@/lib/coursify/db-ops';
import { revalidatePath } from 'next/cache';

export async function POST(request, { params }) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const course = await CoursifyCourse.findOne({ _id: id, deletedAt: null }).lean();
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    // Delegate to shared db-ops for unified logic (including Markdown-first sync)
    const { section } = await dbAddSection({
      courseId: id,
      ...body,
    });

    if (course.slug) {
      revalidatePath(`/coursify/${course.slug}`);
    }

    return NextResponse.json({
      success: true,
      section,
    });
  } catch (error) {
    console.error('[API: Add Section Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
