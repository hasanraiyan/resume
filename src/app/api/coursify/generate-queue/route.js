import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireCoursifyAuth } from '@/lib/coursify-auth';
import CoursifyGenJob from '@/models/CoursifyGenJob';
import CoursifySection from '@/models/CoursifySection';

export const dynamic = 'force-dynamic';

const PENDING = ['queued', 'generating'];

/**
 * POST /api/coursify/generate-queue
 *
 * Enqueue sections for background AI content generation.
 *
 * Body:
 *   - courseId   (required)
 *   - moduleId   (optional) — limit a bulk queue to one module
 *   - sectionIds (optional) — queue these exact sections (regenerate allowed)
 *   - agent      'flash' | 'pro'  (default 'flash')
 *   - isReferenceEnabled (default false)
 *
 * When sectionIds is omitted, every EMPTY section in the course/module is queued.
 * Sections that already have a queued/generating job are skipped.
 */
export async function POST(request) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const body = await request.json();
    // Always Flash for the queue — never Pro (paid provider)
    const { courseId, moduleId, sectionIds, isReferenceEnabled = false } = body;
    const agent = 'flash';

    if (!courseId) {
      return NextResponse.json({ success: false, error: 'courseId is required' }, { status: 400 });
    }

    // ─── Resolve target sections ───
    const filter = { courseId, deletedAt: null };
    let explicit = false;

    if (Array.isArray(sectionIds) && sectionIds.length > 0) {
      filter._id = { $in: sectionIds };
      explicit = true; // explicit selection → allow regenerating non-empty sections
    } else if (moduleId) {
      filter.moduleId = moduleId;
    }

    const sections = await CoursifySection.find(filter)
      .select('_id moduleId content learningGoals')
      .lean();

    // Bulk mode only targets empty sections with learning goals defined; explicit mode targets whatever was asked.
    const candidates = explicit
      ? sections
      : sections.filter(
          (s) =>
            (!s.content || !s.content.trim()) &&
            Array.isArray(s.learningGoals) &&
            s.learningGoals.length > 0
        );

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        queued: 0,
        skipped: sections.length,
        message: `No sections ready to queue. ${
          sections.length > 0
            ? 'Sections without content need learning goals filled in first.'
            : 'All sections have content.'
        }`,
      });
    }

    // ─── Skip sections that already have a pending job ───
    const candidateIds = candidates.map((s) => s._id);
    const existing = await CoursifyGenJob.find({
      sectionId: { $in: candidateIds },
      status: { $in: PENDING },
      deletedAt: null,
    })
      .select('sectionId')
      .lean();
    const alreadyQueued = new Set(existing.map((j) => String(j.sectionId)));

    const toCreate = candidates
      .filter((s) => !alreadyQueued.has(String(s._id)))
      .map((s) => ({
        courseId,
        moduleId: s.moduleId || moduleId || null,
        sectionId: s._id,
        agent: agent === 'pro' ? 'pro' : 'flash',
        isReferenceEnabled: !!isReferenceEnabled,
        status: 'queued',
      }));

    if (toCreate.length > 0) {
      await CoursifyGenJob.insertMany(toCreate);
    }

    return NextResponse.json({
      success: true,
      queued: toCreate.length,
      skipped: candidates.length - toCreate.length,
    });
  } catch (error) {
    console.error('[CoursifyGenerateQueue:POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/coursify/generate-queue?courseId=...
 * Returns queue status counts + per-section job status for the course.
 */
export async function GET(request) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ success: false, error: 'courseId is required' }, { status: 400 });
    }

    const jobs = await CoursifyGenJob.find({ courseId, deletedAt: null })
      .select('sectionId status error attempts updatedAt')
      .sort({ createdAt: 1 })
      .lean();

    const counts = jobs.reduce(
      (acc, j) => {
        acc[j.status] = (acc[j.status] || 0) + 1;
        return acc;
      },
      { queued: 0, generating: 0, done: 0, failed: 0, canceled: 0 }
    );

    const bySection = {};
    for (const j of jobs) {
      // Most recent job wins (jobs are sorted ascending by createdAt).
      bySection[String(j.sectionId)] = {
        status: j.status,
        error: j.error || '',
        attempts: j.attempts,
      };
    }

    return NextResponse.json({ success: true, counts, bySection });
  } catch (error) {
    console.error('[CoursifyGenerateQueue:GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
