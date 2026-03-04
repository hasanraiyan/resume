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
import Link from 'next/link';

// ─── Slide Thumbnail ─────────────────────────────────────────────────────────
function SlideThumbnail({ slide, index, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
        isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'
      }`}
    >
      <div
        className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${
          isActive ? 'border-black shadow-md scale-100' : 'border-neutral-200 scale-95 opacity-80 group-hover:opacity-100 group-hover:scale-100'
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
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
        ) : (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-neutral-300" />
          </div>
        )}
      </div>
      <span
        className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${
          isActive ? 'text-black font-bold' : 'text-neutral-400 font-medium group-hover:text-neutral-600'
        }`}
      >
        Slide {(index + 1).toString().padStart(2, '0')}
      </span>
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
      setStatus('complete');
    } catch (e) {
      setErrorMsg(e.message);
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
  const totalSlides = slides?.length || outline?.slides?.length || 0;
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
  const activeOutlineSlide = outline?.slides?.[activeSlideIndex] || null;

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
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border-2 border-neutral-800 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-md">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black font-['Playfair_Display'] tracking-tight">
                Presentation <span className="italic text-neutral-500">Synthesizer</span>
              </h2>
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mt-1">
                AI-Powered Deck Creation
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-200 rounded-xl transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 bg-white">
          <div>
            <label className="block text-xs font-bold text-black mb-3 uppercase tracking-widest">
              Topic or Research Area <span className="text-red-500">*</span>
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The impact of Generative AI on Enterprise Architecture..."
              rows={4}
              className="w-full bg-white border-2 border-neutral-200 focus:border-black focus:ring-0 rounded-xl p-5 text-base resize-none transition-all outline-none font-medium text-black placeholder-neutral-400 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-black mb-3 uppercase tracking-widest">
              Creative Direction <span className="text-neutral-400 font-normal ml-1">(Optional)</span>
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Dark futuristic aesthetic, strictly 5 slides"
              className="w-full bg-white border-2 border-neutral-200 focus:border-black focus:ring-0 rounded-xl px-5 py-4 text-base transition-all outline-none font-medium text-black placeholder-neutral-400 shadow-sm"
            />
          </div>
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl flex items-center gap-3 text-sm font-medium">
              <XCircle className="w-5 h-5 flex-shrink-0" /> {errorMsg}
            </div>
          )}
          <div className="pt-2">
            <button
              onClick={handleDraftOutline}
              disabled={!topic.trim()}
              className="w-full py-5 bg-black text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-neutral-800 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0 flex items-center justify-center gap-3 group"
            >
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Synthesize Outline
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Loading State ───────────────────────────────────────────────────────
  const renderLoading = () => (
    <div className="flex-1 flex items-center justify-center bg-[#f5f5f5]">
      <div className="text-center space-y-8 animate-in fade-in duration-500 p-8">
        <div className="relative w-32 h-32 mx-auto">
          {/* Minimalist black spinner */}
          <div className="absolute inset-0 border-[4px] border-neutral-200 rounded-full" />
          <div className="absolute inset-0 border-[4px] border-black border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full m-2 shadow-sm border border-neutral-100">
            {status === 'drafting' ? (
              <Brain className="w-8 h-8 text-black" />
            ) : (
              <Wand2 className="w-8 h-8 text-black" />
            )}
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-black font-['Playfair_Display'] tracking-tight">
            {status === 'drafting' ? 'Synthesizing Narrative' : 'Rendering Visuals'}
          </h3>
          <p className="text-neutral-500 text-sm mt-3 max-w-md mx-auto font-medium leading-relaxed">
            {status === 'drafting'
              ? 'The AI agent is actively researching your topic and constructing a logical, high-impact narrative flow.'
              : 'Deploying parallel diffusion models to render custom visual assets for your presentation deck.'}
          </p>
        </div>
      </div>
    </div>
  );

  // ─── Outline Review (replaces main canvas area) ──────────────────────────
  const renderOutlineReview = () => (
    <div className="flex-1 overflow-y-auto p-6 lg:p-12 bg-[#f5f5f5]">
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-black pb-6">
          <div>
            <h3 className="text-4xl font-bold text-black font-['Playfair_Display'] tracking-tight">
              Review Outline
            </h3>
            <p className="text-sm font-medium text-neutral-500 mt-2 uppercase tracking-widest">
              Verify narrative flow before visual rendering
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleReset}
              className="px-6 py-3 text-xs font-bold text-neutral-500 hover:text-black hover:bg-neutral-200 bg-neutral-100 rounded-xl uppercase tracking-widest transition-all"
            >
              Start Over
            </button>
            <button
              onClick={handleGenerateSlides}
              className="px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Render Visuals
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {outline.slides.map((slide, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border-2 border-neutral-200 p-6 flex flex-col sm:flex-row gap-6 hover:border-black hover:shadow-xl transition-all duration-300 group"
            >
              <div className="text-neutral-300 font-mono font-bold text-3xl leading-none pt-1 group-hover:text-black transition-colors">
                {(idx + 1).toString().padStart(2, '0')}
              </div>
              <div className="flex-1 min-w-0 space-y-4">
                <h4 className="text-xl font-bold text-black font-['Playfair_Display'] tracking-tight">{slide.title}</h4>
                <ul className="space-y-2">
                  {slide.points.map((p, i) => (
                    <li key={i} className="flex gap-3 text-sm text-neutral-600 font-medium leading-relaxed">
                      <span className="text-black mt-[5px] w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-xs bg-neutral-50 text-neutral-600 p-4 rounded-xl border border-neutral-200 font-mono leading-relaxed max-h-32 overflow-y-auto">
                  <span className="font-bold text-black uppercase tracking-widest mr-2">Design Brief:</span>
                  {slide.slideDesignBrief}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Main Editor Layout ──────────────────────────────────────────────────
  const isEditorView = status === 'complete' && slides;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f5f5f5] font-sans selection:bg-black/10 overflow-hidden">
      {/* ── Top Toolbar ──────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 flex-shrink-0 z-20">
        {/* Left */}
        <div className="flex items-center gap-4">
          <Link href="/tools" className="text-neutral-400 hover:text-black transition-colors" aria-label="Back to tools">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-black font-['Playfair_Display'] tracking-wide">
              {topic || 'Untitled Presentation'}
            </h1>
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
              {status === 'idle'
                ? 'Ready'
                : status === 'drafting'
                  ? 'Researching...'
                  : status === 'review'
                    ? 'Outline ready for review'
                    : status === 'generating'
                      ? 'Generating visuals...'
                      : status === 'complete'
                        ? `${slides?.length || 0} slides`
                        : 'Error'}
            </p>
          </div>
        </div>

        {/* Center */}
        {isEditorView && (
          <div className="hidden md:flex items-center gap-1 bg-neutral-100 rounded-xl p-1 border border-neutral-200">
            <button
              onClick={goPrev}
              disabled={activeSlideIndex === 0}
              className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-all text-neutral-600 hover:text-black hover:shadow-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-neutral-800 px-3 min-w-[70px] text-center tracking-wider">
              {activeSlideIndex + 1} / {slides.length}
            </span>
            <button
              onClick={goNext}
              disabled={activeSlideIndex === slides.length - 1}
              className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-all text-neutral-600 hover:text-black hover:shadow-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-3">
          {isEditorView && (
            <>
              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl hover:bg-neutral-100 text-neutral-500 hover:text-black transition-all border border-transparent hover:border-neutral-200"
                title="Slideshow"
                aria-label="Enter slideshow mode"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl hover:bg-neutral-100 text-neutral-500 hover:text-black transition-all border border-transparent hover:border-neutral-200"
                title="New Presentation"
                aria-label="Start new presentation"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {status === 'error' && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-2 uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
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
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar / Topbar for Thumbnails */}
        {isEditorView && (
          <aside className="md:w-[140px] lg:w-[180px] bg-white md:border-r border-b md:border-b-0 border-neutral-200 overflow-x-auto md:overflow-y-auto p-3 md:p-4 flex md:flex-col gap-3 md:gap-2 flex-shrink-0 custom-chat-scrollbar">
            {slides.map((slide, idx) => (
              <div key={idx} className="w-[120px] md:w-full flex-shrink-0">
                <SlideThumbnail
                  slide={slide}
                  index={idx}
                  isActive={idx === activeSlideIndex}
                  onClick={() => setActiveSlideIndex(idx)}
                />
              </div>
            ))}
          </aside>
        )}

        {/* Main Canvas Area */}
        <main ref={canvasRef} className="flex-1 flex flex-col min-h-0 bg-[#f5f5f5] overflow-y-auto md:overflow-hidden">
          {/* Idle (show modal) */}
          {(status === 'idle' || status === 'error') && showModal && renderModal()}
          {(status === 'idle' || status === 'error') && !showModal && (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => setShowModal(true)}
                className="flex flex-col items-center gap-4 text-neutral-400 hover:text-black transition-colors group"
              >
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-neutral-300 group-hover:border-black group-hover:shadow-xl group-hover:-translate-y-1 flex items-center justify-center transition-all">
                  <PlusCircle className="w-10 h-10 group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Create a Presentation</span>
              </button>
            </div>
          )}

          {/* Drafting / Generating / Uploading */}
          {(status === 'drafting' || status === 'generating') && renderLoading()}

          {/* Outline Review */}
          {status === 'review' && outline && renderOutlineReview()}

          {/* Complete: Slide Viewer */}
          {isEditorView && activeSlide && (
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
              <div className="w-full max-w-6xl aspect-video bg-white rounded-2xl shadow-2xl border-2 border-black overflow-hidden relative group">
                {activeSlide.imageUrl && activeSlide.imageUrl !== 'error' ? (
                  <img
                    src={activeSlide.imageUrl}
                    alt={activeSlide.fallbackText}
                    className="w-full h-full object-contain bg-neutral-50"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-4 bg-neutral-50 p-6 text-center">
                    <XCircle className="w-16 h-16 text-red-400" />
                    <p className="text-lg font-bold text-red-500 font-['Playfair_Display']">
                      Failed to Generate Slide
                    </p>
                    {activeSlide.error && (
                      <p className="text-xs font-mono bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 max-w-md">
                        {activeSlide.error}
                      </p>
                    )}
                  </div>
                )}

                {/* Slide overlay badge */}
                <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  Slide {(activeSlideIndex + 1).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          )}

          {/* Bottom: Slide details strip for editors */}
          {isEditorView && activeSlide && (
            <div className="h-16 bg-white border-t border-neutral-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
              <p
                className="text-xs text-neutral-500 font-mono truncate max-w-2xl"
                title={activeSlide.prompt || activeSlide.fallbackText}
              >
                {activeSlide.fallbackText || 'No description available'}
              </p>
              <div className="flex items-center gap-3">
                {activeSlide.imageUrl && activeSlide.imageUrl !== 'error' && (
                  <a
                    href={activeSlide.imageUrl}
                    download={`slide-${activeSlideIndex + 1}.png`}
                    className="px-4 py-2 bg-neutral-100 hover:bg-black hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-neutral-200 hover:border-black"
                    title="Download Slide"
                  >
                    <Download className="w-4 h-4" /> Download
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
