'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Brain,
  Wand2,
  XCircle,
  Download,
  Play,
  RotateCcw,
  PlusCircle,
  Minimize2,
  Loader2,
  ArrowLeft,
  X,
  Settings2,
  LayoutTemplate,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  GripVertical,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

// --- Utility Functions (Kept exactly the same as your solid logic) ---
const getDefaultSlideTitle = (index) => `Slide ${index + 1}`;

function normalizeOutlineSlide(slide = {}, index = 0) {
  const fallbackTitle =
    (typeof slide.title === 'string' && slide.title.trim()) ||
    (typeof slide.fallbackText === 'string' && slide.fallbackText.trim()) ||
    getDefaultSlideTitle(index);
  const visualPrompt =
    (typeof slide.visualPrompt === 'string' && slide.visualPrompt.trim()) ||
    (typeof slide.prompt === 'string' && slide.prompt.trim()) ||
    '';
  return { title: fallbackTitle, visualPrompt };
}

function normalizeRenderedSlide(slide = {}, index = 0) {
  const outlineSlide = normalizeOutlineSlide(slide, index);
  const fallbackText =
    (typeof slide.fallbackText === 'string' && slide.fallbackText.trim()) || outlineSlide.title;
  const prompt =
    (typeof slide.prompt === 'string' && slide.prompt.trim()) || outlineSlide.visualPrompt;
  return {
    title: outlineSlide.title,
    fallbackText,
    visualPrompt: outlineSlide.visualPrompt,
    prompt,
    imageUrl: slide.imageUrl || null,
    status: slide.status || (slide.imageUrl ? 'complete' : 'pending'),
    ...(slide.error ? { error: slide.error } : {}),
  };
}

function normalizePresentationOutline(outline) {
  if (!outline) return null;
  return {
    ...outline,
    designSystem: outline.designSystem ?? null,
    slides: Array.isArray(outline.slides) ? outline.slides.map(normalizeOutlineSlide) : [],
  };
}

function insertItemAtIndex(items, index, item) {
  return [...items.slice(0, index), item, ...items.slice(index)];
}

function replaceItemAtIndex(items, index, item) {
  return items.map((currentItem, currentIndex) => (currentIndex === index ? item : currentItem));
}

function removeItemAtIndex(items, index) {
  return items.filter((_, currentIndex) => currentIndex !== index);
}

function buildDeckContextSlides(outlineSlides = [], renderedSlides = []) {
  return outlineSlides.map((outlineSlide, index) => {
    const renderedSlide = renderedSlides[index];
    const normalizedContextSlide = normalizeOutlineSlide(
      {
        ...renderedSlide,
        ...outlineSlide,
        title: outlineSlide?.title || renderedSlide?.title || renderedSlide?.fallbackText,
      },
      index
    );
    return {
      title: normalizedContextSlide.title,
      fallbackText: renderedSlide?.fallbackText || normalizedContextSlide.title,
      visualPrompt: normalizedContextSlide.visualPrompt,
    };
  });
}

function getDerivedSlideTitle(slideBrief, fallbackIndex) {
  const compactBrief = slideBrief.trim().replace(/\s+/g, ' ');
  if (!compactBrief) return getDefaultSlideTitle(fallbackIndex);
  const firstSentence = compactBrief.split(/[.!?]/)[0].trim();
  return (firstSentence || compactBrief).slice(0, 80);
}

