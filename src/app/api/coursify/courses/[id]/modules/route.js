import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyModule from '@/models/CoursifyModule';
import CoursifyUnit from '@/models/CoursifyUnit';

export async function GET(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    const modules = await CoursifyModule.find({ courseId: id, deletedAt: null })
      .sort({ order: 1 })
      .lean();

    const units = await CoursifyUnit.find({ courseId: id, deletedAt: null })
      .select('moduleId')
      .lean();

    const countMap = {};
    for (const u of units) {
      const mid = u.moduleId?.toString() || '__none__';
      countMap[mid] = (countMap[mid] || 0) + 1;
    }

    const result = modules.map((m) => ({
      ...m,
      _id: m._id.toString(),
      courseId: m.courseId.toString(),
      unitCount: countMap[m._id.toString()] || 0,
      sectionCount: countMap[m._id.toString()] || 0,
    }));

    return NextResponse.json({ success: true, modules: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { title, summary, learningGoals, order } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    let resolvedOrder = order;
    if (resolvedOrder === undefined) {
      const last = await CoursifyModule.findOne({ courseId: id, deletedAt: null })
        .sort({ order: -1 })
        .lean();
      resolvedOrder = last ? last.order + 1 : 0;
    }

    const mod = await CoursifyModule.create({
      courseId: id,
      title: title.trim(),
      summary: summary || '',
      learningGoals: Array.isArray(learningGoals) ? learningGoals : [],
      order: resolvedOrder,
    });

    return NextResponse.json({
      success: true,
      module: { ...mod.toObject(), _id: mod._id.toString(), courseId: id },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
