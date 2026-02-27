'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Trash2, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import getAnalytics from '@/lib/analytics';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds the initial welcome message for a given settings object. */
function buildWelcomeMessage(settings) {
  const name = settings?.aiName || 'Kiro';
  return `Hi! I'm ${name}, Raiyan's AI assistant. I can help you learn about his projects and experience. What would you like to know?`;
}

const DEFAULT_PROMPTS = [
  { text: "Tell me about Raiyan's projects" },
  { text: "What's his tech stack?" },
  { text: 'How can I get in touch?' },
  { text: 'Show me his latest blog post' },
];

// ---------------------------------------------------------------------------
// Core streaming helper — shared by sendMessage and handlePromptClick
// ---------------------------------------------------------------------------

/**
 * Calls /api/chat with the given message + history, streams the response,
 * and updates the messages state incrementally.
 *
 * @param {Object} opts
 * @param {string}   opts.content      - The user message text
 * @param {Array}    opts.history      - Current message history
 * @param {Function} opts.setMessages  - State setter for messages
 * @param {Function} opts.setStatus    - State setter for status string
 */
async function streamChatResponse({ content, history, setMessages, setStatus }) {
  const analytics = getAnalytics();
  const chatHistory = history
    .filter((msg) => msg.role !== 'system')
    .map(({ role, content: c }) => ({ role, content: c }));

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userMessage: content,
      chatHistory,
      sessionId: analytics.sessionId,
      path: window.location.pathname,
    }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const assistantMessage = {
    id: Date.now() + 1,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
  };
  let messageAdded = false;
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        let data;
        try {
          data = JSON.parse(line);
        } catch {
          // Raw text fallback (backward compatibility)
          assistantMessage.content += line;
          if (!messageAdded) {
            setMessages((prev) => [...prev, assistantMessage]);
            messageAdded = true;
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id ? { ...m, content: assistantMessage.content } : m
              )
            );
          }
          continue;
        }

        if (data.type === 'status' || data.type === 'node_status') {
          setStatus(data.message);
        } else if (data.type === 'content') {
          setStatus('');
          assistantMessage.content += data.message;

          if (!messageAdded) {
            setMessages((prev) => [...prev, assistantMessage]);
            messageAdded = true;
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id ? { ...m, content: assistantMessage.content } : m
              )
            );
          }
        }
      }
    }
  } finally {
    setStatus('');
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [chatbotSettings, setChatbotSettings] = useState(null);
  const [settingsFetched, setSettingsFetched] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // Lazy settings fetch — only runs on first open, not on every page mount
  // ---------------------------------------------------------------------------
  const fetchSettings = useCallback(async () => {
    if (settingsFetched) return;
    setSettingsFetched(true);

    try {
      const response = await fetch('/api/admin/chatbot');
      if (response.ok) {
        const settings = await response.json();
        setChatbotSettings(settings);
        if (settings.isActive) {
          setMessages([
            {
              id: 1,
              role: 'assistant',
              content: buildWelcomeMessage(settings),
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        setChatbotSettings({ isActive: false });
      }
    } catch {
      setChatbotSettings({ isActive: false });
    }
  }, [settingsFetched]);

  const handleOpenChat = useCallback(async () => {
    setIsOpen(true);
    await fetchSettings();
  }, [fetchSettings]);

  // ---------------------------------------------------------------------------
  // Shared send logic used by both text input and prompt chips
  // ---------------------------------------------------------------------------
  const send = useCallback(
    async (content) => {
      if (!content.trim() || isLoading) return;

      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        await streamChatResponse({
          content: userMessage.content,
          history: messages,
          setMessages,
          setStatus: setStatusMessage,
        });
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'assistant',
            content:
              "Sorry, I'm having trouble responding right now. Please try again in a moment.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    send(inputMessage);
    setInputMessage('');
  };

  const handlePromptClick = (text) => send(text);

  // ---------------------------------------------------------------------------
  // Clear chat
  // ---------------------------------------------------------------------------
  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content: buildWelcomeMessage(chatbotSettings),
        timestamp: new Date(),
      },
    ]);
  };

  // ---------------------------------------------------------------------------
  // Analytics link tracking
  // ---------------------------------------------------------------------------
  const handleLinkClick = (e, href) => {
    const analytics = getAnalytics();
    analytics.trackCustomEvent('reference_link_clicked', window.location.pathname, {
      linkUrl: href,
      linkType: href.includes('/projects/')
        ? 'project'
        : href.includes('/blog/')
          ? 'article'
          : 'external',
      chatbotSession: analytics.sessionId,
    });
  };

  // Derive suggested prompts from settings if available, else use defaults
  const suggestedPrompts =
    chatbotSettings?.suggestedPrompts?.length > 0
      ? chatbotSettings.suggestedPrompts.map((t) => ({ text: t }))
      : DEFAULT_PROMPTS;

  // ---------------------------------------------------------------------------
  // Before settings are known: show the FAB, which will trigger a fetch on click
  // ---------------------------------------------------------------------------
  if (!isOpen) {
    // If settings have been fetched and chatbot is inactive, render nothing
    if (settingsFetched && (!chatbotSettings || !chatbotSettings.isActive)) return null;

    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <button
          onClick={handleOpenChat}
          className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-black to-neutral-900 hover:from-neutral-900 hover:to-black text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center border border-white/20 backdrop-blur-sm"
          aria-label="Open chat"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" />
        </button>
      </div>
    );
  }

  // If open but settings say inactive (edge case: loaded after open)
  if (settingsFetched && (!chatbotSettings || !chatbotSettings.isActive)) return null;

  // ---------------------------------------------------------------------------
  // Chat window
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 h-[36rem] sm:h-[40rem] flex flex-col border border-white/20 shadow-black/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50/80 to-white/80 rounded-t-2xl">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-20" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 text-base sm:text-lg">
                {chatbotSettings?.aiName || 'Kiro'}
              </h3>
              <p className="text-xs text-neutral-500 -mt-1 hidden sm:block">AI Assistant</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={clearChat}
              className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all duration-200 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all duration-200"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-white/50 to-neutral-50/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-full sm:max-w-xs px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-black to-neutral-900 text-white shadow-black/20'
                    : 'bg-white/80 backdrop-blur-sm text-neutral-900 shadow-neutral-200/50 border border-neutral-200/50'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 sm:prose-p:my-2 prose-headings:my-1 sm:prose-headings:my-2 prose-ul:my-1 sm:prose-ul:my-2 prose-ol:my-1 sm:prose-ol:my-2 prose-li:my-0 prose-a:no-underline">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium underline decoration-blue-600/30 hover:decoration-blue-800 underline-offset-2 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => handleLinkClick(e, props.href)}
                          >
                            {props.children}
                            {props.href &&
                              (props.href.startsWith('http') || props.href.startsWith('https')) && (
                                <ExternalLink className="w-3 h-3 inline-block" />
                              )}
                          </a>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
                <p
                  className={`text-xs mt-1 sm:mt-2 ${
                    message.role === 'user' ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-neutral-200/50 border border-neutral-200/50 max-w-full sm:max-w-xs">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                  <span className="text-xs text-neutral-600">
                    {statusMessage || `${chatbotSettings?.aiName || 'Kiro'} is typing...`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompt chips */}
        {!isLoading && (
          <div className="px-3 sm:px-4 pt-2 border-t border-neutral-200/50 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          </div>
        )}

        {/* Input */}
        <div
          className={`p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-b-2xl ${isLoading ? 'border-t border-neutral-200/50' : ''}`}
        >
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 sm:px-4 py-3 border border-neutral-200/60 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white transition-all duration-200 placeholder:text-neutral-400 text-neutral-900 text-sm sm:text-base"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-br from-black to-neutral-900 hover:from-neutral-800 hover:to-black text-white p-2 sm:p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0"
            >
              {isLoading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
