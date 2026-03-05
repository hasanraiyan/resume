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
  Edit2,
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
          isActive
            ? 'border-black shadow-md scale-100'
            : 'border-neutral-200 scale-95 opacity-80 group-hover:opacity-100 group-hover:scale-100'
        }`}
      >
        {slide.imageUrl && slide.imageUrl !== 'error' ? (
          <img
            src={slide.imageUrl}
            alt={slide.fallbackText || `Slide ${index + 1}`}
            className="w-full h-full object-cover animate-in fade-in duration-500"
          />
        ) : slide.status === 'failed' ? (
          <div className="w-full h-full bg-red-50 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
        ) : (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
            <Loader2 className="w-5 h-5 text-neutral-400 rotate-180 animate-spin relative z-10" />
          </div>
        )}
      </div>
      <span
        className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${
          isActive
            ? 'text-black font-bold'
            : 'text-neutral-400 font-medium group-hover:text-neutral-600'
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

  // Edit Mode States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedImage, setEditedImage] = useState(null);

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
    if (!outline || !outline.slides) return;

    setStatus('generating');
    setErrorMsg('');

    // Initialize slides array with placeholders
    const initialSlides = outline.slides.map((s) => ({
      status: 'pending',
      title: s.title,
      fallbackText: s.title,
      prompt: s.slideDesignBrief,
    }));
    setSlides(initialSlides);
    setActiveSlideIndex(0);

    let completedCount = 0;
    const totalCount = outline.slides.length;

    // Generate slides in parallel (with slight stagger for UX)
    outline.slides.forEach(async (slideData, idx) => {
      try {
        // Subtle delay for staggered start
        await new Promise((r) => setTimeout(r, idx * 300));

        const res = await fetch('/api/tools/presentation/generate-slide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slide: slideData,
            presentationTheme: outline.presentationTheme,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to generate slide');

        setSlides((prev) => {
          const newSlides = [...prev];
          newSlides[idx] = { ...data.slide, status: 'complete' };
          return newSlides;
        });

        completedCount++;

        // As soon as the FIRST slide is ready, switch to editing mode to be responsive
        if (completedCount === 1) {
          setStatus('complete');
        }
      } catch (e) {
        console.error(`Slide ${idx} generation failed:`, e);
        setSlides((prev) => {
          const newSlides = [...prev];
          newSlides[idx] = {
            status: 'failed',
            error: e.message,
            title: slideData.title,
            fallbackText: `Failed: ${slideData.title}`,
          };
          return newSlides;
        });
        completedCount++;
        if (completedCount === 1) setStatus('complete');
      }
    });
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
    resetEditStates();
  };

  // ─── Edit Handlers ───────────────────────────────────────────────────────
  const resetEditStates = () => {
    setIsEditModalOpen(false);
    setEditPrompt('');
    setIsEditing(false);
    setEditedImage(null);
    setErrorMsg('');
  };

  const handleOpenEditModal = () => {
    resetEditStates();
    setIsEditModalOpen(true);
  };

  const handleEditSlide = async () => {
    if (!editPrompt.trim() || !activeSlide?.imageUrl) return;

    setIsEditing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/tools/presentation/edit-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: activeSlide.imageUrl,
          prompt: editPrompt,
          aspectRatio: '16:9',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to edit slide');

      setEditedImage(data.imageUrl);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleConfirmEdit = () => {
    if (!editedImage) return;

    setSlides((prev) => {
      const newSlides = [...prev];
      newSlides[activeSlideIndex] = {
        ...newSlides[activeSlideIndex],
        imageUrl: editedImage,
      };
      return newSlides;
    });

    resetEditStates();
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

  // ─── "Edit Slide" Modal ────────────────────────────────────────────────
  const renderEditModal = () => (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border-2 border-neutral-800 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-md">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black font-['Playfair_Display'] tracking-tight">
                Edit <span className="italic text-neutral-500">Slide</span>
              </h2>
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mt-1">
                AI Image Editor
              </p>
            </div>
          </div>
          <button
            onClick={resetEditStates}
            className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-200 rounded-xl transition-all"
            aria-label="Close edit modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 bg-white overflow-y-auto">
          {!editedImage ? (
            <>
              <div>
                <label className="block text-xs font-bold text-black mb-3 uppercase tracking-widest">
                  Edit Prompt <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. Change the background to a dark futuristic aesthetic..."
                  rows={4}
                  className="w-full bg-white border-2 border-neutral-200 focus:border-black focus:ring-0 rounded-xl p-5 text-base resize-none transition-all outline-none font-medium text-black placeholder-neutral-400 shadow-sm"
                  disabled={isEditing}
                />
              </div>
              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <XCircle className="w-5 h-5 flex-shrink-0" /> {errorMsg}
                </div>
              )}
              <div className="pt-2">
                <button
                  onClick={handleEditSlide}
                  disabled={!editPrompt.trim() || isEditing}
                  className="w-full py-5 bg-black text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-neutral-800 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0 flex items-center justify-center gap-3 group"
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Editing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Apply Edit
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-black font-['Playfair_Display'] mb-2">
                  Review Edited Slide
                </h3>
                <p className="text-sm text-neutral-500">
                  Are you sure you want to replace the current slide image with this new one?
                </p>
              </div>

              <div className="rounded-xl overflow-hidden border-2 border-neutral-200 shadow-sm aspect-video bg-neutral-50">
                <img src={editedImage} alt="Edited preview" className="w-full h-full object-contain" />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditedImage(null)}
                  className="flex-1 py-4 text-xs font-bold text-neutral-600 bg-neutral-100 rounded-xl uppercase tracking-widest hover:bg-neutral-200 transition-all"
                >
                  Cancel / Retry
                </button>
                <button
                  onClick={handleConfirmEdit}
                  className="flex-1 py-4 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Replace Image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
              Creative Direction{' '}
              <span className="text-neutral-400 font-normal ml-1">(Optional)</span>
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
    <div className="flex-1 flex items-center justify-center bg-[#f5f5f5] overflow-hidden">
      <div className="relative w-full max-w-4xl aspect-video mx-auto px-8">
        {/* Animated Mesh Gradient background for the "Slide Preview" look */}
        <div className="absolute inset-0 bg-white rounded-3xl border-2 border-neutral-200 overflow-hidden shadow-2xl scale-[0.95] animate-in fade-in zoom-in-95 duration-1000">
          {/* Animated Mesh Gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #fef0e7 0%, #fce4ec 25%, #f3e5f5 50%, #ede7f6 75%, #fef0e7 100%)',
              backgroundSize: '400% 400%',
              animation: 'meshGradient 6s ease infinite',
            }}
          />
          {/* Orbs */}
          <div
            className="absolute w-[60%] h-[60%] rounded-full blur-[80px] opacity-60 top-[10%] left-[10%]"
            style={{
              background: 'radial-gradient(circle, #f8bbd0 0%, transparent 70%)',
              animation: 'orbFloat1 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-[50%] h-[50%] rounded-full blur-[70px] opacity-50 bottom-[10%] right-[5%]"
            style={{
              background: 'radial-gradient(circle, #e1bee7 0%, transparent 70%)',
              animation: 'orbFloat2 10s ease-in-out infinite',
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-8 p-12 bg-white/30 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl mx-4">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-[3px] border-black/10 rounded-full" />
                <div className="absolute inset-0 border-[3px] border-black border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full m-1.5 shadow-sm">
                  {status === 'drafting' ? (
                    <Brain className="w-8 h-8 text-black" />
                  ) : (
                    <Wand2 className="w-8 h-8 text-black" />
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-black font-['Playfair_Display'] tracking-tight">
                  {status === 'drafting' ? 'Synthesizing Narrative' : 'Rendering Visuals'}
                </h3>
                <div className="mt-4 flex flex-col items-center gap-3">
                  <p className="text-neutral-600/80 text-sm max-w-md mx-auto font-medium leading-relaxed">
                    {status === 'drafting'
                      ? 'The AI agent is researching your topic and constructing a logical, high-impact narrative flow.'
                      : `Initializing parallel diffusion models. Just a moment while we render your first slide...`}
                  </p>

                  {status === 'generating' && slides && (
                    <div className="w-full max-w-xs bg-black/5 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-black h-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${(slides.filter((s) => s.status === 'complete').length / slides.length) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes meshGradient {
          0% {
            background-position: 0% 50%;
          }
          25% {
            background-position: 100% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          75% {
            background-position: 0% 100%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes orbFloat1 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30%, 20%) scale(1.1);
          }
          66% {
            transform: translate(-10%, 30%) scale(0.95);
          }
        }
        @keyframes orbFloat2 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-25%, -15%) scale(1.05);
          }
          66% {
            transform: translate(15%, -25%) scale(1.1);
          }
        }
      `}</style>
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
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Render
              Visuals
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
                <h4 className="text-xl font-bold text-black font-['Playfair_Display'] tracking-tight">
                  Slide {(idx + 1).toString().padStart(2, '0')}
                </h4>
                <div className="mt-4 text-xs bg-neutral-50 text-neutral-600 p-4 rounded-xl border border-neutral-200 font-mono leading-relaxed max-h-32 overflow-y-auto">
                  <span className="font-bold text-black uppercase tracking-widest mr-2">
                    Visual Prompt:
                  </span>
                  {slide.visualPrompt}
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
          <Link
            href="/tools"
            className="text-neutral-400 hover:text-black transition-colors"
            aria-label="Back to tools"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block max-w-[200px] lg:max-w-md">
            <h1 className="text-sm font-bold text-black font-['Playfair_Display'] tracking-wide truncate">
              {topic || 'Untitled Presentation'}
            </h1>
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold truncate">
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
        <main
          ref={canvasRef}
          className="flex-1 flex flex-col min-h-0 bg-[#f5f5f5] overflow-y-auto md:overflow-hidden"
        >
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
                <span className="text-sm font-bold uppercase tracking-widest">
                  Create a Presentation
                </span>
              </button>
            </div>
          )}

          {/* Drafting / Generating / Uploading */}
          {(status === 'drafting' || status === 'generating') && renderLoading()}

          {/* Outline Review */}
          {status === 'review' && outline && renderOutlineReview()}

          {/* Edit Modal Overlay */}
          {isEditModalOpen && renderEditModal()}

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
                  <>
                    <button
                      onClick={handleOpenEditModal}
                      className="px-4 py-2 bg-neutral-100 hover:bg-black hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-neutral-200 hover:border-black"
                      title="Edit Slide Image"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <a
                      href={activeSlide.imageUrl}
                      download={`slide-${activeSlideIndex + 1}.png`}
                      className="px-4 py-2 bg-neutral-100 hover:bg-black hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-neutral-200 hover:border-black"
                      title="Download Slide"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
