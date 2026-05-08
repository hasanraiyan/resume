import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyModule from '@/models/CoursifyModule';
import CoursifySection from '@/models/CoursifySection';
import { generateUniqueSlug } from '@/lib/coursify/slugify';

export async function GET(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    const course = await CoursifyCourse.findOne({ _id: id, deletedAt: null }).lean();
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const [modules, sections] = await Promise.all([
      CoursifyModule.find({ courseId: id, deletedAt: null }).sort({ order: 1 }).lean(),
      CoursifySection.find({ courseId: id, deletedAt: null }).sort({ order: 1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      course: { ...course, _id: course._id.toString() },
      modules: modules.map((m) => ({ ...m, _id: m._id.toString(), courseId: id })),
      sections: sections.map((s) => ({
        ...s,
        _id: s._id.toString(),
        courseId: s.courseId.toString(),
        moduleId: s.moduleId?.toString() || null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const allowed = [
      'title',
      'description',
      'difficulty',
      'estimatedDuration',
      'tags',
      'thumbnail',
      'status',
      // Planning fields
      'targetAudience',
      'learningObjectives',
      'prerequisites',
      'outcome',
      'outline',
      'planningNotes',
      'authoringStatus',
    ];
    const patch = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    if (patch.title) {
      patch.slug = await generateUniqueSlug(patch.title, id);
    }

    const course = await CoursifyCourse.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: patch, $inc: { syncVersion: 1 } },
      { new: true }
    ).lean();

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, course: { ...course, _id: course._id.toString() } });
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

    const course = await CoursifyCourse.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    ).lean();

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const deletedAt = new Date();
    await Promise.all([
      CoursifySection.updateMany({ courseId: id, deletedAt: null }, { $set: { deletedAt } }),
      CoursifyModule.updateMany({ courseId: id, deletedAt: null }, { $set: { deletedAt } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
