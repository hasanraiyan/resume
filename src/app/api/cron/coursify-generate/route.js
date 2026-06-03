import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import agentRegistry from '@/lib/agents';
import { generateSection } from '@/lib/coursify/generation/generateSection';
import { getPollinationsBalance } from '@/lib/pollinations-balance';
import { dbUpdateSection } from '@/lib/coursify/db-ops';
import CoursifyGenJob from '@/models/CoursifyGenJob';
import CoursifyExternalJob from '@/models/CoursifyExternalJob';
import CoursifySection from '@/models/CoursifySection';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyModule from '@/models/CoursifyModule';
import CoursifyResearch from '@/models/CoursifyResearch';

import '@/lib/agents';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // platform hint: allow up to 60s

// ─── Tunables ───
const MIN_BALANCE_USD = 0.03; // stop generating once the live balance drops below this
const MAX_JOBS_PER_RUN = 10; // hard cap per cron invocation
const MAX_RUN_MS = 3_000; // wall-clock budget — just claim jobs, return fast; let them run in bg
const STALE_GENERATING_MS = 10 * 60_000; // reclaim jobs stuck "generating" this long

/**
 * Execute a section generation job asynchronously (fire-and-forget).
 * Doesn't block the cron response; errors are caught and logged.
 */
async function executeSectionJobAsync(job) {
  try {
    const section = await CoursifySection.findOne({
      _id: job.sectionId,
      deletedAt: null,
    }).lean();
    if (!section) {
      job.status = 'canceled';
      job.error = 'Section no longer exists';
      job.syncVersion += 1;
      await job.save();
      return;
    }

    const [course, mod] = await Promise.all([
      CoursifyCourse.findById(job.courseId).select('title').lean(),
      job.moduleId ? CoursifyModule.findById(job.moduleId).select('title').lean() : null,
    ]);

    const sectionConfig = await generateSection({
      sectionName: section.title,
      courseName: course?.title,
      moduleName: mod?.title,
      learningGoals: section.learningGoals || [],
      isReferenceEnabled: job.isReferenceEnabled,
      requestedAgent: 'flash',
      isAuthenticated: false,
    });

    const result = await agentRegistry.execute(sectionConfig.agentId, {
      topic: sectionConfig.topic,
      isReferenceEnabled: sectionConfig.isReferenceEnabled,
    });

    const content = (result?.content || '').trim();
    if (!content) {
      throw new Error('Generation returned empty content');
    }

    await dbUpdateSection({
      id: String(job.sectionId),
      content,
      status: 'needs_review',
    });

    job.status = 'done';
    job.usage = result.usage || null;
    job.error = '';
    job.completedAt = new Date();
    job.syncVersion += 1;
    await job.save();

    console.log(`[CronCoursifyGenerate:Async] Section job ${job._id} completed`);
  } catch (err) {
    console.error(`[CronCoursifyGenerate:Async] Section job ${job._id} failed:`, err.message);
    const message = err?.message || 'Generation failed';

    job.status = isBudgetError(message) ? 'queued' : 'failed';
    job.error = message;
    job.syncVersion += 1;
    await job.save();
  }
}

/**
 * Execute an external topic generation job asynchronously.
 * Results are stored in CoursifyResearch (not tied to sections).
 */
async function executeExternalJobAsync(job) {
  try {
    const { hashPrompt } = await import('@/lib/coursify/promptHasher');
    const promptHash = hashPrompt(job.topic, job.isReferenceEnabled);

    const result = await agentRegistry.execute('coursify-flash', {
      topic: job.topic,
      isReferenceEnabled: job.isReferenceEnabled,
    });

    const content = (result?.content || '').trim();
    if (!content) {
      throw new Error('Generation returned empty content');
    }

    // Store in CoursifyResearch (same table as web UI)
    const research = new CoursifyResearch({
      promptHash,
      title: result.title || job.topic,
      content,
      slug: result.slug,
      summary: result.summary || '',
      fromCache: false,
      usage: result.usage || null,
    });
    await research.save();

    job.status = 'done';
    job.resultSlug = research.slug;
    job.usage = result.usage || null;
    job.error = '';
    job.completedAt = new Date();
    job.syncVersion += 1;
    await job.save();

    console.log(`[CronCoursifyGenerate:External] Topic job ${job._id} -> slug ${research.slug}`);
  } catch (err) {
    console.error(`[CronCoursifyGenerate:External] Topic job ${job._id} failed:`, err.message);
    const message = err?.message || 'Generation failed';

    job.status = isBudgetError(message) ? 'queued' : 'failed';
    job.error = message;
    job.syncVersion += 1;
    await job.save();
  }
}

