'use client';

import { createContext, useContext, useState } from 'react';

const JournalyChatContext = createContext();

export function JournalyChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const clearChat = () => setMessages([]);

  const addMessage = (role, content, blocks = []) => {
    setMessages((prev) => [...prev, { role, content, blocks, id: Date.now() }]);
  };

  const updateLastMessage = (content, blocks = []) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updated = { ...last, content, blocks: blocks.length > 0 ? blocks : last.blocks };
      return [...prev.slice(0, -1), updated];
    });
  };

  return (
    <JournalyChatContext.Provider
      value={{
        messages,
        isTyping,
        setIsTyping,
        clearChat,
        addMessage,
        updateLastMessage,
      }}
    >
      {children}
    </JournalyChatContext.Provider>
  );
}

export const useJournalyChat = () => useContext(JournalyChatContext);
