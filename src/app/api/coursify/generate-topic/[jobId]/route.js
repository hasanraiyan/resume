import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyExternalJob from '@/models/CoursifyExternalJob';

/**
 * GET /api/coursify/generate-topic/[jobId]
 *
 * Check status of a queued/generating topic.
 * Auth: Bearer token (COURSIFY_API_KEY)
 *
 * Returns:
 *   - status: queued | generating | done | failed
 *   - slug: (if done) the slug in CoursifyResearch
 *   - error: (if failed) error message
 */
export async function GET(request, { params }) {
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.COURSIFY_API_KEY;

  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { jobId } = await params;

    const job = await CoursifyExternalJob.findById(jobId).lean();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const response = {
      success: true,
      jobId: String(job._id),
      status: job.status,
      topic: job.topic,
      clientId: job.clientId,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };

    if (job.status === 'done') {
      response.resultSlug = job.resultSlug;
      response.message = `Result ready at /api/coursify/research/${job.resultSlug}`;
    } else if (job.status === 'failed') {
      response.error = job.error;
      response.attempts = job.attempts;
    } else if (job.status === 'generating') {
      response.message = 'Generation in progress...';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GenerateTopic:Status] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
