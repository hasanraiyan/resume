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
      .select(
        'title sectionType content quiz resources order moduleId summary learningGoals estimatedDuration'
      )
      .sort({ order: 1 })
      .lean(),
  ]);

  return {
    course: ser({ ...course, slug: course.slug || courseId }),
    modules: modules.map((m) => ser({ ...m, courseId })),
    sections: sections.map((s) => {
      const flat = ser({ ...s, courseId, moduleId: s.moduleId?.toString() || null });
      if (flat.quiz?.questions?.length) {
        flat.quiz = {
          ...flat.quiz,
          questions: flat.quiz.questions.map((q) => ({
            ...q,
            _id: q._id?.toString?.() ?? q._id,
          })),
        };
      }
      return flat;
    }),
  };
}
