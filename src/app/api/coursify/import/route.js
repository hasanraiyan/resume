import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import {
  dbCreateCourse,
  dbUpdateCourse,
  dbCreateModule,
  dbAddSection,
  dbListCourseModules,
  dbDeleteModules,
} from '@/lib/coursify/db-ops';

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const bundle = await request.json();
    const { courseId, title, description, difficulty, estimatedDuration, tags, modules } = bundle;

    if (!title?.trim() && !courseId) {
      return NextResponse.json(
        { success: false, error: 'Title is required for new courses' },
        { status: 400 }
      );
    }

    let course;
    if (courseId) {
      // Update existing course
      const result = await dbUpdateCourse({
        id: courseId,
        title,
        description,
        difficulty,
        estimatedDuration,
        tags,
      });
      course = result.course;

      // Clean up existing modules/sections to avoid duplicates on re-import
      const { modules: existingModules } = await dbListCourseModules({ courseId });
      if (existingModules.length > 0) {
        await dbDeleteModules({ ids: existingModules.map((m) => m.id) });
      }
    } else {
      // Create new course
      const result = await dbCreateCourse({
        title,
        description,
        difficulty,
        estimatedDuration,
        tags,
      });
      course = result.course;
    }

    const cid = course.id || course._id;

    // Import Modules and Sections
    if (Array.isArray(modules)) {
      for (const mod of modules) {
        const { module: createdModule } = await dbCreateModule({
          courseId: cid,
          title: mod.title,
          summary: mod.summary,
          learningGoals: mod.learningGoals,
          order: mod.order,
        });

        if (Array.isArray(mod.sections)) {
          for (const sec of mod.sections) {
            await dbAddSection({
              courseId: cid,
              moduleId: createdModule.id,
              title: sec.title,
              blocks: sec.blocks,
              status: sec.status,
              summary: sec.summary,
              learningGoals: sec.learningGoals,
              estimatedDuration: sec.estimatedDuration,
              order: sec.order,
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, courseId: cid });
  } catch (error) {
    console.error('[Import API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
