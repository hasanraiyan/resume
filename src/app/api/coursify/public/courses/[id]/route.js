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

    const [modules, sections] = await Promise.all([
      CoursifyModule.find({ courseId, status: 'complete', deletedAt: null })
        .select('title summary order')
        .sort({ order: 1 })
        .lean(),
      CoursifySection.find({ courseId, status: 'complete', deletedAt: null })
        .select('title blocks resources order moduleId summary learningGoals estimatedDuration')
        .sort({ order: 1 })
        .lean(),
    ]);

    const completeModuleIds = new Set(modules.map((m) => m._id.toString()));
    const filteredSections = sections.filter(
      (s) => !s.moduleId || completeModuleIds.has(s.moduleId.toString())
    );

    return NextResponse.json({
      success: true,
      course: {
        ...course,
        _id: courseId,
        slug: course.slug || courseId,
      },
      modules: modules.map((m) => ({ ...m, _id: m._id.toString(), courseId })),
      sections: filteredSections.map((s) => ({
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
