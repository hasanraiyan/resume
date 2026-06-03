import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireCoursifyAuth } from '@/lib/coursify-auth';
import CoursifyGenJob from '@/models/CoursifyGenJob';
import CoursifySection from '@/models/CoursifySection';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyModule from '@/models/CoursifyModule';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coursify/queue/jobs
 * Returns all generation queue jobs with section/course/module details.
 *
 * Query params:
 *   - status: 'queued' | 'generating' | 'done' | 'failed' | 'canceled'
 *   - courseId: filter by course
 *   - sort: 'newest' | 'oldest' | 'status' (default: 'newest')
 *   - limit: 50 (default)
 */
export async function GET(request) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const statusFilter = searchParams.get('status');
    const courseIdFilter = searchParams.get('courseId');
    const sortBy = searchParams.get('sort') || 'newest';
    const limit = Math.min(parseInt(searchParams.get('limit')) || 50, 200);

    // Build query
    const query = { deletedAt: null };
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (courseIdFilter) {
      query.courseId = courseIdFilter;
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'status':
        sort = { status: 1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
    }

    // Fetch jobs
    const jobs = await CoursifyGenJob.find(query)
      .select(
        '_id courseId moduleId sectionId status agent attempts maxAttempts error usage createdAt updatedAt lastRunAt completedAt'
      )
      .sort(sort)
      .limit(limit)
      .lean();

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        jobs: [],
        total: 0,
      });
    }

    // Fetch related section/course/module in parallel
    const sectionIds = [...new Set(jobs.map((j) => j.sectionId))];
    const courseIds = [...new Set(jobs.map((j) => j.courseId))];
    const moduleIds = [...new Set(jobs.map((j) => j.moduleId).filter(Boolean))];

    const [sections, courses, modules] = await Promise.all([
      CoursifySection.find({ _id: { $in: sectionIds }, deletedAt: null })
        .select('_id title')
        .lean(),
      CoursifyCourse.find({ _id: { $in: courseIds }, deletedAt: null })
        .select('_id title')
        .lean(),
      moduleIds.length > 0
        ? CoursifyModule.find({ _id: { $in: moduleIds }, deletedAt: null })
            .select('_id title')
            .lean()
        : Promise.resolve([]),
    ]);

    const sectionMap = Object.fromEntries(sections.map((s) => [String(s._id), s]));
    const courseMap = Object.fromEntries(courses.map((c) => [String(c._id), c]));
    const moduleMap = Object.fromEntries(modules.map((m) => [String(m._id), m]));

    // Enrich jobs
    const enriched = jobs.map((job) => ({
      ...job,
      id: String(job._id),
      sectionTitle: sectionMap[String(job.sectionId)]?.title || '(deleted)',
      courseTitle: courseMap[String(job.courseId)]?.title || '(deleted)',
      moduleTitle: job.moduleId ? moduleMap[String(job.moduleId)]?.title : null,
    }));

    return NextResponse.json({
      success: true,
      jobs: enriched,
      total: enriched.length,
    });
  } catch (error) {
    console.error('[CoursifyQueueJobs:GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/coursify/queue/jobs/:action
 * Actions: retry, cancel
 */
export async function POST(request) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const body = await request.json();
    const { jobId, action } = body;

    if (!jobId || !action) {
      return NextResponse.json(
        { success: false, error: 'jobId and action are required' },
        { status: 400 }
      );
    }

    const job = await CoursifyGenJob.findById(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (action === 'retry') {
      if (job.status !== 'failed') {
        return NextResponse.json(
          { success: false, error: 'Only failed jobs can be retried' },
          { status: 400 }
        );
      }
      job.status = 'queued';
      job.error = '';
      job.attempts = 0;
      job.syncVersion += 1;
      await job.save();
      return NextResponse.json({ success: true, message: 'Job requeued' });
    }

    if (action === 'cancel') {
      if (!['queued', 'generating'].includes(job.status)) {
        return NextResponse.json(
          { success: false, error: 'Only queued/generating jobs can be canceled' },
          { status: 400 }
        );
      }
      job.status = 'canceled';
      job.error = 'Manually canceled by user';
      job.syncVersion += 1;
      await job.save();
      return NextResponse.json({ success: true, message: 'Job canceled' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[CoursifyQueueJobs:POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
