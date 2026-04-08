import { applyCloudStreamEventToMessages, setAssistantFallback } from './messageState';

export async function runCloudFinanceChat({
  userMessage,
  history,
  assistantMsgId,
  signal,
  setMessages,
}) {
  const chatHistory = history
    .filter((message) => message.content)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  const response = await fetch('/api/pocketly/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userMessage: userMessage.trim(), chatHistory }),
    signal,
  });

  if (!response.ok) {
    throw new Error(response.status === 403 ? 'Authentication required' : 'Failed to get response');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let hasUiBlocks = false;
  let hasContent = false;
  let buffer = '';

  const applyEvent = (event) => {
    if (event.type === 'content' && event.message) {
      hasContent = true;
    }
    if ((event.uiBlocks || []).length > 0) {
      hasUiBlocks = true;
    }

    setMessages((prev) => applyCloudStreamEventToMessages(prev, assistantMsgId, event));
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        applyEvent(JSON.parse(line));
      } catch {
        // Skip malformed lines.
      }
    }
  }

  if (buffer.trim()) {
    try {
      applyEvent(JSON.parse(buffer));
    } catch {
      // Ignore trailing partial payload.
    }
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
