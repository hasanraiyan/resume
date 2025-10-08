'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui';
import { MessageCircle, X, Send, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import getAnalytics from '@/lib/analytics';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [chatbotSettings, setChatbotSettings] = useState(null);
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

  // Fetch chatbot settings and initialize
  useEffect(() => {
    const fetchChatbotSettings = async () => {
      try {
        const response = await fetch('/api/admin/chatbot');
        if (response.ok) {
          const settings = await response.json();
          setChatbotSettings(settings);

          if (settings.isActive) {
            // Initialize with dynamic welcome message
            const welcomeMessage = `Hi! I'm ${settings.aiName}, Raiyan's AI assistant. I can help you learn about his projects and experience. What would you like to know?`;
            setMessages([
              {
                id: 1,
                role: 'assistant',
                content: welcomeMessage,
                timestamp: new Date(),
              },
            ]);
          }
        } else {
          // If the response is not OK, assume the chatbot should be disabled.
          setChatbotSettings({ isActive: false });
        }
      } catch (error) {
        console.error('Error fetching chatbot settings:', error);
        // On error, assume the chatbot should be disabled.
        setChatbotSettings({ isActive: false });
      }
    };

    fetchChatbotSettings();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get analytics instance for session tracking
      const analytics = getAnalytics();

      // Prepare chat history for API
      const chatHistory = messages
        .filter((msg) => msg.role !== 'system')
        .map(({ role, content }) => ({ role, content }));

      // Make API call
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: userMessage.content,
          chatHistory,
          sessionId: analytics.sessionId,
          path: window.location.pathname,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      // Don't add message until we have content - prevents empty message box
      let messageAdded = false;
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete JSON lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data = JSON.parse(line);

              if (data.type === 'status') {
                // Update status message only - don't add message yet
                setStatusMessage(data.message);
              } else if (data.type === 'content') {
                // Clear status and add message on first content
                setStatusMessage('');
                assistantMessage.content += data.message;

                if (!messageAdded) {
                  // Add message on first content chunk
                  setMessages((prev) => [...prev, assistantMessage]);
                  messageAdded = true;
                } else {
                  // Update existing message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: assistantMessage.content }
                        : msg
                    )
                  );
                }
              }
            } catch (e) {
              // If not JSON, treat as raw content (backward compatibility)
              assistantMessage.content += line;

              if (!messageAdded) {
                setMessages((prev) => [...prev, assistantMessage]);
                messageAdded = true;
              } else {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: assistantMessage.content }
                      : msg
                  )
                );
              }
            }
          }
        }
      } finally {
        setStatusMessage('');
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = async (promptText) => {
    if (isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: promptText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const analytics = getAnalytics();
      const chatHistory = messages
        .filter((msg) => msg.role !== 'system')
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMessage.content,
          chatHistory,
          sessionId: analytics.sessionId,
          path: window.location.pathname,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      // Don't add message until we have content
      let messageAdded = false;
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete JSON lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data = JSON.parse(line);

              if (data.type === 'status') {
                setStatusMessage(data.message);
              } else if (data.type === 'content') {
                setStatusMessage('');
                assistantMessage.content += data.message;

                if (!messageAdded) {
                  setMessages((prev) => [...prev, assistantMessage]);
                  messageAdded = true;
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: assistantMessage.content }
                        : msg
                    )
                  );
                }
              }
            } catch (e) {
              // Backward compatibility
              assistantMessage.content += line;

              if (!messageAdded) {
                setMessages((prev) => [...prev, assistantMessage]);
                messageAdded = true;
              } else {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: assistantMessage.content }
                      : msg
                  )
                );
              }
            }
          }
        }
      } finally {
        setStatusMessage('');
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error sending prompt message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "Sorry, I'm having trouble. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    { text: "Tell me about Raiyan's projects" },
    { text: "What's his tech stack?" },
    { text: 'How can I get in touch?' },
    { text: 'Show me his latest blog post' },
  ];

  const clearChat = () => {
    if (chatbotSettings) {
      const welcomeMessage = `Hi! I'm ${chatbotSettings.aiName}, Raiyan's AI assistant. I can help you learn about his projects and experience. What would you like to know?`;
      setMessages([
        {
          id: 1,
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([
        {
          id: 1,
          role: 'assistant',
          content:
            "Hi! I'm Kiro, Raiyan's AI assistant. I can help you learn about his projects and experience. What would you like to know?",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  if (!chatbotSettings || !chatbotSettings.isActive) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <button
          onClick={handleOpenChat}
          className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-black to-neutral-900 hover:from-neutral-900 hover:to-black text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center border border-white/20 backdrop-blur-sm"
          aria-label="Open chat"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      {/* Chat Window */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 h-[36rem] sm:h-[40rem] flex flex-col border border-white/20 shadow-black/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50/80 to-white/80 rounded-t-2xl">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-20"></div>
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
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 sm:prose-p:my-2 prose-headings:my-1 sm:prose-headings:my-2 prose-ul:my-1 sm:prose-ul:my-2 prose-ol:my-1 sm:prose-ol:my-2 prose-li:my-0">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
                <p
                  className={`text-xs mt-1 sm:mt-2 ${
                    message.role === 'user' ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-neutral-200/50 border border-neutral-200/50 max-w-full sm:max-w-xs">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
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

        {/* Prompts are now always visible, except when the AI is responding. */}
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
        {/* ✨ [UI FIX] - The input section now has simplified styling to work with the persistent prompts. */}
        <div
          className={`p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-b-2xl ${isLoading ? 'border-t border-neutral-200/50' : ''}`}
        >
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 sm:px-4 py-3 sm:py-3 border border-neutral-200/60 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white transition-all duration-200 placeholder:text-neutral-400 text-neutral-900 text-sm sm:text-base"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-br from-black to-neutral-900 hover:from-neutral-800 hover:to-black text-white p-2 sm:p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0"
            >
              {isLoading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
