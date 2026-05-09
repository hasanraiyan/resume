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

    const section = await CoursifySection.findOne({ _id: id, deletedAt: null })
      .select('title blocks resources order moduleId summary learningGoals estimatedDuration')
      .lean();

    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
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
