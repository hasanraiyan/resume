import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';

import '@/lib/agents';
import '@/lib/agents/ai/coursify-summary-agent';

export async function POST(request) {
  const rateLimitResponse = rateLimit(request, 3, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    await dbConnect();

    const research = await CoursifyResearch.findOne({ slug, deletedAt: null });
    if (!research) {
      return NextResponse.json({ error: 'Research not found' }, { status: 404 });
    }

    // If summary already exists, return it
    if (research.summary) {
      return NextResponse.json({ summary: research.summary, cached: true });
    }

    // Generate summary
    const summaryAgent = agentRegistry.get(AGENT_IDS.COURSIFY_SUMMARY);
    if (!summaryAgent) {
      return NextResponse.json({ error: 'SummaryAgent not available' }, { status: 500 });
    }

    await summaryAgent.initialize();
    const result = await summaryAgent.execute({ content: research.content });

    // Save summary
    research.summary = result.summary;
    await research.save();

    return NextResponse.json({ summary: result.summary, cached: false });
  } catch (error) {
    console.error('[CoursifySummary] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
