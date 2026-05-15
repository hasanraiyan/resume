// ✅ FINAL FIXED AISearchEngine.jsx
// Fully responsive + overflow-safe + mobile-safe

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, RotateCcw, Search, Sparkles, Globe } from 'lucide-react';

import { toast } from 'sonner';

import { generateCoursifyPdf } from '@/utils/coursifyPdfGenerator';

import { CoursifyBlockRenderer } from '@/components/coursify/reader/CoursifyBlockRenderer';

import { SafeBlockRenderer } from '@/components/coursify/SafeBlockRenderer';

import CoursifyStepHistory from '@/components/coursify/CoursifyStepHistory';

import { parseMarkdownToBlocks } from '@/utils/coursify-parser';

const FALLBACK_TOPICS = [
  "Dijkstra's Algorithm",
  'React Hooks in depth',
  'SQL Window Functions',
  'Machine Learning Basics',
  'TCP/IP Networking',
  'Dynamic Programming',
  'System Design',
  'Quantum Computing',
];

const PHASE = {
  IDLE: 'idle',
  GENERATING: 'generating',
  DONE: 'done',
  ERROR: 'error',
};

export function AISearchEngine({ onGenerated }) {
  const [phase, setPhase] = useState(PHASE.IDLE);

  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  const [statusMessage, setStatusMessage] = useState('');

  const [content, setContent] = useState('');

  const [error, setError] = useState('');

  const [completedBlocks, setCompletedBlocks] = useState([]);

  const [inProgressBlock, setInProgressBlock] = useState('');

  const [generatedTitle, setGeneratedTitle] = useState('');

  const [suggestions, setSuggestions] = useState(FALLBACK_TOPICS);

  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const [toolSteps, setToolSteps] = useState([]);

  const [generatedSlug, setGeneratedSlug] = useState('');

  const inputRef = useRef(null);

  const contentRef = useRef('');

  const resultRef = useRef(null);
  const hasAutoFilled = useRef(false);
  const searchParams = useSearchParams();

  // Handle auto-fill from query param
  useEffect(() => {
    const autoTopic = searchParams.get('search_ai');
    if (autoTopic && !hasAutoFilled.current) {
      hasAutoFilled.current = true;
      setInputValue(autoTopic);
    }
  }, [searchParams]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    setIsSuggestionsLoading(true);

    try {
      const res = await fetch('/api/coursify/suggestions');

      const data = await res.json();

      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    if (phase === PHASE.IDLE) {
      inputRef.current?.focus();
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== PHASE.GENERATING) return;

    const allBlocks = parseMarkdownToBlocks(content);

    if (allBlocks.length === 0) {
      setCompletedBlocks([]);
      setInProgressBlock(content);
      return;
    }

    const completed = allBlocks.slice(0, -1);

    const inProgress = allBlocks[allBlocks.length - 1];

    setCompletedBlocks(completed);

    setInProgressBlock(inProgress);
  }, [content, phase]);

  const generate = useCallback(async (topic) => {
    if (!topic.trim()) return;

    setQuery(topic.trim());

    setPhase(PHASE.GENERATING);

    setContent('');

    setStatusMessage(`🔍 Searching for "${topic}"`);

    setError('');

    setToolSteps([
      {
        tool: 'agent',
        status: 'started',
        input: { query: topic },
      },
    ]);

    contentRef.current = '';

    try {
      const res = await fetch('/api/coursify/generate', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          topic: topic.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate');
      }

      const reader = res.body.getReader();

      const decoder = new TextDecoder();

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        const lines = buffer.split('\n');

        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;

          let event;

          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          if (event.type === 'content') {
            contentRef.current += event.message;

            setContent(contentRef.current);
          } else if (event.type === 'title') {
            setGeneratedTitle(event.text);
          } else if (event.type === 'status') {
            setStatusMessage(event.message);
          } else if (event.type === 'persist') {
            setGeneratedSlug(event.slug);
          } else if (event.type === 'done') {
            setPhase(PHASE.DONE);

            setStatusMessage('');
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }

      if (contentRef.current) {
        setPhase(PHASE.DONE);
      }

      if (onGenerated) {
        onGenerated();
      }
    } catch (err) {
      console.error(err);

      setError(err.message || 'Something went wrong.');

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

    setCompletedBlocks([]);

    setInProgressBlock('');

    setGeneratedTitle('');

    setToolSteps([]);
  };

  // =====================================================
  // IDLE
  // =====================================================

  if (phase === PHASE.IDLE) {
    return (
      <div className="w-full max-w-full overflow-x-hidden">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
          AI Research Engine
        </h2>

        {/* Search */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex w-full items-center gap-2 rounded-full border-2 border-[#e5e3d8] bg-white px-4 py-3 transition-all focus-within:border-[#1f644e]">
            <Sparkles className="h-5 w-5 shrink-0 text-[#1f644e]" />

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What do you want to learn?"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#1e3a34] outline-none placeholder:text-[#b5c4be] sm:text-base"
            />

            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="shrink-0 rounded-full bg-[#1f644e] px-3 py-2 text-xs font-bold text-white transition-all hover:bg-[#184d3c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="flex items-center gap-1">
                <Search className="h-4 w-4" />

                <span className="hidden sm:inline">Generate</span>
              </div>
            </button>
          </div>
        </form>

        {/* Suggestions */}
        <div className="mt-5 w-full overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {isSuggestionsLoading && suggestions.length === 0
              ? Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-[#f0f5f2]"
                    />
                  ))
              : suggestions.map((t, idx) => (
                  <button
                    key={`${t}-${idx}`}
                    type="button"
                    onClick={() => generate(t)}
                    className="max-w-[240px] shrink-0 truncate whitespace-nowrap rounded-full border border-[#e5e3d8] bg-white px-4 py-2 text-xs font-bold text-[#1f644e] transition-all hover:border-[#1f644e] hover:bg-[#f0f5f2]"
                  >
                    {t}
                  </button>
                ))}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // GENERATING
  // =====================================================

  if (phase === PHASE.GENERATING) {
    return (
      <div className="w-full overflow-x-hidden">
        {generatedTitle && (
          <div className="mb-6 border-b border-[#e5e3d8] pb-6">
            <h2 className="break-words text-2xl font-bold text-[#1e3a34]">{generatedTitle}</h2>
          </div>
        )}

        <CoursifyStepHistory steps={toolSteps} />

        <div className="space-y-6 overflow-hidden">
          {completedBlocks.map((block, idx) => (
            <div key={`completed-${idx}`} className="overflow-hidden">
              <SafeBlockRenderer blocks={[block]} isComplete />
            </div>
          ))}

          {inProgressBlock && (
            <div className="animate-pulse overflow-hidden opacity-50">
              <SafeBlockRenderer
                blocks={typeof inProgressBlock === 'string' ? null : [inProgressBlock]}
                content={typeof inProgressBlock === 'string' ? inProgressBlock : null}
                isComplete={false}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (phase === PHASE.ERROR) {
    return (
      <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="mb-1 text-sm font-bold text-red-700">Generation failed</p>

        <p className="mb-4 text-xs text-red-500">{error}</p>

        <button
          onClick={handleReset}
          className="mx-auto flex items-center gap-2 rounded-xl bg-[#1f644e] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#184d3c]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    );
  }

  // =====================================================
  // DONE
  // =====================================================

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-[#7c8e88] transition-colors hover:text-[#1f644e]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          New search
        </button>

        <ChevronRight className="h-3.5 w-3.5 text-[#b5c4be]" />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#1f644e]" />

          <span className="truncate text-xs font-bold text-[#1e3a34]">
            {generatedTitle || query}
          </span>
        </div>

        <Link
          href={`/coursify/r/${generatedSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#d4e6de] px-3 py-1.5 text-[10px] font-bold text-[#1f644e] transition-all hover:bg-[#f0f5f2]"
        >
          <Globe className="h-3 w-3" />
          Open
        </Link>
      </div>

      {/* Title */}
      {generatedTitle && (
        <div className="mb-8 border-b border-[#e5e3d8] pb-6">
          <h2 className="break-words text-2xl font-bold text-[#1e3a34]">{generatedTitle}</h2>
        </div>
      )}

      {/* Content */}
      <div ref={resultRef} className="w-full max-w-full overflow-x-hidden">
        <CoursifyBlockRenderer content={content} />
      </div>

      {/* Footer */}
      <div className="mt-10 flex flex-col gap-3 border-t border-[#e5e3d8] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-xs font-bold text-[#7c8e88] transition-colors hover:text-[#1f644e]"
        >
          <Search className="h-3.5 w-3.5" />
          Search another topic
        </button>

        <p className="text-[10px] text-[#b5c4be]">
          AI-generated • verify from authoritative sources
        </p>
      </div>
    </div>
  );
}
