import { Landmark, ListTree, ReceiptText, Tags } from 'lucide-react';

export const WELCOME_MESSAGE = {
  id: 1,
  role: 'assistant',
  content:
    "Hi! I'm your Finance Assistant. I can help you understand your spending habits, track budgets, and get insights about your finances. How can I help you today?",
  steps: [],
  uiBlocks: [],
  timestamp: new Date(),
};

const TOOL_ICONS = {
  get_accounts: Landmark,
  get_analysis: ListTree,
  get_transactions: ReceiptText,
  get_categories: Tags,
  local_accounts: Landmark,
  local_analysis: ListTree,
  local_transactions: ReceiptText,
  local_categories: Tags,
};

export function createToolStep(toolName, label, toolCallId, guiRequested = false) {
  return {
    id: toolCallId || `${toolName}-${Date.now()}`,
    type: 'tool',
    toolName,
    label,
    Icon: TOOL_ICONS[toolName] || Landmark,
    done: false,
    guiRequested,
    guiRendered: false,
  };
}

export function createCompletedToolStep(
  toolName,
  label,
  guiRequested = false,
  guiRendered = false
) {
  return {
    id: `${toolName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'tool',
    toolName,
    label,
    Icon: TOOL_ICONS[toolName] || Landmark,
    done: true,
    guiRequested,
    guiRendered,
  };
}

export function createUserMessage(content) {
  return {
    id: Date.now(),
    role: 'user',
    content: content.trim(),
    steps: [],
    timestamp: new Date(),
  };
}

export function createAssistantPlaceholder(id = Date.now() + 1) {
  return {
    id,
    role: 'assistant',
    content: '',
    steps: [],
    uiBlocks: [],
    guiRequested: false,
    guiRendered: false,
    timestamp: new Date(),
  };
}

export function createAssistantMessage(content) {
  return {
    id: Date.now(),
    role: 'assistant',
    content: content.trim(),
    steps: [],
    uiBlocks: [],
    timestamp: new Date(),
  };
}

export function serializeMessagesForStorage(messages) {
  return messages.map((message) => ({
    ...message,
    timestamp:
      message.timestamp instanceof Date
        ? message.timestamp.toISOString()
        : String(message.timestamp),
  }));
}

export function restoreMessagesFromStorage(rawMessages) {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return [WELCOME_MESSAGE];
  }

  return rawMessages.map((message) => ({
    ...message,
    timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
  }));
}

export function applyCloudStreamEventToMessages(messages, assistantMsgId, event) {
  if (event.type === 'content') {
    const nextContent = messages.find((message) => message.id === assistantMsgId)?.content || '';
    const fullContent = nextContent + event.message;
    return messages.map((message) =>
      message.id === assistantMsgId ? { ...message, content: fullContent } : message
    );
  }

  if (event.type === 'tool_start') {
    return messages.map((message) =>
      message.id === assistantMsgId
        ? {
            ...message,
            steps: [
              ...(message.steps || []),
              createToolStep(event.toolName, event.label, event.toolCallId, event.guiRequested),
            ],
            guiRequested: message.guiRequested || event.guiRequested || false,
          }
        : message
    );
  }

  if (event.type === 'tool_end') {
    return messages.map((message) => {
      if (message.id !== assistantMsgId) return message;

      const nextSteps = (message.steps || []).map((step) => {
        const matchesById = event.toolCallId && step.id === event.toolCallId;
        const matchesFallback =
          !event.toolCallId &&
          step.toolName === event.toolName &&
          step.type === 'tool' &&
          !step.done;

        return matchesById || matchesFallback ? { ...step, done: true } : step;
      });

      const finalizedSteps = nextSteps.map((step) => {
        const matchesById = event.toolCallId && step.id === event.toolCallId;
        const matchesFallback =
          !event.toolCallId &&
          step.toolName === event.toolName &&
          step.type === 'tool' &&
          step.done;

        return matchesById || matchesFallback
          ? {
              ...step,
              guiRequested: event.guiRequested ?? step.guiRequested ?? false,
              guiRendered: event.guiRendered ?? step.guiRendered ?? false,
            }
          : step;
      });

      const nextBlocks = [...(message.uiBlocks || [])];
      for (const block of event.uiBlocks || []) {
        const exists = nextBlocks.some(
          (existing) =>
            existing.kind === block.kind &&
            JSON.stringify(existing.data) === JSON.stringify(block.data)
        );

        if (!exists) {
          nextBlocks.push(block);
        }
      }

      return {
        ...message,
        steps: finalizedSteps,
        uiBlocks: nextBlocks,
        guiRequested: message.guiRequested || event.guiRequested || false,
        guiRendered: message.guiRendered || event.guiRendered || (event.uiBlocks || []).length > 0,
      };
    });
  }

  return messages;
}

export function setAssistantDeviceResult(messages, assistantMsgId, result) {
  return messages.map((message) =>
    message.id === assistantMsgId
      ? {
          ...message,
          content: result.replyText,
          steps: result.steps || [],
          uiBlocks: result.uiBlocks || [],
          guiRequested: (result.steps || []).some((step) => step.guiRequested),
          guiRendered: (result.steps || []).some((step) => step.guiRendered),
        }
      : message
  );
}

export function setAssistantError(messages, assistantMsgId, errorMessage) {
  return messages.map((message) =>
    message.id === assistantMsgId
      ? {
          ...message,
          content: `Error: ${errorMessage || 'Something went wrong. Please try again.'}`,
          steps: (message.steps || []).map((step) =>
            step.type === 'tool' ? { ...step, done: true } : step
          ),
        }
      : message
  );
}

export function setAssistantFallback(messages, assistantMsgId, content) {
  return messages.map((message) =>
    message.id === assistantMsgId ? { ...message, content } : message
  );
}
