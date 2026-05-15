'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
  Search,
  Sparkles,
  Download,
  Loader2,
  Globe,
  BookOpen,
  Info,
  Wand2,
  Youtube,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateCoursifyPdf } from '@/utils/coursifyPdfGenerator';
import { CoursifyBlockRenderer } from '@/components/coursify/reader/CoursifyBlockRenderer';
import { BlockSkeleton } from '@/components/coursify/BlockSkeleton';
import { SafeBlockRenderer } from '@/components/coursify/SafeBlockRenderer';
import CoursifyStepHistory from '@/components/coursify/CoursifyStepHistory';
import { parseMarkdownToBlocks } from '@/utils/coursify-parser';

// Static fallbacks in case API fails
const FALLBACK_TOPICS = [
  "Dijkstra's Algorithm",
  'React Hooks in depth',
  'SQL Window Functions',
  'Machine Learning Basics',
];

// Phase constants
const PHASE = {
  IDLE: 'idle',
  GENERATING: 'generating',
  DONE: 'done',
  ERROR: 'error',
};

import { BalanceBadge } from './BalanceBadge';

export function AISearchEngine({ onGenerated }) {
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [activeTools, setActiveTools] = useState({});
  const [completedBlocks, setCompletedBlocks] = useState([]);
  const [inProgressBlock, setInProgressBlock] = useState('');
  const [copiedFull, setCopiedFull] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [balance, setBalance] = useState(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [suggestions, setSuggestions] = useState(FALLBACK_TOPICS);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [toolSteps, setToolSteps] = useState([]);

  const inputRef = useRef(null);
  const contentRef = useRef('');
  const resultRef = useRef(null);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    setIsBalanceLoading(true);
    try {
      const res = await fetch('/api/coursify/balance');
      const data = await res.json();
      setBalance(data);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setBalance({ status: 'error', message: 'Network or server error' });
    } finally {
      setIsBalanceLoading(false);
    }
  }, []);

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
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchBalance();
    fetchSuggestions();
  }, [fetchBalance, fetchSuggestions]);

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

  // Parse blocks progressively as content streams in
  useEffect(() => {
    if (phase !== PHASE.GENERATING) return;

    const allBlocks = parseMarkdownToBlocks(content);
    if (allBlocks.length === 0) {
      setCompletedBlocks([]);
      setInProgressBlock(content);
      return;
    }

    // If the content ends with a block separator (---) or we've reached a new block header,
    // the previous blocks are definitely complete.
    // However, for streaming UX, we'll treat all blocks except the last one as "complete".
    const completed = allBlocks.slice(0, -1);
    const inProgress = allBlocks[allBlocks.length - 1];

    setCompletedBlocks(completed);

    // Convert the in-progress block back to a pseudo-markdown string for the renderer
    // or just pass the block object if SafeBlockRenderer is updated.
    // For now, we'll use the last block's raw content or structure.
    setInProgressBlock(inProgress);
  }, [content, phase]);

  const generate = useCallback(async (topic) => {
    if (!topic.trim()) return;

    setQuery(topic.trim());
    setPhase(PHASE.GENERATING);
    setContent('');
    setStatusMessage(`🔍 Searching for "${topic}"`);
    setError('');
    setActiveTools({});
    setToolSteps([{ tool: 'agent', status: 'started', input: { query: topic } }]);
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
          let event;
          try {
            event = JSON.parse(line);
          } catch (e) {
            // skip truly malformed JSON
            continue;
          }

          if (event.type === 'content') {
            contentRef.current += event.message;
            setContent(contentRef.current);
          } else if (event.type === 'title') {
            setGeneratedTitle(event.text);
          } else if (event.type === 'status') {
            setStatusMessage(event.message);
          } else if (event.type === 'tool_call') {
            const { tool, status, input } = event;
            if (status === 'started') {
              // Extract the actual search query from tool input
              let searchQuery = topic;
              if (input?.input) {
                try {
                  const parsed = JSON.parse(input.input);
                  searchQuery = parsed.query || topic;
                } catch {
                  searchQuery = topic;
                }
              }
              setStatusMessage(
                `🔍 Searching for "${searchQuery.substring(0, 60)}${searchQuery.length > 60 ? '...' : ''}"`
              );
            } else if (status === 'completed') {
              setStatusMessage(`📖 Reading search results...`);
            }

            setToolSteps((prev) => {
              const existingIdx = prev.findIndex((s) => s.tool === tool && s.status === 'started');
              if (existingIdx !== -1) {
                const updated = [...prev];
                updated[existingIdx] = { ...updated[existingIdx], status, output: event.output };
                return updated;
              }
              return [...prev, { tool, status, input }];
            });

            setActiveTools((prev) => ({
              ...prev,
              [tool]: status,
            }));
            if (status === 'completed') {
              setTimeout(() => {
                setActiveTools((prev) => {
                  const updated = { ...prev };
                  delete updated[tool];
                  return updated;
                });
              }, 800);
            }
          } else if (event.type === 'done') {
            setPhase(PHASE.DONE);
            setStatusMessage('');
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }

      if (contentRef.current) setPhase(PHASE.DONE);
      // Refetch balance after generation via callback
      if (onGenerated) onGenerated();
      fetchBalance();
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

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    toast.loading('Preparing your PDF...', { id: 'pdf-export' });

    try {
      // Create a pseudo-course structure for the single generated section
      const doc = await generateCoursifyPdf({
        course: {
          title: generatedTitle || query,
          difficulty: 'intermediate',
        },
        sections: [
          {
            title: generatedTitle || query,
            content: content,
          },
        ],
      });
      doc.save(`${(generatedTitle || query).replace(/\s+/g, '_')}_Research.pdf`);
      toast.success('Research exported successfully!', { id: 'pdf-export' });
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('Failed to generate PDF.', { id: 'pdf-export' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setPhase(PHASE.IDLE);
    setInputValue('');
    setContent('');
    setError('');
    setStatusMessage('');
    contentRef.current = '';
    setCompletedBlocks([]);
    setInProgressBlock('');
    setCopiedFull(false);
    setGeneratedTitle('');
    setToolSteps([]);
  };

  const handleCopyFull = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFull(true);
      toast.success('Full content copied to clipboard!');
      setTimeout(() => setCopiedFull(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
      console.error(err);
    }
  };

  // ─── IDLE: Search input ───────────────────────────────────────────────────
  if (phase === PHASE.IDLE) {
    return (
      <div className="w-full">
        <h2 className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider mb-4">
          AI Research Engine
        </h2>

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-1 px-5 py-4 rounded-full border-2 border-[#e5e3d8] bg-white focus-within:border-[#1f644e] focus-within:shadow-none transition-all">
            <Sparkles className="w-5 h-5 text-[#1f644e] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What do you want to learn? e.g. Dijkstra's Algorithm..."
              className="flex-1 bg-transparent text-[#1e3a34] placeholder:text-[#b5c4be] text-sm sm:text-base outline-none pl-2"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex items-center gap-1 px-3 py-2 bg-[#1f644e] text-white text-xs font-bold rounded-full hover:bg-[#184d3c] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Generate</span>
            </button>
          </div>
        </form>

        <div className="mt-5 flex gap-2 overflow-x-auto flex-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
          {isSuggestionsLoading && suggestions.length === 0
            ? Array(5)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-24 bg-[#f0f5f2] rounded-full animate-pulse shrink-0"
                  />
                ))
            : suggestions.map((t, idx) => (
                <button
                  key={`${t}-${idx}`}
                  type="button"
                  onClick={() => generate(t)}
                  className="px-4 py-2 text-xs font-bold text-[#1f644e] bg-white border border-[#e5e3d8] rounded-full hover:bg-[#f0f5f2] hover:border-[#1f644e] hover:cursor-pointer transition-all shrink-0 whitespace-nowrap active:scale-95"
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
    const showDots = statusMessage.includes('Generating');

    return (
      <div className="w-full">
        {/* Generated Title */}
        {generatedTitle && (
          <div className="mb-6 pb-6 border-b border-[#e5e3d8]">
            <h2 className="text-2xl font-bold text-[#1e3a34]">{generatedTitle}</h2>
          </div>
        )}

        {/* Research History */}
        <CoursifyStepHistory steps={toolSteps} />

        {/* Rendered Blocks */}
        <div className="space-y-6">
          {completedBlocks.map((block, idx) => (
            <div key={`completed-${idx}`}>
              <SafeBlockRenderer blocks={[block]} isComplete={true} />
            </div>
          ))}

          {/* In-Progress Block - Rendered but Faded */}
          {inProgressBlock && (
            <div className="opacity-50 animate-pulse">
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

  // ─── ERROR ────────────────────────────────────────────────────────────────
  if (phase === PHASE.ERROR) {
    const isBalanceError =
      error.toLowerCase().includes('balance') || error.toLowerCase().includes('insufficient');

    return (
      <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-bold text-red-700 mb-1">
          {isBalanceError ? 'Credits Depleted' : 'Generation failed'}
        </p>
        <p className="text-xs text-red-500 mb-4">
          {isBalanceError
            ? 'Your AI credit balance is currently zero. Please wait for the hourly reset.'
            : 'An unexpected error occurred while generating content. Please try again later.'}
        </p>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-[#1f644e] text-white text-xs font-bold rounded-xl hover:bg-[#184d3c] transition-all"
        >
          {isBalanceError ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              Try after 1hr
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </>
          )}
        </button>
      </div>
    );
  }

  // ─── DONE: full rendered content ──────────────────────────────────────────
  return (
    <div className="w-full">
      <div className="flex items-center justify-end mb-4"></div>

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
          onClick={handleCopyFull}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-full transition-all shrink-0 ${
            copiedFull
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'text-[#1f644e] border border-[#d4e6de] hover:bg-[#f0f5f2]'
          }`}
          title="Copy all content"
        >
          {copiedFull ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-[#1f644e] border border-[#d4e6de] rounded-full hover:bg-[#f0f5f2] transition-all shrink-0 disabled:opacity-50"
          title="Download as PDF"
        >
          {isExporting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
          PDF
        </button>
        <button
          onClick={() => generate(query)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-[#1f644e] border border-[#d4e6de] rounded-full hover:bg-[#f0f5f2] transition-all shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          Regenerate
        </button>
      </div>

      {/* Generated Title */}
      {generatedTitle && (
        <div className="mb-8 pb-6 border-b border-[#e5e3d8]">
          <h2 className="text-2xl font-bold text-[#1e3a34]">{generatedTitle}</h2>
        </div>
      )}

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
