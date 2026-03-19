import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AGENT_IDS } from '@/lib/constants/agents';

// Import the full agents module to trigger registration
import agentRegistry from '@/lib/agents/index';
import dbConnect from '@/lib/dbConnect';
import AppModel from '@/models/App';

/**
 * POST /api/admin/apps/generate-plan
 * Step 1: Generate plan and return it for approval
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    let { name, description, initialCode, appId } = body;

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    await dbConnect();

    // Automatic Draft Creation/Loading
    let threadId = null;
    if (!appId) {
      // Create a fresh draft
      const newApp = await AppModel.create({
        name,
        description,
        content: initialCode || 'Generating...',
        type: 'ai',
        isActive: true, // Show in dashboard if desired, or keep as draft
      });
      appId = newApp._id;
      threadId = `app-build-${appId}-${Date.now()}`;
      newApp.threadId = threadId;
      await newApp.save();
    } else {
      const existingApp = await AppModel.findById(appId);
      if (existingApp) {
        threadId = existingApp.threadId || `app-build-${appId}-${Date.now()}`;
        if (!existingApp.threadId) {
          existingApp.threadId = threadId;
          await existingApp.save();
        }
      }
    }

    const appBuilder = agentRegistry.get(AGENT_IDS.APP_BUILDER);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Immediately send metadata to the frontend
          controller.enqueue(
            encoder.encode(`${JSON.stringify({ type: 'metadata', appId, threadId })}\n`)
          );

          const buildStream = await appBuilder.startBuild({
            name,
            description,
            initialCode,
            threadId, // Pass the explicit threadId
          });

          for await (const chunk of buildStream) {
            controller.enqueue(encoder.encode(`${JSON.stringify(chunk)}\n`));
          }
        } catch (err) {
          console.error('Plan Generation Error:', err);
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({ type: 'error', message: err.message || 'Plan generation failed' })}\n`
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
    console.error('Plan Generation Failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
