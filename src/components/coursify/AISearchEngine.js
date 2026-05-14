'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Sparkles,
  ArrowLeft,
  Loader2,
  Globe,
  BookOpen,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { CoursifyBlockRenderer } from '@/components/coursify/reader/CoursifyBlockRenderer';

const SUGGESTED_TOPICS = [
  "Dijkstra's Algorithm",
  'React Hooks in depth',
  'SQL Window Functions',
  'Machine Learning Basics',
  'TCP/IP Networking',
  'Dynamic Programming',
  'System Design: URL Shortener',
  'Async/Await in JavaScript',
];

// Phase constants
const PHASE = {
  IDLE: 'idle',
  GENERATING: 'generating',
  DONE: 'done',
  ERROR: 'error',
};

export function AISearchEngine() {
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const inputRef = useRef(null);
  const contentRef = useRef('');
  const resultRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (phase === PHASE.IDLE) inputRef.current?.focus();
  }, [phase]);

  // Scroll result to top when done
  useEffect(() => {
    if (phase === PHASE.DONE) {
      resultRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [phase]);

  const generate = useCallback(async (topic) => {
    if (!topic.trim()) return;

    setQuery(topic.trim());
    setPhase(PHASE.GENERATING);
    setContent('');
    setStatusMessage('🚀 Starting research...');
    setError('');
    contentRef.current = '';

    try {
      const res = await fetch('/api/coursify/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'content') {
              contentRef.current += event.message;
              setContent(contentRef.current);
            } else if (event.type === 'status') {
              setStatusMessage(event.message);
            } else if (event.type === 'done') {
              setPhase(PHASE.DONE);
              setStatusMessage('');
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      if (contentRef.current) setPhase(PHASE.DONE);
    } catch (err) {
      console.error('[AISearchEngine]', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setPhase(PHASE.ERROR);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    generate(inputValue);
  };

  const handleReset = () => {
    setPhase(PHASE.IDLE);
    setInputValue('');
    setContent('');
    setError('');
    setStatusMessage('');
    contentRef.current = '';
  };

  // ─── IDLE: Search input ───────────────────────────────────────────────────
  if (phase === PHASE.IDLE) {
    return (
      <div className="w-full">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-[#e5e3d8] bg-white shadow-lg shadow-black/5 focus-within:border-[#1f644e] focus-within:shadow-[#1f644e]/10 transition-all">
            <Sparkles className="w-5 h-5 text-[#1f644e] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What do you want to learn? e.g. Dijkstra's Algorithm..."
              className="flex-1 bg-transparent text-[#1e3a34] placeholder:text-[#b5c4be] text-sm sm:text-base outline-none"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white text-xs font-bold rounded-xl hover:bg-[#184d3c] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Generate</span>
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setInputValue(t);
                generate(t);
              }}
              className="px-3 py-1.5 text-xs font-medium text-[#1f644e] bg-[#f0f5f2] border border-[#d4e6de] rounded-full hover:bg-[#1f644e] hover:text-white transition-all"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── GENERATING: streaming progress ──────────────────────────────────────
  if (phase === PHASE.GENERATING) {
    const wordCount = contentRef.current.split(/\s+/).filter(Boolean).length;
    const blockCount = (contentRef.current.match(/##\s*\[/g) || []).length;

    return (
      <div className="w-full rounded-2xl border border-[#e5e3d8] bg-white shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e5e3d8] bg-[#fafaf8]">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-[#1f644e]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#1f644e]" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#1f644e] animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#1e3a34] truncate">{query}</p>
            <p className="text-[10px] text-[#7c8e88] mt-0.5">{statusMessage}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[#7c8e88] shrink-0">
            {blockCount > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {blockCount} blocks
              </span>
            )}
            <Globe className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Streaming preview */}
        <div className="relative h-64 overflow-hidden">
          <pre className="p-5 text-[11px] leading-relaxed text-[#4a6660] font-mono whitespace-pre-wrap h-full overflow-hidden">
            {contentRef.current || ' '}
          </pre>
          {/* Fade gradient at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-[#7c8e88]">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>
              {wordCount > 0 ? `${wordCount.toLocaleString()} words generated...` : 'Thinking...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── ERROR ────────────────────────────────────────────────────────────────
  if (phase === PHASE.ERROR) {
    return (
      <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-bold text-red-700 mb-1">Generation failed</p>
        <p className="text-xs text-red-500 mb-4">{error}</p>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-[#1f644e] text-white text-xs font-bold rounded-xl hover:bg-[#184d3c] transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }

  // ─── DONE: full rendered content ──────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Result header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs font-bold text-[#7c8e88] hover:text-[#1f644e] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          New search
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-[#b5c4be]" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-[#1f644e] shrink-0" />
          <span className="text-xs font-bold text-[#1e3a34] truncate">{query}</span>
        </div>
        <button
          onClick={() => generate(query)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-[#1f644e] border border-[#d4e6de] rounded-full hover:bg-[#f0f5f2] transition-all shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          Regenerate
        </button>
      </div>

      {/* Rendered blocks */}
      <div ref={resultRef}>
        <CoursifyBlockRenderer content={content} />
      </div>

      {/* Bottom action */}
      <div className="mt-10 pt-6 border-t border-[#e5e3d8] flex items-center justify-between">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-xs font-bold text-[#7c8e88] hover:text-[#1f644e] transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          Search another topic
        </button>
        <p className="text-[10px] text-[#b5c4be]">
          AI-generated • verify from authoritative sources
        </p>
      </div>
    </div>
  );
}
