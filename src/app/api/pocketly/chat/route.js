import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { requireAdminAuth } from '@/lib/money-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';

import '@/lib/agents';

function encodeEvent(obj) {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

function isClosedStreamError(error) {
  return (
    error?.code === 'ERR_INVALID_STATE' ||
    error?.message?.includes('Controller is already closed') ||
    error?.message?.includes('ReadableStream is already closed')
  );
}

export async function POST(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  const rateLimitResponse = rateLimit(request, 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { userMessage, chatHistory = [], meta } = await request.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    const requestNow = meta?.now || new Date().toISOString();
    const sessionId = `finance-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const inputParams = {
      userMessage,
      chatHistory,
      sessionId,
      now: requestNow,
    };

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        const handleAbort = () => {
          isClosed = true;
        };

        request.signal?.addEventListener('abort', handleAbort);

        const safeEnqueue = (event) => {
          if (isClosed) return false;

          try {
            controller.enqueue(encodeEvent(event));
            return true;
          } catch (error) {
            if (isClosedStreamError(error)) {
              isClosed = true;
              return false;
            }

            throw error;
          }
        };

        const safeClose = () => {
          if (isClosed) return;

          try {
            controller.close();
          } catch (error) {
            if (!isClosedStreamError(error)) {
              throw error;
            }
          } finally {
            isClosed = true;
          }
        };

        const safeError = (error) => {
          if (isClosed) return;

          try {
            controller.error(error);
          } catch (streamError) {
            if (!isClosedStreamError(streamError)) {
              console.error('[Finance Chat] Failed to propagate stream error:', streamError);
            }
          } finally {
            isClosed = true;
          }
        };

        try {
          const events = agentRegistry.streamExecute(AGENT_IDS.FINANCE_ASSISTANT, inputParams);

          for await (const event of events) {
            if (!safeEnqueue(event)) {
              break;
            }
          }
          safeClose();
        } catch (error) {
          if (isClosedStreamError(error)) {
            return;
          }

          console.error('[Finance Chat] Stream error:', error);
          safeError(error);
        } finally {
          request.signal?.removeEventListener('abort', handleAbort);
        }
      },
      cancel() {
        // The reader went away on the client side, so stop enqueueing.
      },
    });

    return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    console.error('[Finance Chat] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
