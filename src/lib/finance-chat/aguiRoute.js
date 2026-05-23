import { NextResponse } from 'next/server';
import { EventType } from '@ag-ui/core';
import { EventEncoder } from '@ag-ui/encoder';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';

const sseEncoder = new EventEncoder();

function encodeSSE(event) {
  return new TextEncoder().encode(sseEncoder.encodeSSE(event));
}

function isClosedStreamError(error) {
  return (
    error?.code === 'ERR_INVALID_STATE' ||
    error?.message?.includes('Controller is already closed') ||
    error?.message?.includes('ReadableStream is already closed')
  );
}

function getMessageText(content) {
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part?.type === 'text' && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('');
  }

  return '';
}

function normalizeChatHistory(messages, lastUserIndex) {
  return messages
    .slice(0, Math.max(lastUserIndex, 0))
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: getMessageText(message.content),
    }))
    .filter((message) => message.content);
}

function buildFinanceAgentInput(body) {
  const aguiMessages = Array.isArray(body.messages) ? body.messages : [];
  const lastUserIndex = aguiMessages.findLastIndex((message) => message.role === 'user');
  const lastUserMessage = lastUserIndex >= 0 ? aguiMessages[lastUserIndex] : null;
  const forwardedMeta = body.forwardedProps?.meta || {};
  const meta = body.meta || forwardedMeta;
  const agentMode = meta?.agentMode || body.agentMode || body.mode || 'flash';
  const userMessage = body.userMessage || getMessageText(lastUserMessage?.content);
  const chatHistory = Array.isArray(body.chatHistory)
    ? body.chatHistory
    : normalizeChatHistory(aguiMessages, lastUserIndex);

  return {
    threadId: body.threadId || `finance-${Date.now()}`,
    runId: body.runId || crypto.randomUUID(),
    inputParams: {
      userMessage,
      chatHistory,
      sessionId: body.threadId || `finance-${Date.now()}`,
      now: meta?.now || new Date().toISOString(),
      agentMode,
    },
  };
}

function resolveFinanceAgentId(agentMode) {
  if (agentMode === 'pro') return AGENT_IDS.FINANCE_PRO;
  if (agentMode === 'flash') return AGENT_IDS.FINANCE_FLASH;
  return AGENT_IDS.FINANCE_FLASH;
}

export async function createFinanceChatAGUIResponse(request, logPrefix = 'Finance Chat') {
  const body = await request.json();
  const { threadId, runId, inputParams } = buildFinanceAgentInput(body);

  if (!inputParams.userMessage) {
    return NextResponse.json({ error: 'User message is required' }, { status: 400 });
  }

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
          controller.enqueue(encodeSSE(event));
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

      try {
        if (!safeEnqueue({ type: EventType.RUN_STARTED, threadId, runId })) {
          return;
        }

        const events = agentRegistry.streamExecute(
          resolveFinanceAgentId(inputParams.agentMode),
          inputParams
        );

        for await (const event of events) {
          if (!safeEnqueue(event)) {
            break;
          }
        }

        safeEnqueue({ type: EventType.RUN_FINISHED, threadId, runId });
        safeClose();
      } catch (error) {
        if (isClosedStreamError(error)) {
          return;
        }

        console.error(`[${logPrefix}] Stream error:`, error);
        safeEnqueue({
          type: EventType.RUN_ERROR,
          message: error.message || 'Internal server error',
          code: 'AGENT_ERROR',
        });
        safeClose();
      } finally {
        request.signal?.removeEventListener('abort', handleAbort);
      }
    },
    cancel() {
      // The reader went away on the client side, so stop enqueueing.
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
