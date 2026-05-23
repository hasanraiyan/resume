import { EventType, HttpAgent } from '@ag-ui/client';
import { applyCloudStreamEventToMessages, setAssistantFallback } from './messageState';

function toAguiMessages(history, userMessage) {
  const messages = history
    .filter(
      (message) => message.content && (message.role === 'user' || message.role === 'assistant')
    )
    .map((message, index) => ({
      id: String(message.id || `finance-history-${index}`),
      role: message.role,
      content: message.content,
    }));

  messages.push({
    id: `finance-user-${Date.now()}`,
    role: 'user',
    content: userMessage.trim(),
  });

  return messages;
}

function createAbortError() {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

export async function runCloudFinanceChat({
  userMessage,
  history,
  assistantMsgId,
  chatMode = 'flash',
  signal,
  setMessages,
}) {
  const abortController = new AbortController();
  const abortRun = () => abortController.abort(signal?.reason);

  if (signal?.aborted) {
    abortRun();
  } else {
    signal?.addEventListener('abort', abortRun, { once: true });
  }

  const agent = new HttpAgent({
    url: '/api/pocketly/chat',
    threadId: `finance-${Date.now()}`,
    initialMessages: toAguiMessages(history, userMessage),
  });

  let hasUiBlocks = false;
  let hasContent = false;

  const applyEvent = (event) => {
    if (event.type === EventType.TEXT_MESSAGE_CONTENT && event.delta) {
      hasContent = true;
    }
    if (
      event.type === EventType.CUSTOM &&
      event.name === 'pocketly_ui_blocks' &&
      (event.value?.uiBlocks || []).length > 0
    ) {
      hasUiBlocks = true;
    }

    setMessages((prev) => applyCloudStreamEventToMessages(prev, assistantMsgId, event));
  };

  try {
    await agent.runAgent(
      {
        abortController,
        forwardedProps: {
          meta: { now: new Date().toISOString(), agentMode: chatMode },
        },
      },
      {
        onEvent: ({ event }) => {
          applyEvent(event);
        },
      }
    );
  } catch (error) {
    if (abortController.signal.aborted || error.name === 'AbortError') {
      throw createAbortError();
    }

    throw new Error(error.status === 403 ? 'Authentication required' : 'Failed to get response');
  } finally {
    signal?.removeEventListener('abort', abortRun);
  }

  if (!hasContent && !hasUiBlocks) {
    setMessages((prev) =>
      setAssistantFallback(
        prev,
        assistantMsgId,
        "I wasn't able to generate a response. Please try again."
      )
    );
  }
}
