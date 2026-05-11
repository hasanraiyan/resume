import { requireCoursifyAuth } from '@/lib/coursify-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifySection from '@/models/CoursifySection';
import CoursifyCourse from '@/models/CoursifyCourse';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';

function isObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && String(new mongoose.Types.ObjectId(str)) === str;
}

export async function GET(request, { params }) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid section ID' }, { status: 400 });
    }

    const section = await CoursifySection.findOne({ _id: id, deletedAt: null }).lean();

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

export async function PATCH(request, { params }) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid section ID' }, { status: 400 });
    }

    const body = await request.json();

    const allowed = [
      'title',
      'order',
      'resources',
      'moduleId',
      'status',
      'summary',
      'learningGoals',
      'estimatedDuration',
      'blocks',
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

    const course = await CoursifyCourse.findById(section.courseId).select('slug').lean();
    if (course?.slug) {
      revalidatePath(`/coursify/${course.slug}`);
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
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid section ID' }, { status: 400 });
    }

    const section = await CoursifySection.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    ).lean();

    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    const course = await CoursifyCourse.findById(section.courseId).select('slug').lean();
    if (course?.slug) {
      revalidatePath(`/coursify/${course.slug}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
