'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CornerDownRight, X } from 'lucide-react';
import { toast } from 'sonner';
import getAnalytics from '@/lib/analytics';

// Hooks
import { useChatbotSettings } from '@/hooks/chatbot/useChatbotSettings';
import { useSelectionAI } from '@/hooks/chatbot/useSelectionAI';
import { useVoiceRecognition } from '@/hooks/chatbot/useVoiceRecognition';
import { useChatStreaming, buildWelcomeMessage } from '@/hooks/chatbot/useChatStreaming';

// Components
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import FloatingActionButton from './FloatingActionButton';
import ContextualAIButton from './ContextualAIButton';
import OfflineState from './OfflineState';

function getDefaultPrompts(settings) {
  // Return generic/dynamic prompts if the user hasn't set custom ones
  return [
    { text: 'Tell me about the portfolio projects' },
    { text: 'Book an appointment' },
    { text: "What's the tech stack?" },
    { text: 'How can I get in touch?' },
    { text: 'Show me the latest blog post' },
  ];
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [activeMCPs, setActiveMCPs] = useState([]);
  const [availableMCPs, setAvailableMCPs] = useState([]); // Fetched from backend
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Custom Hooks
  const { chatbotSettings, settingsFetched, selectedModel, setSelectedModel, fetchSettings } =
    useChatbotSettings();
  const { selection, setSelection, activeQuote, setActiveQuote } = useSelectionAI();
  const { isListening, toggleListening } = useVoiceRecognition(
    inputMessage,
    setInputMessage,
    inputRef
  );
  const { messages, setMessages, isLoading, statusMessage, send } = useChatStreaming();

  // Initialization side effects
  useEffect(() => {
    if (chatbotSettings?.isActive && messages.length === 0) {
      setMessages([
        {
          id: 1,
          role: 'assistant',
          content: buildWelcomeMessage(chatbotSettings),
          steps: [],
          timestamp: new Date(),
        },
      ]);
    }
  }, [chatbotSettings, messages.length, setMessages]);

  useEffect(() => {
    async function loadMCPs() {
      try {
        const res = await fetch('/api/mcps');
        if (res.ok) {
          const data = await res.json();
          setAvailableMCPs(data);
        }
      } catch (err) {
        console.error('Failed to load available tools:', err);
      }
    }
    loadMCPs();
  }, []);

  // UI Event Handlers
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (isToolsMenuOpen && !e.target.closest('.tools-menu-container')) {
        setIsToolsMenuOpen(false);
      }
      if (isModelSelectorOpen && !e.target.closest('.model-selector-container')) {
        setIsModelSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [isToolsMenuOpen, isModelSelectorOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModelSelectorOpen) {
          setIsModelSelectorOpen(false);
        } else if (isToolsMenuOpen) {
          setIsToolsMenuOpen(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isModelSelectorOpen, isToolsMenuOpen]);

  const handleOpenChat = useCallback(async () => {
    setIsOpen(true);
    if (!settingsFetched) {
      await fetchSettings();
    }
  }, [fetchSettings, settingsFetched]);

  const handleSubmit = (e) => {
    e.preventDefault();
    send(inputMessage, activeQuote, activeMCPs, selectedModel);
    setInputMessage('');
    setActiveQuote('');
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
  };

  const handlePromptClick = (text) => {
    send(text, activeQuote, activeMCPs, selectedModel);
    setActiveQuote('');
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: buildWelcomeMessage(chatbotSettings),
        steps: [],
        timestamp: new Date(),
      },
    ]);
    toast.success('Chat history cleared');
  };

  const handleLinkClick = (e, href) => {
    const analytics = getAnalytics();
    analytics.trackCustomEvent('reference_link_clicked', window.location.pathname, {
      linkUrl: href,
      linkType: href?.includes('/projects/')
        ? 'project'
        : href?.includes('/blog/')
          ? 'article'
          : 'external',
      chatbotSession: analytics.sessionId,
    });
  };

  const handleUIInteract = (messageId, block, action) => {
    let label = 'Interacted with form';
    if (action === 'sent') label = 'Sent contact message';
    if (action === 'edit') label = 'Prefilled contact form';
    if (action === 'discard') label = 'Discarded contact draft';

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            steps: m.steps.map((s) => (s === block ? { ...s, resolved: true, action: label } : s)),
          };
        }
        if (m.id === block.toolActionId) {
          return { ...m, done: true };
        }
        return m;
      })
    );

    let prompt = '';
    if (action === 'sent') {
      prompt = 'I have submitted the contact form successfully.';
    } else if (action === 'edit') {
      prompt = 'I decided to edit the contact form details myself before sending.';
    } else if (action === 'discard') {
      prompt = 'I cancelled the contact form draft.';
    }

    if (prompt) {
      send(prompt, activeQuote, activeMCPs, selectedModel, true);
    }
  };

  const handleAskKiroContext = useCallback(() => {
    if (!selection.text) return;
    setActiveQuote(selection.text);
    if (!isOpen) {
      setIsOpen(true);
      if (!settingsFetched) fetchSettings();
    }
    setSelection((prev) => ({ ...prev, show: false }));
    window.getSelection()?.removeAllRanges();
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [selection.text, isOpen, settingsFetched, fetchSettings, setActiveQuote, setSelection]);

  const suggestedPrompts =
    chatbotSettings?.suggestedPrompts?.length > 0
      ? chatbotSettings.suggestedPrompts.map((t) => ({ text: t }))
      : getDefaultPrompts(chatbotSettings);

  // 1. FAB (closed state)
  if (!isOpen) {
    return (
      <>
        <ContextualAIButton
          selection={selection}
          handleAskKiroContext={handleAskKiroContext}
          chatbotSettings={chatbotSettings}
        />
        <FloatingActionButton
          handleOpenChat={handleOpenChat}
          chatbotSettings={chatbotSettings}
          settingsFetched={settingsFetched}
        />
      </>
    );
  }

  // 2. Offline state
  if (settingsFetched && (!chatbotSettings || !chatbotSettings.isActive)) {
    return (
      <>
        <ContextualAIButton
          selection={selection}
          handleAskKiroContext={handleAskKiroContext}
          chatbotSettings={chatbotSettings}
        />
        <OfflineState chatbotSettings={chatbotSettings} setIsOpen={setIsOpen} />
      </>
    );
  }

  // 3. Active Chat Window
  return (
    <>
      <ContextualAIButton
        selection={selection}
        handleAskKiroContext={handleAskKiroContext}
        chatbotSettings={chatbotSettings}
      />
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-4 duration-300 chatbot-widget-container">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl w-[calc(100vw-2rem)] sm:w-96 h-[80vh] max-h-[800px] sm:h-[40rem] flex flex-col border border-white/20 shadow-black/10">
          <ChatHeader
            chatbotSettings={chatbotSettings}
            settingsFetched={settingsFetched}
            clearChat={clearChat}
            setIsOpen={setIsOpen}
          />

          <MessageList
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
            handleUIInteract={handleUIInteract}
            handleLinkClick={handleLinkClick}
          />

          {/* Suggested prompts / Active Quote */}
          {!isLoading && (
            <div className="border-t border-neutral-200/50 bg-white/80 backdrop-blur-sm">
              {activeQuote ? (
                <div className="px-3 sm:px-4 py-3 bg-neutral-50 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-2 group">
                    <CornerDownRight className="w-3.5 h-3.5 text-neutral-400 mt-1 shrink-0" />
                    <div className="flex-1 min-w-0 pr-6 relative">
                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed italic border-l-2 border-neutral-300 pl-3">
                        "{activeQuote.trim()}"
                      </p>
                      <button
                        onClick={() => setActiveQuote('')}
                        className="absolute -top-1 -right-1 p-1 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove quote"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                activeMCPs.length === 0 && (
                  <div className="px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {suggestedPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handlePromptClick(prompt.text)}
                        className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-200/80 rounded-full text-xs text-neutral-700 font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-200"
                      >
                        {prompt.text}
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          <ChatInput
            inputRef={inputRef}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            isLoading={isLoading}
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
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        </div>
      </div>
    </>
  );
}
