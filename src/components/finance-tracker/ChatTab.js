'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Loader2 } from 'lucide-react';
import { useFinanceChat } from '@/context/FinanceChatContext';
import MessageList from '@/components/chatbot/MessageList';

export default function ChatTab() {
  const { messages, sendMessage, isStreaming } = useFinanceChat();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#fcfbf5] pb-16 lg:pb-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-chat-scrollbar px-4 py-4 sm:px-6">
        <MessageList
          messages={messages}
          isLoading={isStreaming}
          messagesEndRef={messagesEndRef}
          handleUIInteract={() => {}}
          handleLinkClick={() => {}}
        />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-neutral-200/50 bg-white px-4 py-3 sm:px-6">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputMessage.trim()) {
                  handleSubmit(e);
                }
              }
            }}
            placeholder="Ask about your finances, spending habits, or budgets..."
            rows={1}
            className="max-h-40 w-full resize-none overflow-hidden bg-transparent px-4 pb-2 pt-3 text-[13px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ height: '44px' }}
          />
          <div className="mt-auto flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              <Bot className="h-3.5 w-3.5" />
              Finance Assistant
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-all hover:opacity-90 active:scale-95 disabled:cursor-default disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
