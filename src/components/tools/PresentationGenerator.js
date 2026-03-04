'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Brain,
  Wand2,
  XCircle,
  LayoutGrid,
  Download,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  FileText,
  PlusCircle,
  Maximize2,
  Minimize2,
  Loader2,
  ArrowLeft,
  X,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { uploadFiles } from '@/utils/uploadthing';
import Link from 'next/link';

// ─── Slide Thumbnail ─────────────────────────────────────────────────────────
function SlideThumbnail({ slide, index, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-start gap-3 p-2 rounded-xl transition-all duration-200 ${
        isActive ? 'bg-blue-50 ring-2 ring-blue-500' : 'hover:bg-neutral-100'
      }`}
    >
      <span
        className={`text-[11px] font-mono mt-1 w-5 text-right flex-shrink-0 ${
          isActive ? 'text-blue-600 font-bold' : 'text-neutral-400'
        }`}
      >
        {index + 1}
      </span>
      <div
        className={`w-full aspect-video rounded-lg overflow-hidden border ${
          isActive ? 'border-blue-300 shadow-sm' : 'border-neutral-200'
        }`}
      >
        {slide.imageUrl && slide.imageUrl !== 'error' ? (
          <img
            src={slide.imageUrl}
            alt={slide.fallbackText || `Slide ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : slide.status === 'failed' ? (
          <div className="w-full h-full bg-red-50 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-red-300" />
          </div>
        ) : (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-neutral-300" />
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PresentationGenerator() {
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [presentationId, setPresentationId] = useState(null);
  const [outline, setOutline] = useState(null);
  const [slides, setSlides] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showModal, setShowModal] = useState(true);

  const canvasRef = useRef(null);
  const searchParams = useSearchParams();
  const autoStartRef = useRef(false);

  // ─── Auto-start from URL params (e.g., from PPTCreatorTeaser) ───────────
  useEffect(() => {
    if (autoStartRef.current) return;
    const urlTopic = searchParams.get('topic');
    if (urlTopic) {
      autoStartRef.current = true;
      setTopic(urlTopic);
      setShowModal(false);
      // Defer to next tick so state is set
      setTimeout(() => {
        handleDraftOutlineFromTeaser(urlTopic);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleDraftOutlineFromTeaser = async (teaserTopic) => {
    setStatus('drafting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/tools/presentation/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: teaserTopic, instructions: '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to draft outline');
      setPresentationId(data.presentationId);
      setOutline(data.outline);
      setStatus('review');
    } catch (e) {
      setErrorMsg(e.message);
      setStatus('error');
    }
  };

  // ─── API Handlers ────────────────────────────────────────────────────────
  const handleDraftOutline = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please provide a topic.');
      return;
    }
    setShowModal(false);
    setStatus('drafting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/tools/presentation/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, instructions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to draft outline');
      setPresentationId(data.presentationId);
      setOutline(data.outline);
      setStatus('review');
    } catch (e) {
      setErrorMsg(e.message);
      setStatus('error');
    }
  };

  const handleGenerateSlides = async () => {
    setStatus('generating');
    setErrorMsg('');
    try {
      const res = await fetch('/api/tools/presentation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presentationId, outline }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate visuals');
      setSlides(data.slides);
      setActiveSlideIndex(0);
      if (data.slides.some((s) => s.needsUpload)) {
        setStatus('uploading');
        await handleGuestUploads(data.slides, data.presentationId);
      } else {
        setStatus('complete');
      }
    } catch (e) {
      setErrorMsg(e.message);
      setStatus('error');
    }
  };

  const handleGuestUploads = async (rawSlides, pId) => {
    try {
      const validSlides = [];
      const filesToUpload = [];
      rawSlides.forEach((s, idx) => {
        if (s.imageUrl && s.imageUrl !== 'error' && s.imageUrl.startsWith('data:image')) {
          const base64Data = s.imageUrl.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++)
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });
          const file = new File([blob], `slide-${idx}.png`, { type: 'image/png' });
          validSlides.push({ index: idx, slide: s });
          filesToUpload.push(file);
        }
      });
      let uploadRes = [];
      if (filesToUpload.length > 0) {
        uploadRes = await uploadFiles('publicPresentationUploader', { files: filesToUpload });
      }
      const updatedSlides = [...rawSlides];
      validSlides.forEach((validSlide, i) => {
        if (uploadRes[i]) updatedSlides[validSlide.index].imageUrl = uploadRes[i].url;
        updatedSlides[validSlide.index].needsUpload = false;
      });
      updatedSlides.forEach((s) => {
        s.needsUpload = false;
      });
      const finalizeRes = await fetch('/api/tools/presentation/generate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presentationId: pId, slides: updatedSlides }),
      });
      const fd = await finalizeRes.json();
      setSlides(fd.presentation?.slides || updatedSlides);
      setStatus('complete');
    } catch (e) {
      console.warn('Guest upload failed.', e);
      setErrorMsg('Failed to finalize image uploads.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setTopic('');
    setInstructions('');
    setOutline(null);
    setSlides(null);
    setPresentationId(null);
    setStatus('idle');
    setErrorMsg('');
    setActiveSlideIndex(0);
    setShowModal(true);
  };

  // ─── Navigation ──────────────────────────────────────────────────────────
  const totalSlides = slides?.length || outline?.length || 0;
  const goNext = useCallback(
    () => setActiveSlideIndex((i) => Math.min(i + 1, totalSlides - 1)),
    [totalSlides]
  );
  const goPrev = useCallback(() => setActiveSlideIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, isFullscreen]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      canvasRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // ─── Determine current active slide data ─────────────────────────────────
  const activeSlide = slides?.[activeSlideIndex] || null;
  const activeOutlineSlide = outline?.[activeSlideIndex] || null;

  // ─── Fullscreen Slideshow Mode ───────────────────────────────────────────
  if (isFullscreen && slides) {
    return (
      <div
        ref={canvasRef}
        className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
        onClick={goNext}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(false);
          }}
          className="absolute top-6 right-6 z-50 text-white/60 hover:text-white transition-colors"
        >
          <Minimize2 className="w-6 h-6" />
        </button>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-sm font-mono">
          {activeSlideIndex + 1} / {slides.length}
        </div>
        {activeSlide?.imageUrl && activeSlide.imageUrl !== 'error' ? (
          <img src={activeSlide.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="text-white/40 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4" />
            <p>Slide generation failed</p>
          </div>
        )}
      </div>
    );
  }

  // ─── "New Presentation" Modal (Google Slides Inspired) ───────────────────
  const renderModal = () => (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-800">
                <span className="text-blue-600">Hello.</span> Let&apos;s start creating.
              </h2>
            </div>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">
              Topic or Research Area
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The impact of Generative AI on Enterprise Architecture..."
              rows={3}
              className="w-full bg-neutral-50 border border-neutral-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-4 text-sm resize-none transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">
              Creative Direction <span className="text-neutral-300">(Optional)</span>
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Dark futuristic aesthetic, strictly 5 slides"
              className="w-full bg-neutral-50 border border-neutral-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm transition-all outline-none"
            />
          </div>
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
            </div>
          )}
          <button
            onClick={handleDraftOutline}
            disabled={!topic.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Synthesize Outline
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Loading State ───────────────────────────────────────────────────────
  const renderLoading = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-[3px] border-neutral-100 rounded-full" />
          <div className="absolute inset-0 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            {status === 'drafting' ? (
              <Brain className="w-7 h-7 text-blue-500" />
            ) : (
              <Wand2 className="w-7 h-7 text-blue-500" />
            )}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-neutral-800">
            {status === 'drafting'
              ? 'Researching & Structuring...'
              : status === 'uploading'
                ? 'Finalizing Assets...'
                : 'Generating Visual Slides...'}
          </h3>
          <p className="text-neutral-500 text-sm mt-2 max-w-sm mx-auto">
            {status === 'drafting'
              ? 'The AI agent is researching your topic and constructing a logical narrative flow.'
              : 'Deploying parallel image models to render your presentation deck.'}
          </p>
        </div>
      </div>
    </div>
  );

  // ─── Outline Review (replaces main canvas area) ──────────────────────────
  const renderOutlineReview = () => (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10">
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-2xl font-bold text-neutral-800">Review Your Outline</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Verify the narrative flow. When ready, approve to start visual generation.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {outline.map((slide, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-neutral-200 p-5 flex gap-5 hover:shadow-sm transition-shadow"
            >
              <div className="text-neutral-300 font-mono font-bold text-lg leading-none pt-1">
                {(idx + 1).toString().padStart(2, '0')}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-neutral-800 mb-2">{slide.title}</h4>
                <ul className="space-y-1.5 mb-3">
                  {slide.points.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-neutral-600 leading-relaxed">
                      <span className="text-blue-400 mt-[3px]">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-xs bg-blue-50/70 text-blue-700 p-3 rounded-xl border border-blue-100 font-mono leading-relaxed">
                  <span className="font-bold text-blue-800">Visual:</span> {slide.visualPrompt}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 text-sm text-neutral-500 hover:text-black font-medium transition-colors"
          >
            Start Over
          </button>
          <button
            onClick={handleGenerateSlides}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Approve & Generate Visuals
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Main Editor Layout ──────────────────────────────────────────────────
  const isEditorView = status === 'complete' && slides;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f8f9fa] font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* ── Top Toolbar ──────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 flex-shrink-0 z-20">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link href="/tools" className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-neutral-800 leading-tight">
              {topic || 'Untitled Presentation'}
            </h1>
            <p className="text-[11px] text-neutral-400">
              {status === 'idle'
                ? 'Ready'
                : status === 'drafting'
                  ? 'Researching...'
                  : status === 'review'
                    ? 'Outline ready for review'
                    : status === 'generating'
                      ? 'Generating visuals...'
                      : status === 'uploading'
                        ? 'Uploading assets...'
                        : status === 'complete'
                          ? `${slides?.length || 0} slides`
                          : 'Error'}
            </p>
          </div>
        </div>

        {/* Center */}
        {isEditorView && (
          <div className="hidden md:flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={goPrev}
              disabled={activeSlideIndex === 0}
              className="p-1.5 rounded-md hover:bg-white disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-neutral-600 px-2 min-w-[60px] text-center">
              {activeSlideIndex + 1} / {slides.length}
            </span>
            <button
              onClick={goNext}
              disabled={activeSlideIndex === slides.length - 1}
              className="p-1.5 rounded-md hover:bg-white disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-2">
          {isEditorView && (
            <>
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-all"
                title="Slideshow"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-all"
                title="New Presentation"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {status === 'error' && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </header>

      {/* ── Error Banner ─────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center gap-2 text-sm text-red-600 flex-shrink-0">
          <XCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
        </div>
      )}

      {/* ── Main Body ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Slide Thumbnails */}
        {isEditorView && (
          <aside className="w-[140px] lg:w-[180px] bg-white border-r border-neutral-200 overflow-y-auto p-3 space-y-1 flex-shrink-0">
            {slides.map((slide, idx) => (
              <SlideThumbnail
                key={idx}
                slide={slide}
                index={idx}
                isActive={idx === activeSlideIndex}
                onClick={() => setActiveSlideIndex(idx)}
              />
            ))}
          </aside>
        )}

        {/* Main Canvas Area */}
        <main ref={canvasRef} className="flex-1 flex flex-col overflow-hidden">
          {/* Idle (show modal) */}
          {(status === 'idle' || status === 'error') && showModal && renderModal()}
          {(status === 'idle' || status === 'error') && !showModal && (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => setShowModal(true)}
                className="flex flex-col items-center gap-4 text-neutral-400 hover:text-blue-500 transition-colors group"
              >
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-neutral-200 group-hover:border-blue-300 flex items-center justify-center transition-colors">
                  <PlusCircle className="w-8 h-8" />
                </div>
                <span className="text-sm font-medium">Create a Presentation</span>
              </button>
            </div>
          )}

          {/* Drafting / Generating / Uploading */}
          {(status === 'drafting' || status === 'generating' || status === 'uploading') &&
            renderLoading()}

          {/* Outline Review */}
          {status === 'review' && outline && renderOutlineReview()}

          {/* Complete: Slide Viewer */}
          {isEditorView && activeSlide && (
            <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-[#f0f0f0]">
              <div className="w-full max-w-5xl aspect-video bg-white rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.08)] overflow-hidden relative group">
                {activeSlide.imageUrl && activeSlide.imageUrl !== 'error' ? (
                  <img
                    src={activeSlide.imageUrl}
                    alt={activeSlide.fallbackText}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-3 bg-neutral-50">
                    <XCircle className="w-12 h-12 text-red-300" />
                    <p className="text-sm font-medium text-red-400">
                      Failed to generate this slide
                    </p>
                    {activeSlide.error && (
                      <p className="text-xs text-neutral-400 max-w-sm text-center">
                        {activeSlide.error}
                      </p>
                    )}
                  </div>
                )}

                {/* Slide overlay badge */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[11px] font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Slide {activeSlideIndex + 1}
                </div>
              </div>
            </div>
          )}

          {/* Bottom: Slide details strip for editors */}
          {isEditorView && activeSlide && (
            <div className="h-12 bg-white border-t border-neutral-200 flex items-center justify-between px-4 flex-shrink-0">
              <p
                className="text-xs text-neutral-400 font-mono truncate max-w-lg"
                title={activeSlide.prompt || activeSlide.fallbackText}
              >
                {activeSlide.fallbackText || 'No description'}
              </p>
              <div className="flex items-center gap-2">
                {activeSlide.imageUrl && activeSlide.imageUrl !== 'error' && (
                  <a
                    href={activeSlide.imageUrl}
                    download={`slide-${activeSlideIndex + 1}.png`}
                    className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-all"
                    title="Download Slide"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
