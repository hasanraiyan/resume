'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArticleForm } from '@/components/admin/ArticleForm';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Card } from '@/components/ui';
import { AGENT_IDS } from '@/lib/constants/agents';

const AI_STEPS = [
  { id: 'researchTopic', label: 'Researching topic', icon: 'fa-magnifying-glass' },
  { id: 'planOutline', label: 'Planning outline & images', icon: 'fa-pen-nib' },
  {
    id: 'writeAndGenerate',
    label: 'Writing draft & generating images',
    icon: 'fa-wand-magic-sparkles',
  },
  { id: 'assembleAndSave', label: 'Assembling & saving article', icon: 'fa-floppy-disk' },
];

export default function NewArticlePage() {
  const router = useRouter();
  const [mode, setMode] = useState(null); // null = choosing, 'manual', 'ai'
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isGenerating) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isGenerating]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setProgress(1);
    setError(null);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: topic,
          topic: topic,
          agentId: AGENT_IDS.BLOG_WRITER,
          chatHistory: [],
          activeMCPs: [],
        }),
        signal: abortController.signal,
      });

      if (!res.ok) throw new Error('Failed to start article generation');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let articleId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'progress') {
              setProgress(event.percent || 0);
              if (event.articleId) articleId = event.articleId;
            } else if (event.type === 'status') {
              // Update live status messages
              setCurrentStatus(event.message || '');
            }
          } catch {
            // skip non-JSON lines
          }
        }
      }

      if (articleId) {
        router.push(`/admin/articles/${articleId}/edit`);
      } else {
        router.push('/admin/articles');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong');
        setIsGenerating(false);
      }
    }
  }, [topic, router]);

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setProgress(0);
  };

  // ─── Mode Selection ───
  if (!mode) {
    return (
      <AdminPageWrapper
        title="New Article"
        description="Choose how you want to create your article."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          {/* Manual */}
          <button onClick={() => setMode('manual')} className="text-left group focus:outline-none">
            <Card className="p-0 overflow-hidden border-2 border-neutral-100 hover:border-black transition-all duration-300 h-full">
              {/* Top visual band */}
              <div className="h-32 bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
                    backgroundSize: '20px 20px',
                  }}
                />
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <i className="fas fa-pen-fancy text-2xl text-neutral-700"></i>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-black mb-2 group-hover:underline decoration-2 underline-offset-4">
                  Write Manually
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-4">
                  Full control with the rich text editor. Add your own content, formatting, images,
                  and metadata.
                </p>
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-neutral-400 group-hover:text-black transition-colors">
                  Open Editor{' '}
                  <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                </span>
              </div>
            </Card>
          </button>

          {/* AI */}
          <button onClick={() => setMode('ai')} className="text-left group focus:outline-none">
            <Card className="p-0 overflow-hidden border-2 border-neutral-100 hover:border-blue-600 transition-all duration-300 h-full relative">
              {/* Badge */}
              <div className="absolute top-4 right-4 z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase">
                  <i className="fas fa-sparkles text-[8px]"></i> AI
                </span>
              </div>
              {/* Top visual band */}
              <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute w-64 h-64 rounded-full bg-blue-100/50 -top-32 -right-16 blur-2xl" />
                <div className="absolute w-48 h-48 rounded-full bg-indigo-100/50 -bottom-24 -left-12 blur-2xl" />
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center group-hover:scale-110 transition-all duration-300 relative z-10">
                  <i className="fas fa-wand-magic-sparkles text-2xl text-blue-600"></i>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-black mb-2 group-hover:underline decoration-blue-600 decoration-2 underline-offset-4">
                  Generate with AI
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-4">
                  Describe your topic. The AI agent will research, write, and generate images — all
                  automatically.
                </p>
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-blue-600">
                  Start Generating{' '}
                  <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                </span>
              </div>
            </Card>
          </button>
        </div>
      </AdminPageWrapper>
    );
  }

  // ─── Manual Mode ───
  if (mode === 'manual') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setMode(null)}
            className="text-sm text-neutral-500 hover:text-black transition-colors mb-4 inline-flex items-center gap-1.5"
          >
            <i className="fas fa-arrow-left text-xs"></i> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">New Article</h1>
          <p className="text-gray-600">Create a new blog article</p>
        </div>
        <ArticleForm />
      </div>
    );
  }

  // ─── AI Mode ───
  const currentStepIndex = Math.min(
    Math.floor((progress / 100) * AI_STEPS.length),
    AI_STEPS.length - 1
  );

  return (
    <AdminPageWrapper
      title="AI Article Generator"
      description="Describe your topic and the AI will create a complete, publish-ready article."
    >
      <div className="max-w-2xl">
        {/* Back link */}
        <button
          onClick={() => {
            if (isGenerating) return;
            setMode(null);
          }}
          className={`text-sm transition-colors mb-8 inline-flex items-center gap-1.5 ${
            isGenerating
              ? 'text-neutral-300 cursor-not-allowed'
              : 'text-neutral-500 hover:text-black'
          }`}
          disabled={isGenerating}
        >
          <i className="fas fa-arrow-left text-xs"></i> Back
        </button>

        {!isGenerating ? (
          <div className="space-y-8">
            {/* Topic Input Card */}
            <Card className="p-0 overflow-hidden border-2 border-neutral-100">
              <div className="p-6 pb-0">
                <label className="block text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-3">
                  Article Topic
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Describe what the article should be about..."
                  rows={5}
                  className="w-full text-sm text-neutral-800 placeholder:text-neutral-300 bg-transparent border-none focus:outline-none resize-none leading-relaxed"
                  autoFocus
                />
              </div>
              <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  {topic.trim().length > 0
                    ? `${topic.trim().split(/\s+/).length} words`
                    : 'Start typing...'}
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={!topic.trim()}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    topic.trim()
                      ? 'bg-black text-white hover:bg-neutral-800'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <i className="fas fa-wand-magic-sparkles text-xs"></i>
                  Generate
                </button>
              </div>
            </Card>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-start gap-3">
                <i className="fas fa-circle-exclamation mt-0.5"></i>
                <div>
                  <p className="font-medium">Generation failed</p>
                  <p className="text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Pipeline preview */}
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-neutral-400 mb-4">
                The AI pipeline
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AI_STEPS.map((step, i) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-neutral-50 border border-neutral-100"
                  >
                    <i className={`fas ${step.icon} text-xs text-neutral-400`}></i>
                    <span className="text-xs text-neutral-600 leading-tight">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ─── Progress View ─── */
          <Card className="p-0 overflow-hidden border-2 border-neutral-100">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold tracking-wider uppercase text-neutral-400 mb-1">
                    Generating article
                  </p>
                  <p className="text-sm text-neutral-700 truncate pr-4">{topic}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs tabular-nums text-neutral-400">
                    {formatTime(elapsed)}
                  </span>
                  <button
                    onClick={handleCancel}
                    className="text-xs text-neutral-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums text-neutral-500 w-8 text-right">
                  {progress}%
                </span>
              </div>
            </div>

            {/* Steps */}
            <div className="px-6 py-6">
              <div className="space-y-1">
                {AI_STEPS.map((step, i) => {
                  let status = 'pending';
                  if (i < currentStepIndex) status = 'done';
                  else if (i === currentStepIndex && progress > 0) status = 'active';

                  // Show live status message for active step
                  const showStatus = status === 'active' && currentStatus;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-300 ${
                        status === 'active' ? 'bg-neutral-50' : ''
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {status === 'done' ? (
                          <i className="fas fa-circle-check text-sm text-green-500"></i>
                        ) : status === 'active' ? (
                          <i className="fas fa-circle-notch fa-spin text-sm text-black"></i>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-neutral-200" />
                        )}
                      </div>
                      <span
                        className={`text-sm transition-colors duration-300 ${
                          status === 'done'
                            ? 'text-neutral-500'
                            : status === 'active'
                              ? 'text-black font-medium'
                              : 'text-neutral-300'
                        }`}
                      >
                        {status === 'active' && currentStatus ? currentStatus : step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom hint */}
            <div className="px-6 py-3 bg-neutral-50/50 border-t border-neutral-100">
              <p className="text-[11px] text-neutral-400 text-center">
                This usually takes 1–3 minutes. You&apos;ll be redirected to the editor when done.
              </p>
            </div>
          </Card>
        )}
      </div>
    </AdminPageWrapper>
  );
}