// ─── Main Application Component ──────────────────────────────────────────────
export default function PresentationGenerator() {
  // App State
  const [status, setStatus] = useState('idle'); // idle | drafting | review | generating | complete | error
  const [errorMsg, setErrorMsg] = useState('');

  // Generation Settings
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [slideCount, setSlideCount] = useState(7);
  const [designStyle, setDesignStyle] = useState('premium_blue');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Data State
  const [presentationId, setPresentationId] = useState(null);
  const [outline, setOutline] = useState(null);
  const [slides, setSlides] = useState(null);

  // Editor State
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Right Sidebar State (Tools)
  const [rightPanelTab, setRightPanelTab] = useState('edit'); // edit | add
  const [editImagePrompt, setEditImagePrompt] = useState('');
  const [isEditGenerating, setIsEditGenerating] = useState(false);
  const [addSlideBrief, setAddSlideBrief] = useState('');
  const [isAddSlideGenerating, setIsAddSlideGenerating] = useState(false);

  const canvasRef = useRef(null);
  const searchParams = useSearchParams();
  const autoStartRef = useRef(false);

  // ─── Auto-start from URL ─────────────────────────────────────────────────
  useEffect(() => {
    if (autoStartRef.current) return;
    const urlTopic = searchParams.get('topic');
    const urlStyle = searchParams.get('style');
    if (urlTopic) {
      autoStartRef.current = true;
      setTopic(urlTopic);
      if (urlStyle) setDesignStyle(urlStyle);
      handleDraftOutlineFromTeaser(urlTopic, urlStyle || designStyle);
    }
  }, [searchParams]);

  // ─── API Handlers ────────────────────────────────────────────────────────
  const handleDraftOutlineFromTeaser = async (teaserTopic, teaserStyle) => {
    executeDraftOutline(teaserTopic, '', slideCount, teaserStyle);
  };

  const handleDraftOutline = async () => {
    if (!topic.trim()) return;
    executeDraftOutline(topic, instructions, slideCount, designStyle);
  };

  const executeDraftOutline = async (t, inst, count, style) => {
    setStatus('drafting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/tools/presentation/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: t,
          instructions: inst,
          slideCount: count,
          designStyle: style,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to draft outline');
      setPresentationId(data.presentationId);
      setOutline(normalizePresentationOutline(data.outline));
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
    const normalizedOutline = normalizePresentationOutline(outline);
    setOutline(normalizedOutline);

    const initialSlides = normalizedOutline.slides.map((slide, index) =>
      normalizeRenderedSlide(
        {
          title: slide.title,
          fallbackText: slide.title,
          visualPrompt: slide.visualPrompt,
          status: 'pending',
        },
        index
      )
    );
    setSlides(initialSlides);
    setActiveSlideIndex(0);

    let completedCount = 0;
    normalizedOutline.slides.forEach(async (slideData, idx) => {
      try {
        await new Promise((r) => setTimeout(r, idx * 300));
        const res = await fetch('/api/tools/presentation/generate-slide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slide: slideData, designSystem: normalizedOutline.designSystem }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to generate slide');
        setSlides((prev) => replaceItemAtIndex(prev, idx, normalizeRenderedSlide(data.slide, idx)));
      } catch (e) {
        setSlides((prev) =>
          replaceItemAtIndex(
            prev,
            idx,
            normalizeRenderedSlide({ status: 'failed', error: e.message, ...slideData }, idx)
          )
        );
      } finally {
        completedCount++;
        if (completedCount === 1) setStatus('complete');
      }
    });
  };

  const handleReset = () => {
    setTopic('');
    setInstructions('');
    setSlideCount(7);
    setOutline(null);
    setSlides(null);
    setPresentationId(null);
    setStatus('idle');
    setErrorMsg('');
    setActiveSlideIndex(0);
  };

  // ─── Editor Actions ──────────────────────────────────────────────────────
  const deleteEditorSlide = (index) => {
    setSlides((prev) => (prev.length <= 1 ? prev : removeItemAtIndex(prev, index)));
    setOutline((prev) =>
      prev && prev.slides.length > 1
        ? { ...prev, slides: removeItemAtIndex(prev.slides, index) }
        : prev
    );
    setActiveSlideIndex((curr) => (curr >= index && curr > 0 ? curr - 1 : curr));
  };

  const handleAddEditorSlide = async () => {
    if (!addSlideBrief.trim() || !outline) return;
    const insertionIndex = activeSlideIndex + 1;
    const slideBrief = addSlideBrief.trim();
    const placeholderTitle = getDerivedSlideTitle(slideBrief, insertionIndex);
    const placeholderRendered = normalizeRenderedSlide(
      { title: placeholderTitle, visualPrompt: slideBrief, status: 'generating' },
      insertionIndex
    );

    setIsAddSlideGenerating(true);
    setSlides((prev) => insertItemAtIndex(prev, insertionIndex, placeholderRendered));
    setOutline((prev) =>
      prev
        ? {
            ...prev,
            slides: insertItemAtIndex(
              prev.slides,
              insertionIndex,
              normalizeOutlineSlide(
                { title: placeholderTitle, visualPrompt: slideBrief },
                insertionIndex
              )
            ),
          }
        : prev
    );
    setActiveSlideIndex(insertionIndex);
    setRightPanelTab('edit');

    try {
      const res = await fetch('/api/tools/presentation/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideBrief,
          topic: topic || 'Presentation',
          designSystem: outline.designSystem,
          existingSlides: buildDeckContextSlides(outline.slides, slides || []),
          insertionIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate slide');
      setSlides((prev) =>
        replaceItemAtIndex(prev, insertionIndex, normalizeRenderedSlide(data.slide, insertionIndex))
      );
      setAddSlideBrief('');
    } catch (e) {
      setSlides((prev) =>
        replaceItemAtIndex(prev, insertionIndex, {
          ...placeholderRendered,
          status: 'failed',
          error: e.message,
        })
      );
    } finally {
      setIsAddSlideGenerating(false);
    }
  };

  const handleRegenerateSlide = async (index) => {
    const slideToRegen = slides[index];
    if (!slideToRegen || !slideToRegen.visualPrompt) return;

    setSlides((prev) => replaceItemAtIndex(prev, index, { ...prev[index], status: 'generating' }));

    try {
      const res = await fetch('/api/tools/presentation/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide: slideToRegen, designSystem: outline?.designSystem }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSlides((prev) =>
        replaceItemAtIndex(prev, index, normalizeRenderedSlide(data.slide, index))
      );
    } catch (e) {
      setSlides((prev) =>
        replaceItemAtIndex(prev, index, { ...prev[index], status: 'failed', error: e.message })
      );
    }
  };

  const handleEditImageSubmit = async () => {
    if (!editImagePrompt.trim() || !slides[activeSlideIndex]?.imageUrl) return;
    setIsEditGenerating(true);
    const targetIndex = activeSlideIndex;
    try {
      const res = await fetch('/api/tools/presentation/edit-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideImageBase64: slides[targetIndex].imageUrl,
          editPrompt: editImagePrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSlides((prev) =>
        replaceItemAtIndex(prev, targetIndex, {
          ...prev[targetIndex],
          imageUrl: data.slide.imageUrl,
        })
      );
      setEditImagePrompt('');
    } catch (e) {
      alert('Failed to edit image: ' + e.message);
    } finally {
      setIsEditGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!slides || slides.length === 0) return;
    setIsExporting(true);
    try {
      const imageUrls = slides
        .filter((s) => s.imageUrl && s.imageUrl !== 'error')
        .map((s) => s.imageUrl);
      if (imageUrls.length === 0) throw new Error('No completed slides to export');
      const response = await fetch('https://pdfservice.pyqdeck.in/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imageUrls, title: topic || 'Presentation' }),
      });
      if (!response.ok) throw new Error('PDF service error');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(topic || 'presentation').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert(error.message || 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Keyboard navigation
  const goNext = useCallback(
    () => setActiveSlideIndex((i) => Math.min(i + 1, (slides?.length || 0) - 1)),
    [slides]
  );
  const goPrev = useCallback(() => setActiveSlideIndex((i) => Math.max(i - 1, 0)), []);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, isFullscreen]);

  // ─── Sub-Renderers ───────────────────────────────────────────────────────

  const renderStartScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white overflow-y-auto">
      <div className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-neutral-200">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            What would you like to present?
          </h1>
          <p className="text-neutral-500 text-lg">
            Type a topic, and AI will generate a complete, stunning deck.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-neutral-900 focus-within:border-transparent transition-all">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. A pitch deck for a new sustainable coffee brand aiming for seed funding..."
            className="w-full h-32 p-6 text-lg text-neutral-900 placeholder:text-neutral-400 resize-none outline-none border-none"
            autoFocus
          />
          <div className="bg-neutral-50 border-t border-neutral-100 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-2 transition-colors"
            >
              <Settings2 className="w-4 h-4" /> Options{' '}
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDraftOutline}
              disabled={!topic.trim()}
              className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-all disabled:opacity-30 disabled:hover:bg-neutral-900 flex items-center gap-2"
            >
              <Brain className="w-4 h-4" /> Generate Outline
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-6 p-6 bg-neutral-50 rounded-2xl border border-neutral-100 animate-in slide-in-from-top-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Length
              </label>
              <select
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
              >
                {[5, 7, 10, 15].map((n) => (
                  <option key={n} value={n}>
                    {n} Slides
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Visual Theme
              </label>
              <select
                value={designStyle}
                onChange={(e) => setDesignStyle(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="premium_blue">Corporate Blue</option>
                <option value="studio_white">Minimalist White</option>
                <option value="cyberpunk">Dark High-Tech</option>
                <option value="luxury_gold">Luxury Gold</option>
                <option value="swiss_modern">Swiss Modern</option>
                <option value="organic">Organic</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderOutlineScreen = () => (
    <div className="flex-1 flex flex-col bg-[#fafafa] overflow-hidden">
      <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between shrink-0">
        <button
          onClick={handleReset}
          className="text-sm font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{outline.slides.length} slides</span>
          <button
            onClick={handleGenerateSlides}
            className="bg-neutral-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" /> Generate Deck
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Review Outline
            </h2>
            <p className="text-neutral-500">
              Edit the structure before we generate the visual slides.
            </p>
          </div>

          <div className="space-y-3">
            {outline.slides.map((slide, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400 transition-all"
              >
                <div className="text-neutral-400 font-mono text-sm pt-1">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <textarea
                  value={slide.visualPrompt}
                  onChange={(e) => {
                    const newSlides = [...outline.slides];
                    newSlides[idx].visualPrompt = e.target.value;
                    setOutline({ ...outline, slides: newSlides });
                  }}
                  className="flex-1 resize-none border-none outline-none min-h-[60px] text-neutral-800"
                />
                <button
                  onClick={() =>
                    setOutline((prev) => ({
                      ...prev,
                      slides: prev.slides.filter((_, i) => i !== idx),
                    }))
                  }
                  className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-red-600 transition-all rounded-md hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() =>
              setOutline((prev) => ({
                ...prev,
                slides: [...prev.slides, { title: 'New Slide', visualPrompt: '' }],
              }))
            }
            className="w-full py-4 mt-4 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <PlusCircle className="w-5 h-5" /> Add Slide
          </button>
        </div>
      </div>
    </div>
  );

  const renderLoadingScreen = (title, subtitle) => (
    <div className="flex-1 flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-6 border border-neutral-200">
        <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
      </div>
      <h3 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-500 text-sm max-w-sm text-center">{subtitle}</p>

      {status === 'generating' && slides && (
        <div className="w-64 bg-neutral-100 rounded-full h-1.5 mt-8 overflow-hidden">
          <div
            className="bg-neutral-900 h-full transition-all duration-500 ease-out"
            style={{
              width: `${(slides.filter((s) => s.status === 'complete').length / slides.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );

  // ─── Main Editor View (3-Pane Layout) ────────────────────────────────────
  const renderEditorScreen = () => {
    const activeSlide = slides[activeSlideIndex];

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* Editor Header */}
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="p-2 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-neutral-200" />
            <h1 className="text-sm font-semibold text-neutral-900 truncate max-w-[200px] md:max-w-md">
              {topic || 'Untitled Deck'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-2 text-neutral-500 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-neutral-200" />
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-4 py-1.5 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </button>
          </div>
        </header>

        {/* Editor Body: 3 Panes */}
        <div className="flex-1 flex min-h-0">
          {/* Pane 1: Left Sidebar (Thumbnails) */}
          <aside className="w-24 md:w-48 bg-neutral-50 border-r border-neutral-200 overflow-y-auto flex flex-col p-3 gap-3 shrink-0 custom-scrollbar">
            {slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveSlideIndex(idx);
                  setRightPanelTab('edit');
                }}
                className={`group relative flex flex-col gap-1.5 p-2 rounded-xl transition-all outline-none ${
                  idx === activeSlideIndex
                    ? 'bg-white shadow-sm ring-1 ring-neutral-300'
                    : 'hover:bg-neutral-100/80'
                }`}
              >
                <div
                  className={`w-full aspect-video rounded-lg overflow-hidden border ${idx === activeSlideIndex ? 'border-neutral-300' : 'border-neutral-200 opacity-80 group-hover:opacity-100'}`}
                >
                  {slide.imageUrl && slide.imageUrl !== 'error' ? (
                    <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : slide.status === 'failed' || slide.imageUrl === 'error' ? (
                    <div className="w-full h-full bg-red-50 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-400" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between w-full px-1">
                  <span
                    className={`text-[10px] font-semibold ${idx === activeSlideIndex ? 'text-neutral-900' : 'text-neutral-400'}`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {slides.length > 1 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEditorSlide(idx);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </button>
            ))}

            <button
              onClick={() => setRightPanelTab('add')}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-neutral-200 text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 hover:bg-neutral-100 transition-all flex flex-col items-center justify-center gap-1 mt-2"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="text-[10px] font-medium uppercase tracking-wider hidden md:block">
                Add Slide
              </span>
            </button>
          </aside>

          {/* Pane 2: Center Canvas */}
          <main className="flex-1 bg-[#f0f0f0] flex flex-col relative overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-8 lg:p-12 overflow-y-auto">
              <div className="w-full max-w-4xl aspect-video bg-white rounded-sm shadow-xl shadow-black/10 ring-1 ring-black/5 relative flex items-center justify-center overflow-hidden transition-all duration-300">
                {activeSlide?.imageUrl && activeSlide.imageUrl !== 'error' ? (
                  <img
                    src={activeSlide.imageUrl}
                    alt="Slide canvas"
                    className="w-full h-full object-cover"
                  />
                ) : activeSlide?.status === 'failed' || activeSlide?.imageUrl === 'error' ? (
                  <div className="text-center space-y-3">
                    <XCircle className="w-10 h-10 text-red-400 mx-auto" />
                    <p className="text-red-600 font-medium">Failed to generate</p>
                    <p className="text-xs text-red-400 max-w-[250px]">{activeSlide.error}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-neutral-400 font-medium">
                    <Loader2 className="w-5 h-5 animate-spin" /> Rendering Slide...
                  </div>
                )}
              </div>
            </div>
            {/* Center Canvas Footer Navigation */}
            <div className="h-12 bg-white/50 backdrop-blur border-t border-neutral-200/50 flex items-center justify-center gap-4 shrink-0">
              <button
                onClick={goPrev}
                disabled={activeSlideIndex === 0}
                className="p-1.5 hover:bg-white rounded text-neutral-500 disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-neutral-500 min-w-[3rem] text-center">
                {activeSlideIndex + 1} / {slides.length}
              </span>
              <button
                onClick={goNext}
                disabled={activeSlideIndex === slides.length - 1}
                className="p-1.5 hover:bg-white rounded text-neutral-500 disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </main>

          {/* Pane 3: Right Sidebar (Inspector/Tools) */}
          <aside className="w-80 bg-white border-l border-neutral-200 flex flex-col shrink-0 z-10">
            {/* Tabs */}
            <div className="flex border-b border-neutral-100 p-2 gap-1 bg-neutral-50 shrink-0">
              <button
                onClick={() => setRightPanelTab('edit')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${rightPanelTab === 'edit' ? 'bg-white shadow-sm text-neutral-900 border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Slide Editor
              </button>
              <button
                onClick={() => setRightPanelTab('add')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${rightPanelTab === 'add' ? 'bg-white shadow-sm text-neutral-900 border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Add Slide
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {rightPanelTab === 'edit' && activeSlide && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Tool 1: Regenerate */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                      <LayoutTemplate className="w-3.5 h-3.5" /> Content & Structure
                    </h3>
                    <textarea
                      value={activeSlide.visualPrompt}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        newSlides[activeSlideIndex].visualPrompt = e.target.value;
                        setSlides(newSlides);
                      }}
                      className="w-full h-28 bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-800 resize-none outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                      placeholder="Slide prompt..."
                    />
                    <button
                      onClick={() => handleRegenerateSlide(activeSlideIndex)}
                      disabled={activeSlide.status === 'generating'}
                      className="w-full py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {activeSlide.status === 'generating' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      Regenerate Slide
                    </button>
                  </div>

                  <hr className="border-neutral-100" />

                  {/* Tool 2: Magic Edit Visual */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                      <Wand2 className="w-3.5 h-3.5" /> Magic Edit Image
                    </h3>
                    <textarea
                      value={editImagePrompt}
                      onChange={(e) => setEditImagePrompt(e.target.value)}
                      placeholder="e.g. Change background to white, remove the graph..."
                      className="w-full h-24 bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-800 resize-none outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                      disabled={
                        isEditGenerating ||
                        !activeSlide.imageUrl ||
                        activeSlide.imageUrl === 'error'
                      }
                    />
                    <button
                      onClick={handleEditImageSubmit}
                      disabled={
                        !editImagePrompt.trim() || isEditGenerating || !activeSlide.imageUrl
                      }
                      className="w-full py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isEditGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                      Apply Magic Edit
                    </button>
                  </div>
                </div>
              )}

              {rightPanelTab === 'add' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-neutral-900">Insert new slide</h3>
                    <p className="text-xs text-neutral-500">
                      Describe the contents. It will be added after the currently selected slide.
                    </p>
                  </div>
                  <textarea
                    value={addSlideBrief}
                    onChange={(e) => setAddSlideBrief(e.target.value)}
                    placeholder="e.g. Include a slide highlighting the 4 key metrics..."
                    className="w-full h-40 bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-800 resize-none outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                    disabled={isAddSlideGenerating}
                  />
                  <button
                    onClick={handleAddEditorSlide}
                    disabled={!addSlideBrief.trim() || isAddSlideGenerating}
                    className="w-full py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isAddSlideGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )}
                    Generate New Slide
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-white font-sans text-neutral-900 overflow-hidden flex flex-col selection:bg-neutral-200">
      {errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-50 border border-red-200 rounded-lg shadow-lg flex items-center gap-3 text-sm text-red-700 animate-in slide-in-from-top-4">
          <XCircle className="w-4 h-4 shrink-0" /> {errorMsg}
          <button onClick={() => setErrorMsg('')}>
            <X className="w-4 h-4 opacity-50 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Main State Router */}
      {status === 'idle' && renderStartScreen()}
      {status === 'drafting' &&
        renderLoadingScreen('Synthesizing Outline', 'AI is structuring your narrative...')}
      {status === 'review' && outline && renderOutlineScreen()}
      {status === 'generating' &&
        renderLoadingScreen('Rendering Visuals', 'Applying design system to slides...')}
      {status === 'complete' && slides && renderEditorScreen()}

      {/* Fullscreen Mode (Overlays everything) */}
      {isFullscreen && slides && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-pointer"
          onClick={goNext}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            className="absolute top-6 right-6 z-50 text-white/50 hover:text-white p-2 rounded-full bg-white/10 backdrop-blur-md transition-all"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs font-mono">
            {activeSlideIndex + 1} / {slides.length}
          </div>
          {slides[activeSlideIndex]?.imageUrl && slides[activeSlideIndex].imageUrl !== 'error' ? (
            <img
              src={slides[activeSlideIndex].imageUrl}
              alt=""
              className="max-w-full max-h-full object-contain animate-in fade-in"
            />
          ) : (
            <div className="text-white/40">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Global minimal scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d4;
        }
      `}</style>
    </div>
  );
}
