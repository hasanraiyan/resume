import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyModule from '@/models/CoursifyModule';
import CoursifySection from '@/models/CoursifySection';
import mongoose from 'mongoose';

function isObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && String(new mongoose.Types.ObjectId(str)) === str;
}

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    // Try slug first, fall back to _id for backward compat
    let course = await CoursifyCourse.findOne({ slug: id, status: 'published', deletedAt: null })
      .select(
        'title slug description difficulty estimatedDuration tags thumbnail createdAt updatedAt'
      )
      .lean();

    if (!course && isObjectId(id)) {
      course = await CoursifyCourse.findOne({ _id: id, status: 'published', deletedAt: null })
        .select(
          'title slug description difficulty estimatedDuration tags thumbnail createdAt updatedAt'
        )
        .lean();
    }

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const courseId = course._id.toString();

    const [modules, sections] = await Promise.all([
      CoursifyModule.find({ courseId, deletedAt: null })
        .select('title summary order')
        .sort({ order: 1 })
        .lean(),
      CoursifySection.find({ courseId, deletedAt: null })
        .select('title content resources order moduleId')
        .sort({ order: 1 })
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      course: {
        ...course,
        _id: courseId,
        slug: course.slug || courseId,
      },
      modules: modules.map((m) => ({ ...m, _id: m._id.toString(), courseId })),
      sections: sections.map((s) => ({
        ...s,
        _id: s._id.toString(),
        courseId,
        moduleId: s.moduleId?.toString() || null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
