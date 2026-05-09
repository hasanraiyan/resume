import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifySection from '@/models/CoursifySection';
import mongoose from 'mongoose';

function isObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && String(new mongoose.Types.ObjectId(str)) === str;
}

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid section ID' }, { status: 400 });
    }

    const section = await CoursifySection.findOne({ _id: id, status: 'complete', deletedAt: null })
      .select(
        'title blocks resources order moduleId summary learningGoals estimatedDuration courseId'
      )
      .lean();

    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    // Security check: Ensure the associated course is published
    const course = await CoursifyCourse.findOne({
      _id: section.courseId,
      status: 'published',
      deletedAt: null,
    });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not available' }, { status: 404 });
    }

    // If section belongs to a module, that module must also be 'complete'
    if (section.moduleId) {
      const parentModule = await CoursifyModule.findOne({
        _id: section.moduleId,
        status: 'complete',
        deletedAt: null,
      });
      if (!parentModule) {
        return NextResponse.json(
          { success: false, error: 'Section not available' },
          { status: 404 }
        );
      }
    }

    // Strip correct answers from quizzes for public viewing
    if (section.blocks && Array.isArray(section.blocks)) {
      section.blocks = section.blocks.map((b) => {
        if (b.type === 'QuizBlock' && b.quiz?.questions?.length) {
          return {
            ...b,
            quiz: {
              ...b.quiz,
              questions: b.quiz.questions.map((q) => {
                const safeQ = { ...q };
                delete safeQ.correctAnswer;
                delete safeQ.explanation;
                return safeQ;
              }),
            },
          };
        }
        return b;
      });
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
