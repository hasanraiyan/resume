import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AGENT_IDS } from '@/lib/constants/agents';

// Import the full agents module to trigger registration
import agentRegistry from '@/lib/agents/index';

/**
 * POST /api/admin/apps/approve-plan
 * Step 2: Continue build after plan approval
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { threadId, approved, name, description } = body;

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    const appBuilder = agentRegistry.get(AGENT_IDS.APP_BUILDER);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const buildStream = await appBuilder.continueBuild(
            threadId,
            approved !== false,
            { name, description } // Pass input for the new system prompt
          );

          for await (const chunk of buildStream) {
            controller.enqueue(encoder.encode(`${JSON.stringify(chunk)}\n`));
          }
        } catch (err) {
          console.error('Build Continuation Error:', err);
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({ type: 'error', message: err.message || 'Build continuation failed' })}\n`
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
    console.error('Build Continuation Failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to continue build' },
      { status: 500 }
    );
  }
}
