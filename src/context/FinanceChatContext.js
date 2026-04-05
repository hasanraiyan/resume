'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const FinanceChatContext = createContext(null);

const WELCOME_MESSAGE = {
  id: 1,
  role: 'assistant',
  content:
    "Hi! I'm your Finance Assistant. I can help you understand your spending habits, track budgets, and get insights about your finances. How can I help you today?",
  steps: [],
  timestamp: new Date(),
};

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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            try {
              const event = JSON.parse(line);
              if (event.type === 'content') {
                fullContent += event.message;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fullContent } : m))
                );
              }
            } catch {
              // Skip malformed lines
            }
          }
        }

        if (!fullContent.trim()) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: "I wasn't able to generate a response. Please try again." }
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
