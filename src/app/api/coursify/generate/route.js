import { NextResponse } from 'next/server';
import { EventEncoder } from '@ag-ui/encoder';
import { EventType } from '@ag-ui/core';
import { rateLimit } from '@/lib/rateLimit';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';

import '@/lib/agents';
import '@/lib/agents/ai/coursify-summary-agent';

const sseEncoder = new EventEncoder();

function encodeSSE(obj) {
  return new TextEncoder().encode(sseEncoder.encodeSSE(obj));
}

// Upload research to Qdrant for vector search
async function uploadToQdrant(research) {
  try {
    const { QdrantVectorStore } = await import('@langchain/qdrant');
    const { PollinationsEmbeddings } = await import('@/lib/coursify/PollinationsEmbeddings');
    const { Document } = await import('@langchain/core/documents');

    const qdrantUrl = process.env.QDRANT_URL;
    if (!qdrantUrl) {
      console.log('[CoursifyGenerate] QDRANT_URL not set, skipping Qdrant upload');
      return;
    }

    const embeddings = new PollinationsEmbeddings();
    const document = new Document({
      pageContent: `${research.title}\n${research.topic}`,
      metadata: {
        slug: research.slug,
        title: research.title,
        topic: research.topic,
        createdAt: research.createdAt?.toISOString(),
      },
    });

    await QdrantVectorStore.fromDocuments([document], embeddings, {
      url: qdrantUrl,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: 'coursify_research',
    });

    console.log(`[CoursifyGenerate] Uploaded "${research.slug}" to Qdrant`);
  } catch (err) {
    console.error('[CoursifyGenerate] Qdrant upload error:', err.message);
  }
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

    const threadId = `coursify-${Date.now()}`;
    const runId = crypto.randomUUID();

    const stream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now();
        let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        let finalContent = '';
        let finalTitle = '';

        // Open the AG-UI run
        controller.enqueue(encodeSSE({ type: EventType.RUN_STARTED, threadId, runId }));

        try {
          // ─── Check Cache First ───
          await dbConnect();
          const { hashPrompt } = await import('@/lib/coursify/promptHasher');
          const CoursifyResearch = (await import('@/models/CoursifyResearch')).default;

          const promptHash = hashPrompt(topic.trim(), isReferenceEnabled);

          let cachedResearch = await CoursifyResearch.findOne({ promptHash, deletedAt: null });

          if (!cachedResearch) {
            const inputHash = hashPrompt(topic.trim(), isReferenceEnabled);
            cachedResearch = await CoursifyResearch.findOne({
              titleHash: inputHash,
              deletedAt: null,
            });
          }

          if (cachedResearch) {
            // ─── Cache Hit ───
            controller.enqueue(
              encodeSSE({
                type: EventType.CUSTOM,
                name: 'coursify_cache_hit',
                value: { slug: cachedResearch.slug },
              })
            );
            controller.enqueue(
              encodeSSE({
                type: EventType.CUSTOM,
                name: 'coursify_title',
                value: { text: cachedResearch.title },
              })
            );
            // Emit cached content as a single TEXT_MESSAGE
            const msgId = `msg-cache-${Date.now()}`;
            controller.enqueue(
              encodeSSE({ type: EventType.TEXT_MESSAGE_START, messageId: msgId, role: 'assistant' })
            );
            controller.enqueue(
              encodeSSE({
                type: EventType.TEXT_MESSAGE_CONTENT,
                messageId: msgId,
                delta: cachedResearch.content,
              })
            );
            controller.enqueue(encodeSSE({ type: EventType.TEXT_MESSAGE_END, messageId: msgId }));
            if (cachedResearch.usage) {
              controller.enqueue(
                encodeSSE({
                  type: EventType.CUSTOM,
                  name: 'coursify_usage',
                  value: cachedResearch.usage,
                })
              );
            }
            controller.enqueue(
              encodeSSE({
                type: EventType.CUSTOM,
                name: 'coursify_persist',
                value: { slug: cachedResearch.slug, id: String(cachedResearch._id) },
              })
            );
            controller.enqueue(encodeSSE({ type: EventType.RUN_FINISHED, threadId, runId }));
            controller.close();
            return;
          }

          // ─── Cache Miss: Generate New Content ───
          const isDev = process.env.NODE_ENV === 'development';
          const agentId = isDev ? AGENT_IDS.COURSIFY_RESEARCH : AGENT_IDS.COURSIFY_SEARCH;

          const events = agentRegistry.streamExecute(agentId, {
            topic: topic.trim(),
            isReferenceEnabled: !!isReferenceEnabled,
          });

          for await (const event of events) {
            // Accumulate usage and content for persistence
            if (event.type === EventType.CUSTOM && event.name === 'coursify_usage' && event.value) {
              totalUsage.promptTokens += event.value.promptTokens || 0;
              totalUsage.completionTokens += event.value.completionTokens || 0;
              totalUsage.totalTokens += event.value.totalTokens || 0;
            } else if (event.type === EventType.TEXT_MESSAGE_CONTENT) {
              finalContent += event.delta || '';
            } else if (event.type === EventType.CUSTOM && event.name === 'coursify_title') {
              finalTitle = event.value?.text || '';
            }
            // Forward all AG-UI events to client
            controller.enqueue(encodeSSE(event));
          }

          // ─── Persistence ───
          if (finalContent) {
            const { slugify } = await import('@/utils/string');
            const { calculateEstimatedCostUSD } = await import('@/lib/agents/utils/pricing');

            const estimatedCostUSD = calculateEstimatedCostUSD(
              totalUsage.promptTokens,
              totalUsage.completionTokens
            );

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

            // Generate summary
            let summary = null;
            try {
              const summaryAgent = agentRegistry.get(AGENT_IDS.COURSIFY_SUMMARY);
              if (summaryAgent) {
                await summaryAgent.initialize();
                const summaryResult = await summaryAgent.execute({ content: finalContent });
                summary = summaryResult.summary;
                console.log('[CoursifyGenerate] Summary generated successfully');
              }
            } catch (summaryErr) {
              console.error('[CoursifyGenerate] Summary generation failed:', summaryErr.message);
            }

            const research = await CoursifyResearch.create({
              topic: topic.trim(),
              title: baseTitle,
              content: finalContent,
              summary,
              slug,
              promptHash,
              titleHash: hashPrompt(baseTitle, isReferenceEnabled),
              usage: { ...totalUsage, estimatedCostUSD },
              metadata: { durationMs: Date.now() - startTime },
            });

            controller.enqueue(
              encodeSSE({
                type: EventType.CUSTOM,
                name: 'coursify_persist',
                value: { slug, id: String(research._id) },
              })
            );

            uploadToQdrant(research).catch((err) => {
              console.error('[CoursifyGenerate] Failed to upload to Qdrant:', err);
            });

            try {
              const AgentExecutionLog = (await import('@/models/AgentExecutionLog')).default;
              const { AGENT_IDS: AIDS } = await import('@/lib/constants/agents');

              const recentLog = await AgentExecutionLog.findOne({
                agentId: AIDS.COURSIFY_SEARCH,
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

          controller.enqueue(encodeSSE({ type: EventType.RUN_FINISHED, threadId, runId }));
          controller.close();
        } catch (error) {
          console.error('[CoursifyGenerate] Stream error:', error);
          controller.enqueue(
            encodeSSE({
              type: EventType.RUN_ERROR,
              message: error.message || 'Generation failed',
              code: 'AGENT_ERROR',
            })
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
    });
  } catch (error) {
    console.error('[CoursifyGenerate] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
