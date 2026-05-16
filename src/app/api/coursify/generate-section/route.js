import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';

import '@/lib/agents';

function encodeEvent(obj) {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

export async function POST(request) {
  // Relaxed rate limit for admin studio use
  const rateLimitResponse = rateLimit(request, 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { courseName, moduleName, sectionName, learningGoals } = body;

    if (!sectionName?.trim()) {
      return NextResponse.json({ error: 'sectionName is required' }, { status: 400 });
    }

    // Construct a rich topic string since the agent only takes one "topic" field
    let richTopic = `${sectionName.trim()}\n\n`;
    richTopic += `Context for Research:\n`;
    if (courseName) richTopic += `- Part of the course: ${courseName}\n`;
    if (moduleName) richTopic += `- Within the module: ${moduleName}\n`;
    if (learningGoals?.length > 0) {
      richTopic += `- Learning Goals: ${learningGoals.join(', ')}\n`;
    }
    richTopic += `\nPlease research this specific topic and ensure the content fits this context.`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const events = agentRegistry.streamExecute(AGENT_IDS.COURSIFY_SEARCH, {
            topic: richTopic,
          });

          for await (const event of events) {
            // Forward all relevant events to client
            controller.enqueue(encodeEvent(event));
          }

          controller.enqueue(encodeEvent({ type: 'done' }));
          controller.close();
        } catch (error) {
          console.error('[CoursifySectionGenerate] Stream error:', error);
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
    console.error('[CoursifySectionGenerate] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
