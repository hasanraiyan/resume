import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyUnit from '@/models/CoursifyUnit';

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
      content,
      resources,
      moduleId,
      status,
      summary,
      learningGoals,
      estimatedDuration,
      unitType,
      quiz,
      blocks,
      completionStatus,
    } = body;
    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    // Determine order: max existing + 1
    const last = await CoursifyUnit.findOne({ courseId: id, deletedAt: null })
      .sort({ order: -1 })
      .lean();
    const order = body.order !== undefined ? body.order : last ? last.order + 1 : 0;

    const unit = await CoursifyUnit.create({
      courseId: id,
      title: title.trim(),
      unitType: unitType || 'lesson',
      content: content || '',
      quiz: quiz || { questions: [] },
      order,
      resources: Array.isArray(resources) ? resources : [],
      moduleId: moduleId || null,
      status: status || 'draft',
      summary: summary || '',
      learningGoals: Array.isArray(learningGoals) ? learningGoals : [],
      estimatedDuration: estimatedDuration || '',
      blocks: blocks || [],
      completionStatus: completionStatus || 'not_started',
    });

    return NextResponse.json({
      success: true,
      unit: {
        ...unit.toObject(),
        _id: unit._id.toString(),
        courseId: id,
        moduleId: unit.moduleId?.toString() || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
