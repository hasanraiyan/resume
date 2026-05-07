'use client';

import { useState, useRef, useEffect } from 'react';
import { useJournalyChat } from '@/context/JournalyChatContext';
import { Send, BookOpen, Search, Sparkles, Loader2, User, Bot, Calendar, Hash } from 'lucide-react';

const SUGGESTIONS = [
  { text: 'Summarize my writing from last week', icon: <Calendar className="w-4 h-4" /> },
  { text: 'What are the main topics I write about?', icon: <Hash className="w-4 h-4" /> },
  { text: 'Show me my happiest memories', icon: <Search className="w-4 h-4" /> },
  { text: 'How has my mood been lately?', icon: <Sparkles className="w-4 h-4" /> },
];

export default function ChatTab() {
  const { messages, isTyping, setIsTyping, addMessage, updateLastMessage } = useJournalyChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e, text = input) => {
    e?.preventDefault();
    const query = text.trim();
    if (!query) return;

    setInput('');
    addMessage('user', query);
    setIsTyping(true);

    try {
      const response = await fetch('/api/journaly/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: query,
          chatHistory: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantBlocks = [];

      addMessage('assistant', '');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.type === 'content') {
              assistantContent += event.message;
              updateLastMessage(assistantContent, assistantBlocks);
            } else if (event.type === 'tool_end' && event.uiBlocks) {
              assistantBlocks = [...assistantBlocks, ...event.uiBlocks];
              updateLastMessage(assistantContent, assistantBlocks);
            }
          } catch (e) {
            console.warn('Failed to parse chunk', e);
          }
        }
      }
    } catch (err) {
      console.error(err);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-16 h-16 rounded-3xl bg-[#f0f5f2] flex items-center justify-center mb-6 text-[#1f644e]">
              <Bot className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Reflect with Journaly AI</h2>
            <p className="text-[#7c8e88] max-w-md mb-10">
              I can help you search your history, find patterns in your moods, or summarize your thoughts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={(e) => handleSubmit(e, s.text)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#e5e3d8] hover:border-[#1f644e] hover:bg-[#f0f5f2] transition-all text-left text-sm font-bold text-[#1e3a34] shadow-sm"
                >
                  <div className="text-[#1f644e] shrink-0">{s.icon}</div>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-[#1f644e] text-white' : 'bg-white border border-[#e5e3d8] text-[#1f644e]'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="space-y-3">
                {msg.content && (
                  <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#1f644e] text-white' : 'bg-white border border-[#e5e3d8] text-[#1e3a34]'}`}>
                    {msg.content}
                  </div>
                )}
                {msg.blocks?.length > 0 && (
                  <div className="space-y-3">
                    {msg.blocks.map((block, bi) => (
                      <ChatBlockRenderer key={bi} block={block} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-[#e5e3d8] flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-[#1f644e]" />
              </div>
              <div className="px-5 py-3 rounded-2xl bg-white border border-[#e5e3d8] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#7c8e88] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-[#7c8e88] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-[#7c8e88] rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 relative group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about your journal..."
          className="w-full pl-6 pr-14 py-4 rounded-2xl border-2 border-[#e5e3d8] bg-white outline-none focus:border-[#1f644e] shadow-lg transition-all"
        />
        <button
          type="submit"
          disabled={isTyping || !input.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e] disabled:opacity-50 transition-all shadow-md"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

function ChatBlockRenderer({ block }) {
  if (block.kind === 'entry_list') {
    return (
      <div className="bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden shadow-sm max-w-md">
        <div className="px-4 py-2 bg-[#fcfbf5] border-b border-[#e5e3d8] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#1f644e]" />
          <span className="text-xs font-bold text-[#1f644e] uppercase tracking-wider">{block.title}</span>
        </div>
        <div className="p-2 space-y-2">
          {block.data.items.slice(0, 3).map((item) => (
            <div key={item.id} className="p-3 hover:bg-[#f0f5f2] rounded-xl transition-colors cursor-pointer group">
              <h5 className="font-bold text-xs group-hover:text-[#1f644e] transition-colors">{item.title || 'Untitled'}</h5>
              <p className="text-[10px] text-[#7c8e88] line-clamp-2 mt-1">{item.bodyExcerpt || item.body}</p>
            </div>
          ))}
          {block.data.items.length > 3 && (
            <div className="text-center py-1">
              <span className="text-[10px] font-bold text-[#7c8e88]">+ {block.data.items.length - 3} more</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (block.kind === 'mood_insights') {
    const moods = [
      { emoji: '🤩', label: 'Amazing', count: block.data.moodDistribution[4] },
      { emoji: '😊', label: 'Happy', count: block.data.moodDistribution[3] },
      { emoji: '🙂', label: 'Fine', count: block.data.moodDistribution[2] },
      { emoji: '😐', label: 'Neutral', count: block.data.moodDistribution[1] },
      { emoji: '😔', label: 'Sad', count: block.data.moodDistribution[0] },
    ];
    return (
      <div className="bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden shadow-sm max-w-md">
        <div className="px-4 py-2 bg-[#fcfbf5] border-b border-[#e5e3d8] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#1f644e]" />
          <span className="text-xs font-bold text-[#1f644e] uppercase tracking-wider">Mood Insights</span>
        </div>
        <div className="p-4 flex justify-between gap-2">
          {moods.map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-1">
              <span className="text-xl">{m.emoji}</span>
              <span className="text-[10px] font-bold">{m.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
