import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';

import '@/lib/agents';

function encodeEvent(obj) {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

export async function POST(request) {
  const rateLimitResponse = rateLimit(request, 5, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const text = await request.text();
    if (!text) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    let topic;
    let isReferenceEnabled = false;
    try {
      const body = JSON.parse(text);
      topic = body.topic;
      isReferenceEnabled = body.isReferenceEnabled;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now();
        let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        let finalContent = '';
        let finalTitle = '';

        try {
          const events = agentRegistry.streamExecute(AGENT_IDS.COURSIFY_SEARCH, {
            topic: topic.trim(),
            isReferenceEnabled: !!isReferenceEnabled,
          });

          for await (const event of events) {
            if (event.type === 'usage' && event.data) {
              totalUsage.promptTokens += event.data.promptTokens || 0;
              totalUsage.completionTokens += event.data.completionTokens || 0;
              totalUsage.totalTokens += event.data.totalTokens || 0;
            } else if (event.type === 'content') {
              finalContent += event.message || '';
            } else if (event.type === 'title') {
              finalTitle = event.text;
            }
            // Forward all events including tool calls to client
            controller.enqueue(encodeEvent(event));
          }

          // ─── Persistence Logic ───
          if (finalContent) {
            await dbConnect();
            const { slugify } = await import('@/utils/string');
            const { calculateEstimatedCostUSD } = await import('@/lib/agents/utils/pricing');
            const CoursifyResearch = (await import('@/models/CoursifyResearch')).default;

            const estimatedCostUSD = calculateEstimatedCostUSD(
              totalUsage.promptTokens,
              totalUsage.completionTokens
            );

            // Extract title from content (first # header) or fallback to topic
            let baseTitle = topic.trim();
            const titleMatch = finalContent.match(/^#\s+(.+)$/m);
            if (titleMatch && titleMatch[1]) {
              baseTitle = titleMatch[1].trim();
            }

            let slug = slugify(baseTitle);
            let isUnique = false;
            let attempts = 0;

            while (!isUnique && attempts < 5) {
              const existing = await CoursifyResearch.findOne({ slug, deletedAt: null });
              if (existing) {
                const suffix = Math.random().toString(36).substring(2, 6);
                slug = `${slugify(baseTitle)}-${suffix}`;
                attempts++;
              } else {
                isUnique = true;
              }
            }

            const research = await CoursifyResearch.create({
              topic: topic.trim(),
              title: baseTitle,
              content: finalContent,
              slug,
              usage: {
                ...totalUsage,
                estimatedCostUSD,
              },
              metadata: {
                durationMs: Date.now() - startTime,
              },
            });

            // Emit the slug so the client can redirect/show link
            controller.enqueue(encodeEvent({ type: 'persist', slug, id: research._id }));

            // Update the execution log to link to this artifact
            try {
              const AgentExecutionLog = (await import('@/models/AgentExecutionLog')).default;
              const { AGENT_IDS } = await import('@/lib/constants/agents');

              // Find the most recent log for this agent created in the last minute
              const recentLog = await AgentExecutionLog.findOne({
                agentId: AGENT_IDS.COURSIFY_SEARCH,
                createdAt: { $gt: new Date(Date.now() - 60000) },
                outputSlug: { $exists: false },
              }).sort({ createdAt: -1 });

              if (recentLog) {
                recentLog.outputSlug = slug;
                recentLog.outputId = research._id;
                await recentLog.save();
              }
            } catch (logErr) {
              console.error('[CoursifyGenerate] Failed to link execution log:', logErr);
            }
          }

          controller.enqueue(encodeEvent({ type: 'done' }));
          controller.close();
        } catch (error) {
          console.error('[CoursifyGenerate] Stream error:', error);
          controller.enqueue(
            encodeEvent({ type: 'error', message: error.message || 'Generation failed' })
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('[CoursifyGenerate] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
