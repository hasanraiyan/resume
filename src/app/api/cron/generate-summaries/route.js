import { NextResponse } from 'next/server';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';

import '@/lib/agents';
import '@/lib/agents/ai/coursify-summary-agent';

// GET /api/cron/generate-summaries
// Called by Vercel Cron - generates summaries for research that don't have one yet
export async function GET(request) {
  // Protect with CRON_API_KEY
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    // Find research without summary (limit to avoid timeout)
    const BATCH_LIMIT = 10;
    const records = await CoursifyResearch.find({
      summary: { $exists: false },
      deletedAt: null,
    })
      .limit(BATCH_LIMIT)
      .sort({ createdAt: -1 });

    if (records.length === 0) {
      return NextResponse.json({ message: 'All research has summaries', processed: 0 });
    }

    // Initialize SummaryAgent
    const summaryAgent = agentRegistry.get(AGENT_IDS.COURSIFY_SUMMARY);
    if (!summaryAgent) {
      return NextResponse.json({ error: 'SummaryAgent not available' }, { status: 500 });
    }
    await summaryAgent.initialize();

    let success = 0;
    let failed = 0;
    const results = [];

    for (const record of records) {
      try {
        const result = await summaryAgent.execute({ content: record.content });
        record.summary = result.summary;
        await record.save();
        results.push({ slug: record.slug, status: 'success' });
        success++;
      } catch (err) {
        results.push({ slug: record.slug, status: 'failed', error: err.message });
        failed++;
      }
    }

    return NextResponse.json({
      message: `Processed ${records.length} records`,
      success,
      failed,
      results,
    });
  } catch (error) {
    console.error('[CronGenerateSummaries] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
