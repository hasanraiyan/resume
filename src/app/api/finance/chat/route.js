import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';

import '@/lib/agents';

function encodeEvent(obj) {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const rateLimitResponse = rateLimit(request, 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { userMessage, chatHistory = [] } = await request.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    const sessionId = `finance-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const inputParams = {
      userMessage,
      chatHistory,
      sessionId,
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const events = agentRegistry.streamExecute(AGENT_IDS.FINANCE_ASSISTANT, inputParams);

          for await (const event of events) {
            controller.enqueue(encodeEvent(event));
          }
          controller.close();
        } catch (error) {
          console.error('[Finance Chat] Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    console.error('[Finance Chat] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
