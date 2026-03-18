import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Ensure agents are imported and registered
import '@/lib/agents/index';
import agentRegistry from '@/lib/agents/AgentRegistry';
import { AGENT_IDS } from '@/lib/constants/agents';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { name, description, designSchema } = body;

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    // Use the AppBuilderAgent via the registry
    const appBuilder = agentRegistry.get(AGENT_IDS.APP_BUILDER);

    // We'll use SSE to stream the execution live to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const executionStream = await appBuilder.streamExecute({
            name,
            description,
            designSchema: designSchema || 'modern',
          });

          for await (const chunk of executionStream) {
            // Encode the chunk as an SSE data payload
            controller.enqueue(encoder.encode(`${JSON.stringify(chunk)}\n`));
          }
        } catch (err) {
          console.error('AppBuilder Stream Error:', err);
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({ type: 'error', message: err.message || 'Generation failed' })}\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('AI App Generation Failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate app' }, { status: 500 });
  }
}
