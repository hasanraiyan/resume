'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { Landmark, ListTree, ReceiptText, Tags } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';
import { getDeviceAiAvailability, runDeviceFinanceChat } from '@/lib/finance-ai/deviceFinanceChat';

const FinanceChatContext = createContext(null);

const CHAT_MODE_STORAGE_KEY = 'pocketly-finance-chat-mode';
const DEVICE_CHAT_STORAGE_KEY = 'pocketly-finance-device-chat';

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

function createToolStep(toolName, label, toolCallId, guiRequested = false) {
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

function serializeMessagesForStorage(messages) {
  return messages.map((message) => ({
    ...message,
    timestamp:
      message.timestamp instanceof Date
        ? message.timestamp.toISOString()
        : String(message.timestamp),
  }));
}

function restoreMessagesFromStorage(rawMessages) {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return [WELCOME_MESSAGE];
  }

  return rawMessages.map((message) => ({
    ...message,
    timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
  }));
}

export function FinanceChatProvider({ children }) {
  const { accounts, categories, transactions, analysis } = useMoney();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMode, setChatModeState] = useState('cloud');
  const [deviceAvailability, setDeviceAvailability] = useState({
    supported: false,
    reason: '',
  });
  const abortRef = useRef(null);
  const pendingDraftRef = useRef(null);

  useEffect(() => {
    const availability = getDeviceAiAvailability();
    setDeviceAvailability(availability);

    try {
      const savedMode = window.localStorage.getItem(CHAT_MODE_STORAGE_KEY);
      if (savedMode === 'device' && availability.supported) {
        setChatModeState('device');
      } else {
        setChatModeState('cloud');
      }

      const savedDeviceChat = window.localStorage.getItem(DEVICE_CHAT_STORAGE_KEY);
      if (savedDeviceChat) {
        const parsed = JSON.parse(savedDeviceChat);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(restoreMessagesFromStorage(parsed.messages));
        }
        pendingDraftRef.current = parsed.pendingDraft || null;
      }
    } catch {
      // Ignore unavailable or malformed local storage payloads.
    }
  }, []);

  useEffect(() => {
    if (chatMode !== 'device') return;

    try {
      window.localStorage.setItem(
        DEVICE_CHAT_STORAGE_KEY,
        JSON.stringify({
          messages: serializeMessagesForStorage(messages),
          pendingDraft: pendingDraftRef.current,
        })
      );
    } catch {
      // Ignore local storage write failures.
    }
  }, [chatMode, messages]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_MODE_STORAGE_KEY, chatMode);
    } catch {
      // Ignore local storage write failures.
    }
  }, [chatMode]);

  const setChatMode = useCallback(
    (nextMode) => {
      if (nextMode === 'device' && !deviceAvailability.supported) {
        return;
      }

      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      setIsStreaming(false);
      setChatModeState(nextMode);
    },
    [deviceAvailability.supported]
  );

  const appendAssistantMessage = useCallback((content) => {
    if (!content?.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'assistant',
        content: content.trim(),
        steps: [],
        uiBlocks: [],
        timestamp: new Date(),
      },
    ]);
  }, []);

  const sendCloudMessage = useCallback(
    async (userMessage, assistantMsgId) => {
      const chatHistory = messages
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/pocketly/chat', {
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
                      createToolStep(
                        event.toolName,
                        event.label,
                        event.toolCallId,
                        event.guiRequested
                      ),
                    ],
                    guiRequested: m.guiRequested || event.guiRequested || false,
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
                steps: finalizedSteps,
                uiBlocks: nextBlocks,
                guiRequested: m.guiRequested || event.guiRequested || false,
                guiRendered:
                  m.guiRendered || event.guiRendered || (event.uiBlocks || []).length > 0,
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
            // Skip malformed lines.
          }
        }
      }

      if (buffer.trim()) {
        try {
          applyStreamEvent(JSON.parse(buffer));
        } catch {
          // Ignore trailing partial payload.
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
    },
    [messages]
  );

  const sendDeviceMessage = useCallback(
    async (userMessage, assistantMsgId) => {
      const history = messages.filter((message) => message.id !== assistantMsgId);
      const result = await runDeviceFinanceChat({
        userMessage,
        history,
        accounts,
        categories,
        transactions,
        analysis,
        pendingDraft: pendingDraftRef.current,
        signal: abortRef.current.signal,
      });

      pendingDraftRef.current = result.pendingDraft || null;

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMsgId
            ? {
                ...message,
                content: result.replyText,
                uiBlocks: result.uiBlocks || [],
              }
            : message
        )
      );
    },
    [accounts, analysis, categories, messages, transactions]
  );

  const sendMessage = useCallback(
    async (userMessage) => {
      if (!userMessage.trim() || isStreaming) return;

      if (chatMode === 'device' && !deviceAvailability.supported) {
        appendAssistantMessage(deviceAvailability.reason);
        return;
      }

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
        guiRequested: false,
        guiRendered: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      abortRef.current = new AbortController();

      try {
        if (chatMode === 'device') {
          await sendDeviceMessage(userMessage, assistantMsgId);
        } else {
          await sendCloudMessage(userMessage, assistantMsgId);
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
    [
      appendAssistantMessage,
      chatMode,
      deviceAvailability.reason,
      deviceAvailability.supported,
      isStreaming,
      sendCloudMessage,
      sendDeviceMessage,
    ]
  );

  const clearChat = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    pendingDraftRef.current = null;
    setIsStreaming(false);
    setMessages([WELCOME_MESSAGE]);

    try {
      window.localStorage.removeItem(DEVICE_CHAT_STORAGE_KEY);
    } catch {
      // Ignore local storage removal failures.
    }
  }, []);

  const value = useMemo(
    () => ({
      messages,
      sendMessage,
      clearChat,
      isStreaming,
      chatMode,
      setChatMode,
      deviceAvailability,
      appendAssistantMessage,
    }),
    [
      appendAssistantMessage,
      chatMode,
      clearChat,
      deviceAvailability,
      isStreaming,
      messages,
      sendMessage,
      setChatMode,
    ]
  );

  return <FinanceChatContext.Provider value={value}>{children}</FinanceChatContext.Provider>;
}

export function useFinanceChat() {
  const context = useContext(FinanceChatContext);
  if (!context) {
    throw new Error('useFinanceChat must be used within a FinanceChatProvider');
  }
  return context;
}
