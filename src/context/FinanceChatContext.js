'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const FinanceChatContext = createContext(null);

const WELCOME_MESSAGE = {
  id: 1,
  role: 'assistant',
  content:
    'I am the finance agent for this workspace. The chat UI is now aligned with the main site chatbot, but the finance backend is still placeholder-only.',
  steps: [],
  timestamp: new Date(),
};

export function FinanceChatProvider({ children }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);

  const addMessage = useCallback((role, content) => {
    const now = new Date();
    const nextId = Date.now();
    setMessages((prev) => [...prev, { id: nextId, role, content, steps: [], timestamp: now }]);
    return nextId;
  }, []);

  const addPlaceholderReply = useCallback((prompt) => {
    const now = new Date();
    const nextId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: nextId, role: 'user', content: prompt, steps: [], timestamp: now },
      {
        id: nextId + 1,
        role: 'assistant',
        content: `Placeholder reply for "${prompt}". Next step is wiring this to a dedicated finance agent route with read-only finance tools and period-aware summaries.`,
        steps: [],
        timestamp: new Date(now.getTime() + 250),
      },
    ]);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
  }, []);

  return (
    <FinanceChatContext.Provider value={{ messages, addMessage, addPlaceholderReply, clearChat }}>
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
