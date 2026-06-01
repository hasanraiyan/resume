import { requireCoursifyAuth } from '@/lib/coursify-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyModule from '@/models/CoursifyModule';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import { dbAddSections } from '@/lib/coursify/db-ops';
import { revalidatePath } from 'next/cache';

import '@/lib/agents';
import '@/lib/agents/ai/coursify-module-planner-agent';

export async function POST(request, { params }) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    const course = await CoursifyCourse.findOne({ _id: id, deletedAt: null }).lean();
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const body = await request.json();
    const { syllabus } = body;

    if (!syllabus?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Syllabus content is required' },
        { status: 400 }
      );
    }

    // Execute the dedicated syllabus planner agent
    const plannerAgent = agentRegistry.get(AGENT_IDS.COURSIFY_MODULE_PLANNER);
    if (!plannerAgent) {
      return NextResponse.json(
        { success: false, error: 'AI planner agent not available' },
        { status: 500 }
      );
    }

    await plannerAgent.initialize();
    const result = await plannerAgent.execute({ syllabus });
    const parsed = result.plan;

    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json(
        { success: false, error: 'AI planner returned an invalid output format.' },
        { status: 500 }
      );
    }

    // 1. Resolve ordering for the new module
    const lastModule = await CoursifyModule.findOne({ courseId: id, deletedAt: null })
      .sort({ order: -1 })
      .lean();
    const resolvedOrder = lastModule ? lastModule.order + 1 : 0;

    // 2. Create the module
    const mod = await CoursifyModule.create({
      courseId: id,
      title: (parsed.title || 'Untitled Module').trim(),
      summary: parsed.summary || '',
      learningGoals: Array.isArray(parsed.learningGoals) ? parsed.learningGoals : [],
      order: resolvedOrder,
    });

    // 3. Prepare section payloads
    const sectionPayloads = (parsed.sections || []).map((s, index) => ({
      title: s.title || `Section ${index + 1}`,
      summary: s.summary || '',
      learningGoals: Array.isArray(s.learningGoals) ? s.learningGoals : [],
      moduleId: mod._id,
      order: index,
      status: 'planned',
    }));

    // 4. Create sections using standard db-ops
    const { sections } = await dbAddSections({
      courseId: id,
      sections: sectionPayloads,
    });

    if (course.slug) {
      revalidatePath(`/coursify/${course.slug}`);
    }

    return NextResponse.json({
      success: true,
      module: { ...mod.toObject(), _id: mod._id.toString(), courseId: id },
      sections,
    });
  } catch (error) {
    console.error('[Syllabus AI Planner Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
