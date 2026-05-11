import { requireCoursifyAuth } from '@/lib/coursify-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyModule from '@/models/CoursifyModule';
import CoursifySection from '@/models/CoursifySection';
import CoursifyCourse from '@/models/CoursifyCourse';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';

const ALLOWED_PATCH_KEYS = ['title', 'summary', 'learningGoals', 'order', 'status'];

function isObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && String(new mongoose.Types.ObjectId(str)) === str;
}

export async function PATCH(request, { params }) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid module ID' }, { status: 400 });
    }

    const body = await request.json();

    const patch = {};
    for (const key of ALLOWED_PATCH_KEYS) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    const mod = await CoursifyModule.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: patch, $inc: { syncVersion: 1 } },
      { new: true }
    ).lean();

    if (!mod) {
      return NextResponse.json({ success: false, error: 'Module not found' }, { status: 404 });
    }

    await CoursifyCourse.updateOne(
      { _id: mod.courseId, deletedAt: null },
      { $inc: { syncVersion: 1 } }
    );

    const course = await CoursifyCourse.findById(mod.courseId).select('slug').lean();
    if (course?.slug) {
      revalidatePath(`/coursify/${course.slug}`);
    }

    return NextResponse.json({
      success: true,
      module: { ...mod, _id: mod._id.toString(), courseId: mod.courseId.toString() },
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
      return NextResponse.json({ success: false, error: 'Invalid module ID' }, { status: 400 });
    }

    const mod = await CoursifyModule.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
    ).lean();

    if (!mod) {
      return NextResponse.json({ success: false, error: 'Module not found' }, { status: 404 });
    }

    // Unassign sections from this module (don't delete them — they become Uncategorized)
    await CoursifySection.updateMany(
      { moduleId: id, deletedAt: null },
      { $set: { moduleId: null }, $inc: { syncVersion: 1 } }
    );

    await CoursifyCourse.updateOne(
      { _id: mod.courseId, deletedAt: null },
      { $inc: { syncVersion: 1 } }
    );

    const course = await CoursifyCourse.findById(mod.courseId).select('slug').lean();
    if (course?.slug) {
      revalidatePath(`/coursify/${course.slug}`);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
