'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, RotateCcw, Search, Sparkles, Globe, Quote } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { toast } from 'sonner';

import { EventType } from '@ag-ui/core';
import { parseAGUIStream } from '@/utils/aguiStream';

import { generateCoursifyPdf } from '@/utils/coursifyPdfGenerator';

import { CoursifyBlockRenderer } from '@/components/coursify/reader/CoursifyBlockRenderer';
import { MarkdownRenderer } from '@/components/coursify/reader/MarkdownRenderer';

import { SafeBlockRenderer } from '@/components/coursify/SafeBlockRenderer';

import { RelatedArticlesGrid } from '@/components/coursify/RelatedArticlesGrid';

import CoursifyStepHistory from '@/components/coursify/CoursifyStepHistory';
import ChatInput from '@/components/chatbot/ChatInput';

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

function upsertResearchPlanStep(setToolSteps, plan) {
  if (!plan) return;

  setToolSteps((prev) => {
    const step = {
      tool: 'research_plan',
      status: 'completed',
      toolCallId: 'research-plan',
      plan,
    };

    const existingIndex = prev.findIndex((item) => item.toolCallId === step.toolCallId);
    if (existingIndex === -1) return [step, ...prev];

    return prev.map((item, index) => (index === existingIndex ? { ...item, ...step } : item));
  });
}

