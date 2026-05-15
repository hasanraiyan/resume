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
    try {
      const body = JSON.parse(text);
      topic = body.topic;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const events = agentRegistry.streamExecute(AGENT_IDS.COURSIFY_SEARCH, {
            topic: topic.trim(),
          });

          for await (const event of events) {
            controller.enqueue(encodeEvent(event));
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
