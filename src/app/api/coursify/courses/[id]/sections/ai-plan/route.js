import { requireCoursifyAuth } from '@/lib/coursify-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import { dbAddSections } from '@/lib/coursify/db-ops';
import { revalidatePath } from 'next/cache';

import '@/lib/agents';
import '@/lib/agents/ai/coursify-section-planner-agent';

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
    const { detail, moduleId } = body;

    if (!detail?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Section detail is required' },
        { status: 400 }
      );
    }

    // Execute the dedicated section planner agent
    const plannerAgent = agentRegistry.get(AGENT_IDS.COURSIFY_SECTION_PLANNER);
    if (!plannerAgent) {
      return NextResponse.json(
        { success: false, error: 'AI section planner agent not available' },
        { status: 500 }
      );
    }

    await plannerAgent.initialize();
    const result = await plannerAgent.execute({ detail });
    const parsed = result.plan;

    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json(
        { success: false, error: 'AI planner returned an invalid output format.' },
        { status: 500 }
      );
    }

    // Create the section using standard db-ops
    const sectionPayload = {
      title: (parsed.title || 'Untitled Section').trim(),
      summary: parsed.summary || '',
      learningGoals: Array.isArray(parsed.learningGoals) ? parsed.learningGoals : [],
      moduleId: moduleId || null,
      status: 'planned',
    };

    const { sections } = await dbAddSections({
      courseId: id,
      sections: [sectionPayload],
    });

    if (course.slug) {
      revalidatePath(`/coursify/${course.slug}`);
    }

    return NextResponse.json({
      success: true,
      section: sections[0],
    });
  } catch (error) {
    console.error('[Section AI Planner Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
