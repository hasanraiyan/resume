import { NextResponse } from 'next/server';
import { EventEncoder } from '@ag-ui/encoder';
import { EventType } from '@ag-ui/core';
import { parseGenerateRequest } from '@/lib/coursify/api/parseGenerateRequest';
import { generateSection } from '@/lib/coursify/generation/generateSection';
import agentRegistry from '@/lib/agents';

import '@/lib/agents';

const sseEncoder = new EventEncoder();

function encodeSSE(obj) {
  return new TextEncoder().encode(sseEncoder.encodeSSE(obj));
}

export async function POST(request) {
  const parsed = await parseGenerateRequest(request);
  if (parsed.errorResponse) return parsed.errorResponse;

  // Use the already-parsed body from the common helper (avoids "Body has already been read")
  const body = parsed.body;
  const { courseName, moduleName, sectionName, learningGoals } = body;

  try {
    const sectionConfig = await generateSection({
      sectionName,
      courseName,
      moduleName,
      learningGoals,
      isReferenceEnabled: parsed.isReferenceEnabled,
      requestedAgent: parsed.agent,
    });

    const threadId = `coursify-section-${Date.now()}`;
    const runId = crypto.randomUUID();

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encodeSSE({ type: EventType.RUN_STARTED, threadId, runId }));

        try {
          const events = agentRegistry.streamExecute(sectionConfig.agentId, {
            topic: sectionConfig.topic,
            isReferenceEnabled: sectionConfig.isReferenceEnabled,
          });

          let sectionTitle = '';
          for await (const event of events) {
            if (event.type === EventType.CUSTOM && event.name === 'coursify_title') {
              sectionTitle = event.value?.text || '';
            }
            controller.enqueue(encodeSSE(event));
          }

          controller.enqueue(
            encodeSSE({
              type: EventType.STATE_SNAPSHOT,
              snapshot: { title: sectionTitle },
            })
          );

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
