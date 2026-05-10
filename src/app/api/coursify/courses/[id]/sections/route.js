import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifySection from '@/models/CoursifySection';
import { revalidatePath } from 'next/cache';

export async function POST(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const course = await CoursifyCourse.findOne({ _id: id, deletedAt: null }).lean();
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const {
      title,
      resources,
      moduleId,
      status,
      summary,
      learningGoals,
      estimatedDuration,
      blocks,
    } = body;
    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    // Determine order: max existing + 1
    const last = await CoursifySection.findOne({ courseId: id, deletedAt: null })
      .sort({ order: -1 })
      .lean();
    const order = body.order !== undefined ? body.order : last ? last.order + 1 : 0;

    const section = await CoursifySection.create({
      courseId: id,
      title: title.trim(),
      blocks: blocks || [],
      order,
      resources: Array.isArray(resources) ? resources : [],
      moduleId: moduleId || null,
      status: status || 'draft',
      summary: summary || '',
      learningGoals: Array.isArray(learningGoals) ? learningGoals : [],
      estimatedDuration: estimatedDuration || '',
    });

    if (course.slug) {
      revalidatePath(`/coursify/${course.slug}`);
    }

    return NextResponse.json({
      success: true,
      section: {
        ...section.toObject(),
        _id: section._id.toString(),
        courseId: id,
        moduleId: section.moduleId?.toString() || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
