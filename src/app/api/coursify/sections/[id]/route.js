import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifySection from '@/models/CoursifySection';

export async function PATCH(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const allowed = [
      'title',
      'content',
      'order',
      'resources',
      'moduleId',
      'status',
      'summary',
      'learningGoals',
      'estimatedDuration',
    ];
    const patch = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    const section = await CoursifySection.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: patch, $inc: { syncVersion: 1 } },
      { new: true }
    ).lean();

    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      section: {
        ...section,
        _id: section._id.toString(),
        courseId: section.courseId.toString(),
        moduleId: section.moduleId?.toString() || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    const section = await CoursifySection.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    ).lean();

    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