/**
 * Is this error caused by running out of budget / rate limiting rather than a
 * genuine content failure? Such jobs should go back to the queue, not be burned.
 */
function isBudgetError(message = '') {
  const m = message.toLowerCase();
  return (
    m.includes('balance') ||
    m.includes('insufficient') ||
    m.includes('429') ||
    m.includes('rate limit') ||
    m.includes('quota') ||
    m.includes('too many requests')
  );
}

async function readBalance() {
  try {
    const data = await getPollinationsBalance();
    if (!data || typeof data.balance !== 'number') return 0;
    return data.balance; // USD
  } catch {
    return 0;
  }
}

// GET /api/cron/coursify-generate
// Drains the CoursifyGenJob + CoursifyExternalJob queues, pacing against the live Pollinations balance.
// Trigger this from an external scheduler (e.g. cron-job.org) with header:
//   Authorization: Bearer <COURSIFY_API_KEY>
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.COURSIFY_API_KEY;
  const expectedAuth = `Bearer ${expectedKey}`;

  console.log('[CronCoursifyGenerate] Auth debug:', {
    receivedHeader: authHeader,
    expectedAuth,
    envKeySet: !!expectedKey,
    envKeyValue: expectedKey ? `${expectedKey.substring(0, 10)}...` : 'NOT SET',
  });

  if (authHeader !== expectedAuth) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        debug: {
          received: authHeader,
          expected: expectedAuth,
          envSet: !!expectedKey,
        },
      },
      { status: 401 }
    );
  }

  const startedAt = Date.now();
  const processed = [];
  let stopReason = 'empty';

  try {
    await dbConnect();

    // Reclaim jobs that got stuck mid-run (e.g. a previous invocation crashed).
    await CoursifyGenJob.updateMany(
      {
        status: 'generating',
        deletedAt: null,
        lastRunAt: { $lt: new Date(Date.now() - STALE_GENERATING_MS) },
      },
      { $set: { status: 'queued' }, $inc: { syncVersion: 1 } }
    );

    let balance = await readBalance();

    while (processed.length < MAX_JOBS_PER_RUN) {
      if (Date.now() - startedAt > MAX_RUN_MS) {
        stopReason = 'time';
        break;
      }
      if (balance < MIN_BALANCE_USD) {
        stopReason = 'budget';
        break;
      }

      // Try to claim from section jobs first, then external topic jobs
      let job = await CoursifyGenJob.findOneAndUpdate(
        { status: 'queued', deletedAt: null },
        {
          $set: { status: 'generating', lastRunAt: new Date() },
          $inc: { attempts: 1, syncVersion: 1 },
        },
        { sort: { createdAt: 1 }, new: true }
      );

      let jobType = 'section';

      if (!job) {
        // No section jobs, try external topic jobs
        job = await CoursifyExternalJob.findOneAndUpdate(
          { status: 'queued', deletedAt: null },
          {
            $set: { status: 'generating', lastRunAt: new Date() },
            $inc: { attempts: 1, syncVersion: 1 },
          },
          { sort: { createdAt: 1 }, new: true }
        );
        jobType = 'external';
      }

      if (!job) {
        stopReason = 'empty';
        break;
      }

      // Spawn the job asynchronously (fire-and-forget) — don't wait for it to complete
      if (jobType === 'section') {
        executeSectionJobAsync(job).catch((err) => {
          console.error(`[CronCoursifyGenerate] Unexpected error in section job ${job._id}:`, err);
        });
      } else {
        executeExternalJobAsync(job).catch((err) => {
          console.error(`[CronCoursifyGenerate] Unexpected error in external job ${job._id}:`, err);
        });
      }

      processed.push({
        jobId: String(job._id),
        type: jobType,
        status: 'spawned',
      });
    }

    const [sectionRemaining, externalRemaining] = await Promise.all([
      CoursifyGenJob.countDocuments({ status: 'queued', deletedAt: null }),
      CoursifyExternalJob.countDocuments({ status: 'queued', deletedAt: null }),
    ]);

    return NextResponse.json({
      ok: true,
      stopReason,
      processedCount: processed.length,
      queuedRemaining: {
        sections: sectionRemaining,
        external: externalRemaining,
        total: sectionRemaining + externalRemaining,
      },
      balance,
      durationMs: Date.now() - startedAt,
      processed,
    });
  } catch (error) {
    console.error('[CronCoursifyGenerate] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
