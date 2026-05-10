import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyModule from '@/models/CoursifyModule';
import CoursifySection from '@/models/CoursifySection';
import mongoose from 'mongoose';

function isObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && String(new mongoose.Types.ObjectId(str)) === str;
}

function ser(doc) {
  const obj = { ...doc };
  if (obj._id) obj._id = obj._id.toString();
  if (obj.createdAt instanceof Date) obj.createdAt = obj.createdAt.toISOString();
  if (obj.updatedAt instanceof Date) obj.updatedAt = obj.updatedAt.toISOString();
  return obj;
}

export async function fetchPublicCourse(slugOrId) {
  await dbConnect();

  let course = await CoursifyCourse.findOne({
    slug: slugOrId,
    status: 'published',
    deletedAt: null,
  })
    .select(
      'title slug description difficulty estimatedDuration tags thumbnail learningObjectives prerequisites targetAudience createdAt updatedAt'
    )
    .lean();

  if (!course && isObjectId(slugOrId)) {
    course = await CoursifyCourse.findOne({
      _id: slugOrId,
      status: 'published',
      deletedAt: null,
    })
      .select(
        'title slug description difficulty estimatedDuration tags thumbnail learningObjectives prerequisites targetAudience createdAt updatedAt'
      )
      .lean();
  }

  if (!course) return null;

  const courseId = course._id.toString();

  const [modules, sections] = await Promise.all([
    CoursifyModule.find({ courseId, deletedAt: null })
      .select('title summary order')
      .sort({ order: 1 })
      .lean(),
    CoursifySection.find({ courseId, deletedAt: null })
      .select('title blocks resources order moduleId summary learningGoals estimatedDuration')
      .sort({ order: 1 })
      .lean(),
  ]);

  const moduleIds = new Set(modules.map((m) => m._id.toString()));

  return {
    course: ser(course),
    modules: modules.map((m) => ser(m)),
    sections: sections
      .filter((s) => !s.moduleId || moduleIds.has(s.moduleId.toString()))
      .map((s) => {
        const flat = ser({ ...s, courseId, moduleId: s.moduleId?.toString() || null });
        if (flat.blocks) {
          flat.blocks = flat.blocks.map((b) => {
            const flatB = ser(b);
            if (flatB.type === 'QuizBlock' && flatB.quiz?.questions?.length) {
              flatB.quiz = {
                ...flatB.quiz,
                questions: flatB.quiz.questions.map((q) => {
                  const safeQ = ser(q);
                  delete safeQ.correctAnswer;
                  delete safeQ.explanation;
                  return safeQ;
                }),
              };
            }
            return flatB;
          });
        }
        return flat;
      }),
  };
}
