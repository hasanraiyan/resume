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
  const [pageContext, setPageContext] = useState('');
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

  // Scrape page context when component mounts or page changes
  useEffect(() => {
    scrapePageContext();

    // Listen for page navigation (for SPA)
    const handleLocationChange = () => {
      setTimeout(scrapePageContext, 100);
    };

    // More comprehensive page change detection
    const handlePageChange = () => {
      setTimeout(scrapePageContext, 150);
    };

    // Listen for various navigation events
    window.addEventListener('popstate', handlePageChange);
    window.addEventListener('pushstate', handlePageChange);
    window.addEventListener('replacestate', handlePageChange);

    // Use MutationObserver to detect dynamic content changes
    const observer = new MutationObserver((mutations) => {
      const contentChanged = mutations.some(mutation =>
        mutation.type === 'childList' &&
        mutation.target === document.body
      );

      if (contentChanged) {
        // Debounce context updates
        clearTimeout(window.contextUpdateTimer);
        window.contextUpdateTimer = setTimeout(scrapePageContext, 300);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check for URL changes periodically (fallback)
    const urlCheckInterval = setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== window.lastCheckedPath) {
        window.lastCheckedPath = currentPath;
        setTimeout(scrapePageContext, 200);
      }
    }, 1000);

    return () => {
      window.removeEventListener('popstate', handlePageChange);
      window.removeEventListener('pushstate', handlePageChange);
      window.removeEventListener('replacestate', handlePageChange);
      observer.disconnect();
      clearInterval(urlCheckInterval);
      clearTimeout(window.contextUpdateTimer);
    };
  }, []);

  const scrapePageContext = () => {
    try {
      // Get main content from the page
      const mainContent = document.querySelector('main') ||
                         document.querySelector('.main-content') ||
                         document.querySelector('#main') ||
                         document.querySelector('article') ||
                         document.body;

      if (mainContent) {
        // Extract text content, limiting length
        const textContent = mainContent.textContent || mainContent.innerText || '';
        const cleanedContent = textContent
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 2000); // Limit context size

        setPageContext(cleanedContent);

        // Also try to get page title and description
        const title = document.querySelector('title')?.textContent || '';
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        if (title || description) {
          setPageContext(prev => `${title} ${description} ${prev}`);
        }
      }
    } catch (error) {
      console.error('Error scraping page context:', error);
      setPageContext('');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get analytics instance for session tracking
      const analytics = getAnalytics();

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
          pageContext,
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
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-16 h-16 rounded-full bg-gradient-to-br from-black to-neutral-900 hover:from-neutral-900 hover:to-black text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center border border-white/20 backdrop-blur-sm"
          aria-label="Open chat"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <MessageCircle className="w-7 h-7 relative z-10" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      {/* Chat Window */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-96 h-[32rem] flex flex-col border border-white/20 shadow-black/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50/80 to-white/80 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-20"></div>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 text-lg">{chatbotSettings?.aiName || 'Kiro'}</h3>
              <p className="text-xs text-neutral-500 -mt-1">AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all duration-200 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all duration-200"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white/50 to-neutral-50/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-black to-neutral-900 text-white shadow-black/20'
                    : 'bg-white/80 backdrop-blur-sm text-neutral-900 shadow-neutral-200/50 border border-neutral-200/50'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
                <p className={`text-xs mt-2 ${
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
              <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-neutral-200/50 border border-neutral-200/50">
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
        <div className="p-4 border-t border-neutral-200/50 bg-white/80 backdrop-blur-sm rounded-b-2xl">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-neutral-200/60 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white transition-all duration-200 placeholder:text-neutral-400 text-neutral-900"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-br from-black to-neutral-900 hover:from-neutral-800 hover:to-black text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
