'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, Trash2, X } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';
import MessageList from '@/components/chatbot/MessageList';

const quickPrompts = [
  'Summarize this period',
  'What is driving my expenses?',
  'Which budgets need attention?',
  'Show account highlights',
];

export default function FinanceAgentPanel({ activeTab }) {
  const { analysis, periodStart, periodEnd } = useMoney();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content:
        'I am the finance agent for this workspace. The chat UI is now aligned with the main site chatbot, but the finance backend is still placeholder-only.',
      steps: [],
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

    setMessages((prev) => [
      ...prev,
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
    const trimmed = inputMessage.trim();
    if (!trimmed) return;
    addPlaceholderReply(trimmed);
    setInputMessage('');
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
  };

  const clearChat = () => {
    setMessages([
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

  const financeHeader = (
    <div className="flex items-center justify-between border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50/80 to-white/80 p-4 sm:p-5 rounded-t-2xl">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="relative">
          <div className="h-3 w-3 rounded-full border-2 border-white bg-green-500 shadow-sm" />
          <div className="absolute inset-0 h-3 w-3 rounded-full bg-green-500 opacity-20 animate-ping" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Finance Agent</h3>
          <p className="hidden text-[10px] text-neutral-500 sm:block">
            {activeTab} - {contextSummary.period}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2">
        <button
          onClick={clearChat}
          className="flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600 transition-all duration-200 hover:bg-neutral-200 hover:text-neutral-900 sm:px-3 sm:py-1.5"
        >
          <Trash2 className="h-3 w-3" />
          <span className="hidden sm:inline">Clear</span>
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-2 text-neutral-400 transition-all duration-200 hover:bg-neutral-100 hover:text-neutral-600"
          aria-label="Close finance chat"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );

  const financeOverview = (
    <div className="border-b border-neutral-200/50 bg-white/80 px-3 py-3 sm:px-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
            Expense
          </p>
          <p className="mt-1 text-xs font-bold text-[#c94c4c]">
            Rs {contextSummary.expense.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
            Income
          </p>
          <p className="mt-1 text-xs font-bold text-[#1f644e]">
            Rs {contextSummary.income.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
            Categories
          </p>
          <p className="mt-1 text-xs font-bold text-neutral-900">{contextSummary.categories}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1 whitespace-nowrap rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-medium text-neutral-700">
          <Sparkles className="h-3.5 w-3.5" />
          Suggested prompts
        </div>
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => addPlaceholderReply(prompt)}
            className="whitespace-nowrap rounded-full border border-neutral-200/80 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors duration-200 hover:bg-neutral-100"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );

  const financeInput = (
    <div className="shrink-0 border-t border-neutral-200/50 bg-white p-3">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col rounded-3xl transition-all focus-within:border-black/50 focus-within:ring-1 focus-within:ring-black/20"
      >
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
          placeholder="Ask the finance agent about trends, budgets, or accounts..."
          rows={1}
          className="max-h-40 w-full resize-none overflow-hidden bg-transparent px-4 pb-2 pt-3 text-[13px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ height: '44px' }}
        />
        <div className="mt-auto flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            <Bot className="h-3.5 w-3.5" />
            Finance-only assistant
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f644e] text-white transition-all hover:bg-[#1a5542] active:scale-95 disabled:cursor-default disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );

  const panel = (
    <div className="chatbot-widget-container fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 sm:bottom-6 sm:right-6">
      <div className="flex h-[80vh] max-h-[800px] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-xl sm:h-[40rem] sm:w-96">
        {financeHeader}
        {financeOverview}
        <MessageList
          messages={messages}
          isLoading={false}
          messagesEndRef={messagesEndRef}
          handleUIInteract={() => {}}
          handleLinkClick={() => {}}
          theme="green"
        />
        {financeInput}
      </div>
    </div>
  );

  if (!isOpen) {
    return (
      <div className="chatbot-widget-container group fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8">
        <div className="pointer-events-none whitespace-nowrap rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white opacity-0 translate-y-2 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Chat with Finance Agent
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-black to-neutral-900 text-white shadow-2xl backdrop-blur-sm transition-all duration-300 hover:from-neutral-900 hover:to-black sm:h-16 sm:w-16"
          aria-label="Open finance chat"
        >
          <div className="absolute right-0 top-0 z-20 h-3.5 w-3.5 rounded-full border-2 border-theme-bg bg-green-500 shadow-sm">
            <div className="absolute inset-0 h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <MessageCircle className="relative z-10 h-6 w-6 sm:h-7 sm:w-7" />
        </button>
      </div>
    );
  }

  return panel;
}
