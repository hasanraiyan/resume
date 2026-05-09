import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyModule from '@/models/CoursifyModule';
import CoursifyUnit from '@/models/CoursifyUnit';
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
        'title slug description difficulty estimatedDuration tags thumbnail learningObjectives prerequisites targetAudience createdAt updatedAt'
      )
      .lean();

    if (!course && isObjectId(id)) {
      course = await CoursifyCourse.findOne({ _id: id, status: 'published', deletedAt: null })
        .select(
          'title slug description difficulty estimatedDuration tags thumbnail learningObjectives prerequisites targetAudience createdAt updatedAt'
        )
        .lean();
    }

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const courseId = course._id.toString();

    const [modules, units] = await Promise.all([
      CoursifyModule.find({ courseId, deletedAt: null })
        .select('title summary order')
        .sort({ order: 1 })
        .lean(),
      CoursifyUnit.find({ courseId, deletedAt: null })
        .select('title sectionType content quiz resources order moduleId blocks completionStatus')
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
      units: units.map((u) => ({
        ...u,
        _id: u._id.toString(),
        courseId,
        moduleId: u.moduleId?.toString() || null,
      })),
      // Keep sections for backward compatibility in the public API if needed, or just switch
      sections: units.map((u) => ({
        ...u,
        _id: u._id.toString(),
        courseId,
        moduleId: u.moduleId?.toString() || null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