export function AISearchEngine({ onGenerated }) {
  const [phase, setPhase] = useState(PHASE.IDLE);

  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const toggleListening = () => setIsListening((prev) => !prev);

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

  const [isFromCache, setIsFromCache] = useState(false);

  const [relatedArticles, setRelatedArticles] = useState([]);

  const [isRelatedLoading, setIsRelatedLoading] = useState(false);

  // Dev-only options (only shown when running `pnpm dev`)
  const isDev = process.env.NODE_ENV === 'development';
  const { data: session } = useSession();
  const isAuthenticated = session?.user?.role === 'admin';
  const [generationMode, setGenerationMode] = useState('flash'); // 'flash' | 'pro' | 'research'

  const modeOptions = [
    { id: 'flash', label: 'Flash' },
    { id: 'pro', label: 'Pro' },
    ...(isDev ? [{ id: 'research', label: 'Antigravity' }] : []),
  ];

  // Sync default generationMode once auth session resolves
  useEffect(() => {
    console.log('[AISearchEngine] Session state updated:', {
      session,
      isAuthenticated,
      role: session?.user?.role,
    });
    if (isAuthenticated) {
      setGenerationMode('pro');
    } else {
      setGenerationMode('flash');
    }
  }, [isAuthenticated, session]);

  const inputRef = useRef(null);

  const contentRef = useRef('');

  const resultRef = useRef(null);
  const previousSearchRef = useRef(null);
  const searchParams = useSearchParams();

  // Handle auto-fill from query param
  useEffect(() => {
    const autoTopic = searchParams.get('search_ai');

    if (autoTopic && autoTopic !== previousSearchRef.current) {
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

  useEffect(() => {
    if (phase === PHASE.DONE && generatedSlug) {
      const fetchRelated = async () => {
        setIsRelatedLoading(true);
        try {
          const res = await fetch(`/api/coursify/related?slug=${generatedSlug}`);
          const data = await res.json();
          setRelatedArticles(data.related || []);
        } catch (err) {
          console.error('Failed to fetch related articles:', err);
        } finally {
          setIsRelatedLoading(false);
        }
      };

      fetchRelated();
    }
  }, [phase, generatedSlug]);

  const generate = useCallback(
    async (topic) => {
      if (!topic.trim()) return;

      setQuery(topic.trim());
      setPhase(PHASE.GENERATING);
      setContent('');
      setError('');
      setToolSteps([]);
      setGeneratedTitle('');
      setGeneratedSlug('');
      setIsFromCache(false);
      setRelatedArticles([]);
      setIsRelatedLoading(false);
      contentRef.current = '';

      try {
        const payload = {
          topic: topic.trim(),
          isReferenceEnabled: true,
        };

        payload.agent = generationMode;

        const res = await fetch('/api/coursify/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error('Failed to generate');
        }

        // Consume the AG-UI SSE stream
        for await (const event of parseAGUIStream(res)) {
          if (event.type === EventType.TEXT_MESSAGE_CONTENT) {
            contentRef.current += event.delta || '';
            setContent(contentRef.current);
          } else if (event.type === EventType.CUSTOM) {
            const { name, value } = event;
            if (name === 'coursify_title') {
              setGeneratedTitle(value?.text || '');
            } else if (name === 'coursify_cache_hit') {
              setIsFromCache(true);
            } else if (name === 'coursify_research_plan') {
              upsertResearchPlanStep(setToolSteps, value);
            } else if (name === 'coursify_persist') {
              setGeneratedSlug(value?.slug || '');
            }
          } else if (event.type === EventType.TOOL_CALL_START) {
            setToolSteps((prev) => [
              ...prev,
              {
                tool: event.toolCallName,
                status: 'running',
                toolCallId: event.toolCallId,
                input: null,
              },
            ]);
          } else if (event.type === EventType.TOOL_CALL_ARGS) {
            setToolSteps((prev) =>
              prev.map((step) =>
                step.toolCallId === event.toolCallId
                  ? {
                      ...step,
                      input: (() => {
                        try {
                          return JSON.parse(event.delta || '{}');
                        } catch {
                          return { query: event.delta };
                        }
                      })(),
                    }
                  : step
              )
            );
          } else if (event.type === EventType.TOOL_CALL_END) {
            setToolSteps((prev) =>
              prev.map((step) =>
                step.toolCallId === event.toolCallId ? { ...step, status: 'completed' } : step
              )
            );
          } else if (event.type === EventType.TOOL_CALL_RESULT) {
            // Attach raw result snippet to the matching step for inline display
            setToolSteps((prev) =>
              prev.map((step) =>
                step.toolCallId === event.toolCallId ? { ...step, result: event.result } : step
              )
            );
          } else if (event.type === EventType.REASONING_MESSAGE_CONTENT) {
            setStatusMessage(event.delta || '');
          } else if (event.type === EventType.REASONING_END) {
            setStatusMessage('');
          } else if (event.type === EventType.STATE_SNAPSHOT) {
            // Consolidate run metadata from the final snapshot
            const snap = event.snapshot || {};
            if (snap.title) setGeneratedTitle(snap.title);
            if (snap.slug) setGeneratedSlug(snap.slug);
            if (snap.fromCache) setIsFromCache(true);
            if (snap.researchPlan) upsertResearchPlanStep(setToolSteps, snap.researchPlan);
          } else if (event.type === EventType.STEP_STARTED && event.stepName) {
            setStatusMessage(event.stepName);
          } else if (event.type === EventType.STEP_FINISHED) {
            setStatusMessage('');
          } else if (event.type === EventType.RUN_FINISHED) {
            setPhase(PHASE.DONE);
            setStatusMessage('');
          } else if (event.type === EventType.RUN_ERROR) {
            throw new Error(event.message || 'Generation failed');
          }
        }

        if (contentRef.current && phase !== PHASE.DONE) {
          setPhase(PHASE.DONE);
        }

        if (onGenerated) {
          onGenerated();
        }
      } catch (err) {
        console.error(err);

        let displayError = err.message || 'Something went wrong.';

        if (
          displayError.includes('quota') ||
          displayError.includes('rate limit') ||
          displayError.includes('429')
        ) {
          displayError = 'API quota exceeded. Please try again in a few moments.';
        } else if (
          displayError.includes('GoogleGenerativeAI') ||
          displayError.includes('generativelanguage')
        ) {
          displayError = 'Service temporarily unavailable. Please try again.';
        } else if (displayError.includes('fetch') || displayError.includes('network')) {
          displayError = 'Connection error. Please check your internet and try again.';
        }

        setError(displayError);
        setPhase(PHASE.ERROR);
      }
    },
    [onGenerated, isDev, generationMode]
  );

  // Handle auto-generate when send=true parameter is present
  useEffect(() => {
    const autoTopic = searchParams.get('search_ai');
    const autoSend = searchParams.get('send');

    if (autoTopic && autoSend === 'true' && autoTopic !== previousSearchRef.current) {
      previousSearchRef.current = autoTopic;
      generate(autoTopic);
    }
  }, [searchParams, generate]);

  const handleSubmit = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
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
    setIsFromCache(false);
    setRelatedArticles([]);
    setIsRelatedLoading(false);
  };

  // =====================================================
  // IDLE
  // =====================================================

  if (phase === PHASE.IDLE) {
    return (
      <div className="w-full max-w-full">
        {/* Search */}
        <div className="w-full">
          <ChatInput
            inputRef={inputRef}
            inputMessage={inputValue}
            setInputMessage={setInputValue}
            isLoading={phase === PHASE.GENERATING}
            handleSubmit={handleSubmit}
            onStop={() => {}}
            theme="green"
            showModelSelector={false}
            showModeToggle={true}
            chatMode={generationMode}
            setChatMode={setGenerationMode}
            disabledModes={!isAuthenticated ? ['pro'] : []}
            customModeOptions={modeOptions}
            dropdownPosition="down"
            customOuterBg="bg-[#f7f7f2]"
            customInnerBg="bg-white"
            customPadding="p-0"
            showTopBorder={false}
            chatbotSettings={{ aiName: 'Coursify' }}
            isListening={isListening}
            toggleListening={toggleListening}
          />
        </div>

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
            <MarkdownRenderer content={generatedTitle} />
          </div>
        )}

        {statusMessage && (
          <div className="mb-4 text-sm font-bold text-[#7c8e88]">{statusMessage}</div>
        )}

        {toolSteps.length === 0 && !generatedTitle && (
          <div className="mb-6 flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-[#f0f5f2] border-t-[#1f644e] rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#7c8e88]">Researching...</p>
          </div>
        )}

        <CoursifyStepHistory steps={toolSteps} showThinking />

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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-[#7c8e88] transition-colors hover:text-[#1f644e]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline"></span>
          </button>

          <div className="flex min-w-0 items-center gap-2 ml-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#1f644e]" />
            <span className="truncate text-xs font-bold text-[#1e3a34]">
              <MarkdownRenderer content={generatedTitle || query} isInline />
            </span>
            {isFromCache && (
              <span className="whitespace-nowrap rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700 ml-2">
                ⚡ From cache
              </span>
            )}
          </div>
        </div>

        {generatedSlug && (
          <Link
            href={`/coursify/r/${generatedSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#1f644e] px-3 py-1.5 text-[10px] font-bold text-white transition-all hover:bg-[#184d3c] shadow-sm shadow-[#1f644e]/20"
          >
            <Globe className="h-3 w-3" />
            Open
          </Link>
        )}
      </div>

      {/* Title */}
      {generatedTitle && (
        <div className="mb-8 border-b border-[#e5e3d8] pb-6">
          <h2 className="break-words text-2xl font-bold text-[#1e3a34]">{generatedTitle}</h2>
        </div>
      )}

      {/* Research steps */}
      <CoursifyStepHistory steps={toolSteps} />

      {/* Content */}
      <div ref={resultRef} className="w-full max-w-full overflow-x-hidden">
        <CoursifyBlockRenderer content={content} />
      </div>

      {/* Related Articles */}
      {(isRelatedLoading || relatedArticles.length > 0) && (
        <div className="mt-12">
          <div className="mb-4 h-3 w-32 rounded-full bg-[#f0f5f2] animate-pulse" />
          {isRelatedLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[#e5e3d8] bg-white p-4 space-y-3"
                  >
                    <div className="h-3 w-3/4 rounded-full bg-[#f0f5f2] animate-pulse" />
                    <div className="h-2.5 w-full rounded-full bg-[#f0f5f2] animate-pulse" />
                    <div className="h-2.5 w-5/6 rounded-full bg-[#f0f5f2] animate-pulse" />
                    <div className="h-2 w-1/3 rounded-full bg-[#f0f5f2] animate-pulse mt-2" />
                  </div>
                ))}
            </div>
          ) : (
            <RelatedArticlesGrid articles={relatedArticles} variant="grid" />
          )}
        </div>
      )}

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
