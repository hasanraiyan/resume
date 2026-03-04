/**
 * @fileoverview Chat API route for handling AI-powered chatbot interactions.
 * Uses the BaseAgent architecture via AgentRegistry for streaming responses.
 */

import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';

// Ensure agents are imported and registered
import '@/lib/agents';

function encodeEvent(obj) {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

export async function POST(request) {
  const rateLimitResponse = rateLimit(request, 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const {
      userMessage,
      chatHistory = [],
      sessionId: providedSessionId,
      path = '/',
      activeMCPs = [],
      agentId,
      topic,
    } = await request.json();

    const sessionId =
      providedSessionId || `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (!userMessage)
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';

    const inputParams = {
      userMessage,
      chatHistory,
      sessionId,
      path,
      activeMCPs,
      isAdmin,
      ...(topic && { topic }),
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const targetAgentId = agentId || AGENT_IDS.CHAT_FAST;
          const events = agentRegistry.streamExecute(targetAgentId, inputParams);

          for await (const event of events) {
            controller.enqueue(encodeEvent(event));
          }
          controller.close();
        } catch (error) {
          console.error('[Chat] Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    console.error('[Chat] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
