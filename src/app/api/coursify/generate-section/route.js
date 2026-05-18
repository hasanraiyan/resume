import { NextResponse } from 'next/server';
import { EventEncoder } from '@ag-ui/encoder';
import { EventType } from '@ag-ui/core';
import { rateLimit } from '@/lib/rateLimit';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';

import '@/lib/agents';

const sseEncoder = new EventEncoder();

function encodeSSE(obj) {
  return new TextEncoder().encode(sseEncoder.encodeSSE(obj));
}

export async function POST(request) {
  const rateLimitResponse = rateLimit(request, 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { courseName, moduleName, sectionName, learningGoals, isReferenceEnabled } = body;

    if (!sectionName?.trim()) {
      return NextResponse.json({ error: 'sectionName is required' }, { status: 400 });
    }

    let richTopic = `${sectionName.trim()}\n\n`;
    richTopic += `Context for Research:\n`;
    if (courseName) richTopic += `- Part of the course: ${courseName}\n`;
    if (moduleName) richTopic += `- Within the module: ${moduleName}\n`;
    if (learningGoals?.length > 0) {
      richTopic += `- Learning Goals: ${learningGoals.join(', ')}\n`;
    }
    richTopic += `\nPlease research this specific topic and ensure the content fits this context.`;

    const threadId = `coursify-section-${Date.now()}`;
    const runId = crypto.randomUUID();

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encodeSSE({ type: EventType.RUN_STARTED, threadId, runId }));

        try {
          const isDev = process.env.NODE_ENV === 'development';
          const agentId = isDev ? AGENT_IDS.COURSIFY_RESEARCH : AGENT_IDS.COURSIFY_SEARCH;

          const events = agentRegistry.streamExecute(agentId, {
            topic: richTopic,
            isReferenceEnabled,
          });

          for await (const event of events) {
            controller.enqueue(encodeSSE(event));
          }

          controller.enqueue(encodeSSE({ type: EventType.RUN_FINISHED, threadId, runId }));
          controller.close();
        } catch (error) {
          console.error('[CoursifySectionGenerate] Stream error:', error);
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
    console.error('[CoursifySectionGenerate] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
