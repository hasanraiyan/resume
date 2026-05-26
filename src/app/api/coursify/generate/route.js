import { NextResponse } from 'next/server';
import { EventEncoder } from '@ag-ui/encoder';
import { EventType } from '@ag-ui/core';
import { parseGenerateRequest } from '@/lib/coursify/api/parseGenerateRequest';
import { resolveGenerationAgent } from '@/lib/coursify/generation/AgentSelector';
import { requireCoursifyAuth } from '@/lib/coursify-auth';
import agentRegistry from '@/lib/agents';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';

import '@/lib/agents';
import '@/lib/agents/ai/coursify-summary-agent';

const sseEncoder = new EventEncoder();

function encodeSSE(obj) {
  return new TextEncoder().encode(sseEncoder.encodeSSE(obj));
}

// Upload research to Qdrant and return the point UUID (stored on the research doc)
async function uploadToQdrant(research) {
  try {
    const qdrantUrl = process.env.QDRANT_URL;
    if (!qdrantUrl) {
      console.log('[CoursifyGenerate] QDRANT_URL not set, skipping Qdrant upload');
      return null;
    }

    const { PollinationsEmbeddings } = await import('@/lib/coursify/PollinationsEmbeddings');
    const embeddings = new PollinationsEmbeddings();
    const text = `${research.title}\n${research.topic}`;
    const [vector] = await embeddings.embedDocuments([text]);

    const qdrantId = crypto.randomUUID();

    const res = await fetch(`${qdrantUrl}/collections/coursify_research/points`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.QDRANT_API_KEY ? { 'api-key': process.env.QDRANT_API_KEY } : {}),
      },
      body: JSON.stringify({
        points: [
          {
            id: qdrantId,
            vector,
            payload: {
              page_content: text,
              metadata: {
                slug: research.slug,
                title: research.title,
                topic: research.topic,
                createdAt: research.createdAt?.toISOString(),
              },
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Qdrant PUT failed: ${res.status}`);
    }

    console.log(`[CoursifyGenerate] Uploaded "${research.slug}" to Qdrant (id: ${qdrantId})`);
    return qdrantId;
  } catch (err) {
    console.error('[CoursifyGenerate] Qdrant upload error:', err.message);
    return null;
  }
}

export async function POST(request) {
  const parsed = await parseGenerateRequest(request);
  if (parsed.errorResponse) return parsed.errorResponse;

  const { topic, isReferenceEnabled, agent } = parsed;

  if (!topic) {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  }

  // ─── Authentication Check ───
  const authResult = await requireCoursifyAuth(request);
  const isAuthenticated = !(authResult instanceof NextResponse);

  // Restrict Pro generation to authenticated users only
  if (agent === 'pro' && !isAuthenticated) {
    return NextResponse.json(
      { error: 'Authentication required for Pro generation' },
      { status: 403 }
    );
  }

  try {
    const threadId = `coursify-${Date.now()}`;
    const runId = crypto.randomUUID();

    const stream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now();
        let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        let finalContent = '';
        let finalTitle = '';
        let finalResearchPlan = null;

        // Open the AG-UI run
        controller.enqueue(encodeSSE({ type: EventType.RUN_STARTED, threadId, runId }));

        try {
          // ─── Check Cache First ───
          await dbConnect();
          const { hashPrompt } = await import('@/lib/coursify/promptHasher');
          const CoursifyResearch = (await import('@/models/CoursifyResearch')).default;

          const promptHash = hashPrompt(topic, isReferenceEnabled);

          let cachedResearch = await CoursifyResearch.findOne({ promptHash, deletedAt: null });

          if (!cachedResearch) {
            const inputHash = hashPrompt(topic, isReferenceEnabled);
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
            if (cachedResearch.metadata?.researchPlan) {
              controller.enqueue(
                encodeSSE({
                  type: EventType.CUSTOM,
                  name: 'coursify_research_plan',
                  value: cachedResearch.metadata.researchPlan,
                })
              );
            }
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
            // STATE_SNAPSHOT: consolidated run metadata
            controller.enqueue(
              encodeSSE({
                type: EventType.STATE_SNAPSHOT,
                snapshot: {
                  title: cachedResearch.title,
                  slug: cachedResearch.slug,
                  usage: cachedResearch.usage || {},
                  researchPlan: cachedResearch.metadata?.researchPlan || null,
                  fromCache: true,
                  durationMs: Date.now() - startTime,
                },
              })
            );
            controller.enqueue(encodeSSE({ type: EventType.RUN_FINISHED, threadId, runId }));
            controller.close();
            return;
          }

          // ─── Cache Miss: Generate New Content ───
          const isDev = process.env.NODE_ENV === 'development';
          const agentId = resolveGenerationAgent(isDev, agent, isAuthenticated);

          const events = agentRegistry.streamExecute(agentId, {
            topic,
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
            } else if (event.type === EventType.CUSTOM && event.name === 'coursify_research_plan') {
              finalResearchPlan = event.value || null;
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

            let baseTitle = topic;
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
              topic,
              title: baseTitle,
              content: finalContent,
              summary,
              slug,
              promptHash,
              titleHash: hashPrompt(baseTitle, isReferenceEnabled),
              usage: { ...totalUsage, estimatedCostUSD },
              metadata: {
                durationMs: Date.now() - startTime,
                researchPlan: finalResearchPlan,
                agentId,
              },
            });

            controller.enqueue(
              encodeSSE({
                type: EventType.CUSTOM,
                name: 'coursify_persist',
                value: { slug, id: String(research._id) },
              })
            );

            // STATE_SNAPSHOT: consolidated run metadata sent once after persist
            controller.enqueue(
              encodeSSE({
                type: EventType.STATE_SNAPSHOT,
                snapshot: {
                  title: baseTitle,
                  slug,
                  usage: { ...totalUsage, estimatedCostUSD },
                  researchPlan: finalResearchPlan,
                  fromCache: false,
                  durationMs: Date.now() - startTime,
                },
              })
            );

            const qdrantId = await uploadToQdrant(research);
            if (qdrantId) {
              await CoursifyResearch.findByIdAndUpdate(research._id, { qdrantId });
            }

            try {
              const AgentExecutionLog = (await import('@/models/AgentExecutionLog')).default;
              const { AGENT_IDS: AIDS } = await import('@/lib/constants/agents');

              const recentLog = await AgentExecutionLog.findOne({
                agentId,
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
