import { Landmark, ListTree, ReceiptText, Tags } from 'lucide-react';
import { EventType } from '@ag-ui/core';

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

export function createUserMessage(content, images = []) {
  return {
    id: Date.now(),
    role: 'user',
    content: content.trim(),
    images: images.length > 0 ? images : undefined,
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
    // Strip non-serializable fields (React components) from steps.
    // Icons will be restored from toolName on deserialization.
    steps: (message.steps || []).map((step) => {
      const { Icon, ...rest } = step;
      return rest;
    }),
  }));
}

export function restoreMessagesFromStorage(rawMessages) {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return [];
  }

  return rawMessages.map((message) => ({
    ...message,
    timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
    // Restore Icon components from toolName lookup.
    steps: (message.steps || []).map((step) => ({
      ...step,
      Icon: TOOL_ICONS[step.toolName] || Landmark,
    })),
  }));
}

export function applyCloudStreamEventToMessages(messages, assistantMsgId, event) {
  if (event.type === 'content' || event.type === EventType.TEXT_MESSAGE_CONTENT) {
    const target = messages.find((message) => message.id === assistantMsgId);
    if (!target) return messages;

    const hasBlockingUi = (target.uiBlocks || []).some(
      (block) => block.kind === 'mcq_question' || block.kind === 'mcq_question_group'
    );

    // If we already showed an MCQ clarification UI for this assistant turn,
    // ignore any further text tokens so the user only sees the question card.
    if (hasBlockingUi) {
      return messages;
    }

    const nextContent = target.content || '';
    const fullContent = nextContent + (event.message || event.delta || '');
    return messages.map((message) =>
      message.id === assistantMsgId ? { ...message, content: fullContent } : message
    );
  }

  if (event.type === 'tool_start' || event.type === EventType.TOOL_CALL_START) {
    const toolName = event.toolName || event.toolCallName;
    return messages.map((message) =>
      message.id === assistantMsgId
        ? {
            ...message,
            steps: [
              ...(message.steps || []),
              createToolStep(
                toolName,
                event.label || toolName || 'Using tool',
                event.toolCallId,
                event.guiRequested
              ),
            ],
            guiRequested: message.guiRequested || event.guiRequested || false,
          }
        : message
    );
  }

  if (event.type === 'tool_end' || event.type === EventType.TOOL_CALL_END) {
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

      const hasBlockingUi = (event.uiBlocks || []).some(
        (block) => block.kind === 'mcq_question' || block.kind === 'mcq_question_group'
      );

      return {
        ...message,
        // If this event introduced an MCQ clarification UI, clear any accumulated
        // assistant text so the user just sees the question card.
        content: hasBlockingUi ? '' : message.content,
        steps: finalizedSteps,
        uiBlocks: nextBlocks,
        guiRequested: message.guiRequested || event.guiRequested || false,
        guiRendered: message.guiRendered || event.guiRendered || (event.uiBlocks || []).length > 0,
      };
    });
  }

  if (event.type === EventType.CUSTOM && event.name === 'pocketly_ui_blocks') {
    const {
      toolName,
      toolCallId,
      uiBlocks = [],
      guiRequested = false,
      guiRendered = uiBlocks.length > 0,
    } = event.value || {};

    return messages.map((message) => {
      if (message.id !== assistantMsgId) return message;

      const nextSteps = (message.steps || []).map((step) => {
        const matchesById = toolCallId && step.id === toolCallId;
        const matchesFallback =
          !toolCallId && toolName && step.toolName === toolName && step.type === 'tool';

        return matchesById || matchesFallback
          ? {
              ...step,
              guiRequested,
              guiRendered,
            }
          : step;
      });

      const nextBlocks = [...(message.uiBlocks || [])];
      for (const block of uiBlocks) {
        const exists = nextBlocks.some(
          (existing) =>
            existing.kind === block.kind &&
            JSON.stringify(existing.data) === JSON.stringify(block.data)
        );

        if (!exists) {
          nextBlocks.push(block);
        }
      }

      const hasBlockingUi = uiBlocks.some(
        (block) => block.kind === 'mcq_question' || block.kind === 'mcq_question_group'
      );

      return {
        ...message,
        content: hasBlockingUi ? '' : message.content,
        steps: nextSteps,
        uiBlocks: nextBlocks,
        guiRequested: message.guiRequested || guiRequested,
        guiRendered: message.guiRendered || guiRendered,
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
