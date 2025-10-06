'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui';
import { MessageCircle, X, Send, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import getAnalytics from '@/lib/analytics';
import useProactiveTriggers from '@/hooks/useProactiveTriggers';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatbotSettings, setChatbotSettings] = useState(null);
  const [proactiveTriggersEnabled, setProactiveTriggersEnabled] = useState(true);
  const [hasProactiveNotification, setHasProactiveNotification] = useState(false);
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

          // Initialize with dynamic welcome message
          const welcomeMessage = `Hi! I'm ${settings.aiName}, Raiyan's AI assistant. I can help you learn about his projects and experience. What would you like to know?`;
          setMessages([{
            id: 1,
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Error fetching chatbot settings:', error);
        // Fallback to default settings
        setChatbotSettings({
          aiName: 'Kiro',
          persona: 'You are Kiro, a professional and helpful AI assistant representing Raiyan.',
          baseKnowledge: 'Raiyan is a skilled full-stack developer.',
          servicesOffered: 'Full-stack web development, React applications, Node.js backends.',
          callToAction: 'I\'d be happy to help you get in touch with Raiyan.',
          rules: ['Always be professional and helpful'],
          isActive: true
        });

        setMessages([{
          id: 1,
          role: 'assistant',
          content: "Hi! I'm Kiro, Raiyan's AI assistant. I can help you learn about his projects and experience. What would you like to know?",
          timestamp: new Date()
        }]);
      }
    };

    fetchChatbotSettings();
  }, []);

  // Handle proactive engagement triggers
  const handleProactiveTrigger = (message) => {
    if (!isOpen && chatbotSettings) {
      // Check if this exact message already exists (prevent duplicates)
      const messageExists = messages.some(
        msg => msg.content === message && msg.isProactive === true
      );
      
      if (messageExists) {
        console.log('⚠️ Duplicate proactive message prevented');
        return;
      }
      
      // Don't auto-open - just add notification badge and queue message
      setHasProactiveNotification(true);
      
      // Add the proactive message to queue
      const proactiveMessage = {
        id: Date.now(),
        role: 'assistant',
        content: message,
        timestamp: new Date(),
        isProactive: true
      };

      setMessages(prev => [...prev, proactiveMessage]);

      // Track that a proactive message was sent
      const analytics = getAnalytics();
      analytics?.trackCustomEvent(
        'proactive_message_sent',
        window.location.pathname,
        {
          message: message.substring(0, 100)
        }
      );
    }
  };

  // When user opens chat, clear notification
  const handleOpenChat = () => {
    setIsOpen(true);
    setHasProactiveNotification(false);
    
    // Track if they opened from a notification
    if (hasProactiveNotification) {
      const analytics = getAnalytics();
      analytics?.trackCustomEvent(
        'proactive_notification_clicked',
        window.location.pathname,
        {}
      );
    }
  };

  // Setup proactive triggers
  useProactiveTriggers({
    onTrigger: handleProactiveTrigger,
    isOpen,
    isEnabled: proactiveTriggersEnabled
  });

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Check if this is a response to a proactive message
    const lastMessage = messages[messages.length - 1];
    const isRespondingToProactive = lastMessage?.isProactive === true;

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get analytics instance for session tracking
      const analytics = getAnalytics();

      // Track if user responded to a proactive message
      if (isRespondingToProactive) {
        analytics?.trackCustomEvent(
          'user_responded_to_proactive',
          window.location.pathname,
          {
            proactive_message: lastMessage.content.substring(0, 100),
            user_response: userMessage.content.substring(0, 100)
          }
        );
      }

      // Prepare chat history for API
      const chatHistory = messages
        .filter(msg => msg.role !== 'system')
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
          path: window.location.pathname
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
        timestamp: new Date()
      };

      // Add empty assistant message
      setMessages(prev => [...prev, assistantMessage]);

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantMessage.content += chunk;

          // Update the message in real-time
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: assistantMessage.content }
              : msg
          ));
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I\'m having trouble responding right now. Please try again in a moment.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (chatbotSettings) {
      const welcomeMessage = `Hi! I'm ${chatbotSettings.aiName}, Raiyan's AI assistant. I can help you learn about his projects and experience. What would you like to know?`;
      setMessages([{
        id: 1,
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    } else {
      setMessages([{
        id: 1,
        role: 'assistant',
        content: "Hi! I'm Kiro, Raiyan's AI assistant. I can help you learn about his projects and experience. What would you like to know?",
        timestamp: new Date()
      }]);
    }
  };

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
          
          {/* Notification Badge - Only show when proactive message is waiting */}
          {hasProactiveNotification && (
            <>
              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white animate-pulse z-20"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white opacity-75 animate-ping z-10"></div>
            </>
          )}
          
          {/* Default online indicator - Always show */}
          {!hasProactiveNotification && (
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white"></div>
          )}
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
              <h3 className="font-semibold text-neutral-900 text-base sm:text-lg">{chatbotSettings?.aiName || 'Kiro'}</h3>
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
                className={`max-w-[85%] sm:max-w-xs px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
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
                <p className={`text-xs mt-1 sm:mt-2 ${
                  message.role === 'user' ? 'text-neutral-300' : 'text-neutral-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-neutral-200/50 border border-neutral-200/50 max-w-[85%] sm:max-w-xs">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-neutral-600">{chatbotSettings?.aiName || 'Kiro'} is typing...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 border-t border-neutral-200/50 bg-white/80 backdrop-blur-sm rounded-b-2xl">
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
