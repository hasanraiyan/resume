'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Landmark, ListTree, ReceiptText, Tags } from 'lucide-react';

const FinanceChatContext = createContext(null);

const WELCOME_MESSAGE = {
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
};

function createToolStep(toolName, label, toolCallId) {
  return {
    id: toolCallId || `${toolName}-${Date.now()}`,
    type: 'tool',
    toolName,
    label,
    Icon: TOOL_ICONS[toolName] || Landmark,
    done: false,
  };
}

export function FinanceChatProvider({ children }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const sendMessage = useCallback(
    async (userMessage) => {
      if (!userMessage.trim() || isStreaming) return;

      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: userMessage.trim(),
        steps: [],
        timestamp: new Date(),
      };

      const assistantMsgId = Date.now() + 1;
      const assistantMsg = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        steps: [],
        uiBlocks: [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      abortRef.current = new AbortController();

      try {
        const chatHistory = messages
          .filter((m) => m.content)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch('/api/finance/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: userMessage.trim(), chatHistory }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(
            response.status === 403 ? 'Authentication required' : 'Failed to get response'
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';
        let hasUiBlocks = false;

        const applyStreamEvent = (event) => {
          if (event.type === 'content') {
            fullContent += event.message;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fullContent } : m))
            );
          } else if (event.type === 'tool_start') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      steps: [
                        ...(m.steps || []),
                        createToolStep(event.toolName, event.label, event.toolCallId),
                      ],
                    }
                  : m
              )
            );
          } else if (event.type === 'tool_end') {
            if ((event.uiBlocks || []).length > 0) {
              hasUiBlocks = true;
            }

            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMsgId) return m;

                const nextSteps = (m.steps || []).map((step) => {
                  const matchesById = event.toolCallId && step.id === event.toolCallId;
                  const matchesFallback =
                    !event.toolCallId &&
                    step.toolName === event.toolName &&
                    step.type === 'tool' &&
                    !step.done;

                  return matchesById || matchesFallback ? { ...step, done: true } : step;
                });

                const nextBlocks = [...(m.uiBlocks || [])];
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
                  ...m,
                  steps: nextSteps,
                  uiBlocks: nextBlocks,
                };
              })
            );
          }
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
              applyStreamEvent(JSON.parse(line));
            } catch {
              // Skip malformed lines
            }
          }
        }

        if (buffer.trim()) {
          try {
            applyStreamEvent(JSON.parse(buffer));
          } catch {
            // Ignore trailing partial payload
          }
        }

        if (!fullContent.trim() && !hasUiBlocks) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: "I wasn't able to generate a response. Please try again.",
                  }
                : m
            )
          );
        }
      } catch (error) {
        if (error.name === 'AbortError') return;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `Error: ${error.message || 'Something went wrong. Please try again.'}`,
                  steps: (m.steps || []).map((step) =>
                    step.type === 'tool' ? { ...step, done: true } : step
                  ),
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming]
  );

  const clearChat = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
    setMessages([WELCOME_MESSAGE]);
  }, []);

  return (
    <FinanceChatContext.Provider value={{ messages, sendMessage, clearChat, isStreaming }}>
      {children}
    </FinanceChatContext.Provider>
  );
}

export function useFinanceChat() {
  const context = useContext(FinanceChatContext);
  if (!context) {
    throw new Error('useFinanceChat must be used within a FinanceChatProvider');
  }
  return context;
}
