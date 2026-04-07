'use client';

import { useEffect, useRef, useState } from 'react';
import { useTasklyChat } from '@/context/TasklyChatContext';
import { useTaskly } from '@/context/TasklyContext';
import MessageList from '@/components/chatbot/MessageList';
import ChatInput from '@/components/chatbot/ChatInput';

export default function ChatTab() {
  const { messages, sendMessage, isStreaming } = useTasklyChat();
  const { setActiveTab } = useTaskly();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const toggleListening = () => setIsListening((s) => !s);
  const [activeMCPs, setActiveMCPs] = useState([]);
  const [availableMCPs, setAvailableMCPs] = useState([]);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const chatbotSettings = { aiName: 'Taskly Assistant' };
  const activeQuote = null;

  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 1) {
      setInputMessage('');
      setIsListening(false);
      setActiveMCPs([]);
      setIsToolsMenuOpen(false);
      setIsModelSelectorOpen(false);
      setSelectedAgentId(null);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
  }, [isStreaming, messages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setInputMessage('');
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
  };

  const handleUIInteract = (action) => {
    if (!action) return;

    if (action.type === 'switch_tab' && action.tab) {
      setActiveTab(action.tab);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] min-w-0 flex-col overflow-x-hidden bg-[#fcfbf5] pb-16 lg:pb-0">
      {/* Messages */}
      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden custom-chat-scrollbar px-4 py-4 sm:px-6">
        <MessageList
          messages={messages}
          isLoading={isStreaming}
          messagesEndRef={messagesEndRef}
          handleUIInteract={handleUIInteract}
          handleLinkClick={() => {}}
          theme="green"
        />
      </div>

      {/* Input */}
      <ChatInput
        inputRef={inputRef}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        isLoading={isStreaming}
        handleSubmit={handleSubmit}
        activeQuote={activeQuote}
        isListening={isListening}
        toggleListening={toggleListening}
        activeMCPs={activeMCPs}
        setActiveMCPs={setActiveMCPs}
        availableMCPs={availableMCPs}
        isToolsMenuOpen={isToolsMenuOpen}
        setIsToolsMenuOpen={setIsToolsMenuOpen}
        isModelSelectorOpen={isModelSelectorOpen}
        setIsModelSelectorOpen={setIsModelSelectorOpen}
        chatbotSettings={chatbotSettings}
        selectedAgentId={selectedAgentId}
        setSelectedAgentId={setSelectedAgentId}
        showModelSelector={false}
        theme="green"
      />
    </div>
  );
}
