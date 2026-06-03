import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';

export const dynamic = 'force-dynamic';

/**
 * POST /api/coursify/generate-topic/queue
 *
 * External apps (pyqdeck, etc.) queue content generation.
 * Authenticates with Bearer token (COURSIFY_API_KEY).
 *
 * Body:
 *   - topic (required): The topic/prompt to generate
 *   - isReferenceEnabled (optional, default false): Include web references
 *   - clientId (optional): External app identifier (for tracking)
 *
 * Returns:
 *   - jobId: Job identifier (track via /api/coursify/generate-topic/[jobId])
 *   - status: "queued"
 */
export async function POST(request) {
  // ─── Auth ───
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.COURSIFY_API_KEY;

  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { topic, isReferenceEnabled = false, clientId = 'unknown' } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const topicTrimmed = topic.trim();

    // Check cache first — if this exact topic was generated before, return the cached version
    const { hashPrompt } = await import('@/lib/coursify/promptHasher');
    const promptHash = hashPrompt(topicTrimmed, isReferenceEnabled);

    let cached = await CoursifyResearch.findOne({
      promptHash,
      deletedAt: null,
    });

    if (cached) {
      return NextResponse.json({
        success: true,
        jobId: String(cached._id),
        status: 'done',
        fromCache: true,
        slug: cached.slug,
        title: cached.title,
        message: 'Result returned from cache',
      });
    }

    // For external apps, we generate synchronously via a background process
    // Queue the job for the cron worker to pick up
    const job = new (await import('@/models/CoursifyExternalJob')).default({
      topic: topicTrimmed,
      isReferenceEnabled,
      clientId,
      status: 'queued',
      agent: 'flash', // Always Flash for external API
    });

    await job.save();

    return NextResponse.json({
      success: true,
      jobId: String(job._id),
      status: 'queued',
      message:
        'Job queued for generation. Check status or poll /api/coursify/generate-topic/[jobId]',
    });
  } catch (error) {
    console.error('[GenerateTopic:Queue] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
