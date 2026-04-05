'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Bot, Send, Sparkles, Trash2 } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';
import MessageList from '@/components/chatbot/MessageList';

const quickPrompts = [
  'Summarize this period',
  'What is driving my expenses?',
  'Which budgets need attention?',
  'Show account highlights',
];

export default function FinanceChatTab() {
  const {
    analysis,
    periodStart,
    periodEnd,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
  } = useMoney();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const contextSummary = useMemo(() => {
    const start = new Date(periodStart).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const end = new Date(periodEnd).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return {
      period: `${start} - ${end}`,
      expense: analysis?.totalExpense ?? 0,
      income: analysis?.totalIncome ?? 0,
      categories: analysis?.categoryBreakdown?.length ?? 0,
    };
  }, [analysis, periodEnd, periodStart]);

  const addPlaceholderReply = (prompt) => {
    const now = new Date();
    const nextId = Date.now();

    setChatMessages([
      ...chatMessages,
      {
        id: nextId,
        role: 'user',
        content: prompt,
        steps: [],
        timestamp: now,
      },
      {
        id: nextId + 1,
        role: 'assistant',
        content: `Placeholder reply for "${prompt}". Next step is wiring this to a dedicated finance agent route with read-only finance tools and period-aware summaries.`,
        steps: [],
        timestamp: new Date(now.getTime() + 250),
      },
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    addPlaceholderReply(trimmed);
    setChatInput('');
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: 1,
        role: 'assistant',
        content:
          'I am the finance agent for this workspace. The chat UI is now aligned with the main site chatbot, but the finance backend is still placeholder-only.',
        steps: [],
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen w-full bg-white dark:bg-[#1e1e1e]">
      {/* Header / Overview */}
      <div className="flex-none border-b border-[#e5e3d8] dark:border-[#333333] bg-[#fcfbf5] dark:bg-[#121212] px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#1f644e]/10 dark:bg-[#1f644e]/20 text-[#1f644e]">
              <Bot className="h-5 w-5" />
              <div className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white dark:border-[#1e1e1e] bg-green-500 shadow-sm" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1e3a34] dark:text-[#e0e0e0]">
                Finance Assistant
              </h2>
              <p className="text-xs text-[#7c8e88] dark:text-[#a0a0a0]">
                Currently analyzing: {contextSummary.period}
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e3d8] dark:border-[#333333] bg-white dark:bg-[#2c2c2c] px-3 py-1.5 text-xs font-bold text-[#7c8e88] dark:text-[#a0a0a0] transition-colors hover:bg-[#f0f5f2] dark:hover:bg-[#3d3d3d] hover:text-[#1e3a34] dark:hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#e5e3d8] dark:border-[#333333] bg-white dark:bg-[#2c2c2c] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] dark:text-[#a0a0a0]">
              Expense
            </p>
            <p className="mt-1 text-sm font-bold text-[#c94c4c]">
              Rs {contextSummary.expense.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="rounded-xl border border-[#e5e3d8] dark:border-[#333333] bg-white dark:bg-[#2c2c2c] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] dark:text-[#a0a0a0]">
              Income
            </p>
            <p className="mt-1 text-sm font-bold text-[#1f644e]">
              Rs {contextSummary.income.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="rounded-xl border border-[#e5e3d8] dark:border-[#333333] bg-white dark:bg-[#2c2c2c] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] dark:text-[#a0a0a0]">
              Categories
            </p>
            <p className="mt-1 text-sm font-bold text-[#1e3a34] dark:text-[#e0e0e0]">
              {contextSummary.categories}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#1f644e]/10 dark:bg-[#1f644e]/20 px-3 py-1.5 text-xs font-bold text-[#1f644e] dark:text-[#4ade80]">
            <Sparkles className="h-3.5 w-3.5" />
            Suggestions
          </div>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => addPlaceholderReply(prompt)}
              className="whitespace-nowrap rounded-full border border-[#e5e3d8] dark:border-[#333333] bg-white dark:bg-[#2c2c2c] px-3 py-1.5 text-xs font-medium text-[#5f7069] dark:text-[#c0c0c0] transition-colors hover:bg-[#f0f5f2] dark:hover:bg-[#3d3d3d] hover:text-[#1e3a34] dark:hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#1e1e1e]">
        <div className="mx-auto max-w-3xl">
          <MessageList
            messages={chatMessages}
            isLoading={false}
            messagesEndRef={messagesEndRef}
            handleUIInteract={() => {}}
            handleLinkClick={() => {}}
          />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-none border-t border-[#e5e3d8] dark:border-[#333333] bg-[#fcfbf5] dark:bg-[#121212] p-4 sm:p-6">
        <div className="mx-auto max-w-3xl relative flex items-end gap-2 rounded-2xl border-2 border-neutral-800 dark:border-neutral-700 bg-white dark:bg-[#2c2c2c] p-2 focus-within:border-black dark:focus-within:border-white focus-within:ring-0 transition-colors">
          <textarea
            ref={inputRef}
            value={chatInput}
            onChange={(e) => {
              setChatInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (chatInput.trim()) {
                  handleSubmit(e);
                }
              }
            }}
            placeholder="Ask your finance assistant..."
            className="max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm text-[#1e3a34] dark:text-[#e0e0e0] placeholder-[#7c8e88] dark:placeholder-[#606060] outline-none"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!chatInput.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1f644e] text-white transition-colors hover:bg-[#17503e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="mx-auto mt-2 max-w-3xl text-center">
          <p className="text-[10px] text-[#7c8e88] dark:text-[#606060]">
            AI can make mistakes. Verify important financial insights.
          </p>
        </div>
      </div>
    </div>
  );
}
