import { requireCoursifyAuth } from '@/lib/coursify-auth';
import { NextResponse } from 'next/server';
import {
  dbCreateCourse,
  dbCreateModule,
  dbAddSection,
  dbUpdateCourse,
  dbSaveCoursePlan,
} from '@/lib/coursify/db-ops';

export async function POST(request) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const bundle = await request.json();

    if (!bundle.title) {
      return NextResponse.json(
        { success: false, error: 'Course title is required' },
        { status: 400 }
      );
    }

    // 1. Create or Update Course
    let course;
    if (bundle.id) {
      const result = await dbUpdateCourse({
        id: bundle.id,
        title: bundle.title,
        description: bundle.description,
        difficulty: bundle.difficulty,
        estimatedDuration: bundle.estimatedDuration,
        tags: bundle.tags,
        status: bundle.status || 'draft',
      });
      course = result.course;
    } else {
      const result = await dbCreateCourse({
        title: bundle.title,
        description: bundle.description,
        difficulty: bundle.difficulty,
        estimatedDuration: bundle.estimatedDuration,
        tags: bundle.tags,
      });
      course = result.course;
    }

    // 2. Save Planning/Metadata
    await dbSaveCoursePlan({
      courseId: course.id,
      targetAudience: bundle.targetAudience,
      learningObjectives: bundle.learningObjectives,
      prerequisites: bundle.prerequisites,
      outcome: bundle.outcome,
      outline: bundle.outline,
      planningNotes: bundle.planningNotes,
      authoringStatus: bundle.authoringStatus,
      agentNotes: bundle.agentNotes,
      researchNotes: bundle.researchNotes,
    });

    // 3. Process Modules and Sections
    if (bundle.modules && Array.isArray(bundle.modules)) {
      console.log(`[Import] Processing ${bundle.modules.length} modules...`);
      for (const [mIndex, modData] of bundle.modules.entries()) {
        const { module } = await dbCreateModule({
          courseId: course.id,
          title: modData.title,
          summary: modData.summary,
          learningGoals: modData.learningGoals,
          order: modData.order ?? mIndex,
          status: modData.status || 'planned',
        });

        if (modData.sections && Array.isArray(modData.sections)) {
          console.log(
            `[Import]   Processing ${modData.sections.length} sections for module: ${modData.title}`
          );
          for (const [sIndex, secData] of modData.sections.entries()) {
            await dbAddSection({
              courseId: course.id,
              moduleId: module.id,
              title: secData.title,
              content: secData.content,
              status: secData.status || 'draft',
              order: secData.order ?? sIndex,
              summary: secData.summary,
              learningGoals: secData.learningGoals,
              estimatedDuration: secData.estimatedDuration,
              resources: secData.resources,
            });
          }
        }
      }
    }

    console.log(`[Import] Successfully imported course: ${course.title}`);
    return NextResponse.json({ success: true, courseId: course.id });
  } catch (error) {
    console.error('[Import API Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
