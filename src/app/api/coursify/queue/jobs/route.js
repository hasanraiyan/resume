import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireCoursifyAuth } from '@/lib/coursify-auth';
import CoursifyGenJob from '@/models/CoursifyGenJob';
import CoursifyExternalJob from '@/models/CoursifyExternalJob';
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

    // Fetch both section jobs and external topic jobs
    const [sectionJobs, externalJobs] = await Promise.all([
      CoursifyGenJob.find(query)
        .select(
          '_id courseId moduleId sectionId status agent attempts maxAttempts error usage createdAt updatedAt lastRunAt completedAt'
        )
        .sort(sort)
        .limit(limit)
        .lean(),
      CoursifyExternalJob.find(query)
        .select(
          '_id topic clientId status agent attempts maxAttempts error usage resultSlug createdAt updatedAt lastRunAt completedAt'
        )
        .sort(sort)
        .limit(limit)
        .lean(),
    ]);

    // Merge and sort by createdAt
    const allJobs = [
      ...sectionJobs.map((j) => ({ ...j, jobType: 'section' })),
      ...externalJobs.map((j) => ({ ...j, jobType: 'external' })),
    ].sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (allJobs.length === 0) {
      return NextResponse.json({
        success: true,
        jobs: [],
        total: 0,
      });
    }

    // Fetch related docs for section jobs only
    const sectionJobsInResults = allJobs.filter((j) => j.jobType === 'section');
    let sectionMap = {};
    let courseMap = {};
    let moduleMap = {};

    if (sectionJobsInResults.length > 0) {
      const sectionIds = [...new Set(sectionJobsInResults.map((j) => j.sectionId))];
      const courseIds = [...new Set(sectionJobsInResults.map((j) => j.courseId))];
      const moduleIds = [...new Set(sectionJobsInResults.map((j) => j.moduleId).filter(Boolean))];

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

      sectionMap = Object.fromEntries(sections.map((s) => [String(s._id), s]));
      courseMap = Object.fromEntries(courses.map((c) => [String(c._id), c]));
      moduleMap = Object.fromEntries(modules.map((m) => [String(m._id), m]));
    }

    // Enrich all jobs
    const enriched = allJobs.map((job) => {
      if (job.jobType === 'section') {
        return {
          ...job,
          id: String(job._id),
          jobType: 'section',
          sectionTitle: sectionMap[String(job.sectionId)]?.title || '(deleted)',
          courseTitle: courseMap[String(job.courseId)]?.title || '(deleted)',
          moduleTitle: job.moduleId ? moduleMap[String(job.moduleId)]?.title : null,
        };
      } else {
        // External job
        return {
          ...job,
          id: String(job._id),
          jobType: 'external',
          sectionTitle: null,
          courseTitle: job.topic, // Show topic as "course"
          moduleTitle: job.clientId, // Show client ID as "module"
        };
      }
    });

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
 * Actions: retry, cancel (works for both section and external jobs)
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

    // Try both job types
    let job = await CoursifyGenJob.findById(jobId);
    let jobType = 'section';

    if (!job) {
      job = await CoursifyExternalJob.findById(jobId);
      jobType = 'external';
    }

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
