'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

// ─── Utility Functions ───────────────────────────────────────────────────────
const getDefaultSlideTitle = (index) => `Slide ${index + 1}`;

function normalizeOutlineSlide(slide = {}, index = 0) {
  const fallbackTitle =
    slide.title?.trim() || slide.fallbackText?.trim() || getDefaultSlideTitle(index);
  const visualPrompt = slide.visualPrompt?.trim() || slide.prompt?.trim() || '';
  return { title: fallbackTitle, visualPrompt };
}

function normalizeRenderedSlide(slide = {}, index = 0) {
  const outlineSlide = normalizeOutlineSlide(slide, index);
  return {
    title: outlineSlide.title,
    fallbackText: slide.fallbackText?.trim() || outlineSlide.title,
    visualPrompt: outlineSlide.visualPrompt,
    prompt: slide.prompt?.trim() || outlineSlide.visualPrompt,
    imageUrl: slide.imageUrl || null,
    status: slide.status || (slide.imageUrl ? 'complete' : 'pending'),
    ...(slide.error ? { error: slide.error } : {}),
  };
}

function replaceItemAtIndex(items, index, item) {
  return items.map((c, i) => (i === index ? item : c));
}

// ─── Memoized Sub-Components (Solves React Re-render lags) ───────────────────

const SlideThumbnail = memo(({ slide, index, isActive, onClick, onDelete, totalSlides }) => (
  <button
    onClick={() => onClick(index)}
    className={`group relative flex flex-col gap-2 p-2 transition-all outline-none rounded-xl ${
      isActive ? 'bg-white shadow-sm ring-2 ring-black' : 'hover:bg-neutral-200/50'
    }`}
  >
    <div
      className={`w-full aspect-video rounded-lg overflow-hidden border relative ${isActive ? 'border-transparent' : 'border-neutral-200 opacity-80 group-hover:opacity-100'}`}
    >
      {slide.status === 'generating' && (
        <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center gap-1.5">
          <div className="flex gap-1">
            <span
              className="w-1 h-1 bg-black rounded-full"
              style={{ animation: 'dotPulse 1.4s ease-in-out infinite' }}
            />
            <span
              className="w-1 h-1 bg-black rounded-full"
              style={{ animation: 'dotPulse 1.4s ease-in-out 0.2s infinite' }}
            />
            <span
              className="w-1 h-1 bg-black rounded-full"
              style={{ animation: 'dotPulse 1.4s ease-in-out 0.4s infinite' }}
            />
          </div>
        </div>
      )}
      {slide.imageUrl && slide.imageUrl !== 'error' ? (
        <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
      ) : slide.status === 'failed' || slide.imageUrl === 'error' ? (
        <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
          <XCircle className="w-4 h-4 text-neutral-400" />
        </div>
      ) : (
        slide.status !== 'generating' && (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
          </div>
        )
      )}
    </div>
    <div className="flex items-center justify-between w-full px-1">
      <span
        className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-black' : 'text-neutral-400'}`}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      {totalSlides > 1 && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onDelete(index);
          }}
          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-black transition-opacity"
        >
          <X className="w-3 h-3" />
        </span>
      )}
    </div>
  </button>
));
SlideThumbnail.displayName = 'SlideThumbnail';

const SlideCanvas = memo(({ slide }) => {
  if (!slide) return null;
  return (
    <div className="w-full max-w-4xl aspect-video bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-neutral-200 relative flex items-center justify-center overflow-hidden transition-all duration-300 z-10">
      {slide.status === 'generating' && (
        <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 text-black animate-spin stroke-[1.5]" />
          <div className="mt-6 flex flex-col items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-black">
              Rendering Slide
            </span>
            <div className="flex gap-1.5">
              <span
                className="w-1 h-1 bg-black rounded-full"
                style={{ animation: 'dotPulse 1.4s ease-in-out infinite' }}
              />
              <span
                className="w-1 h-1 bg-black rounded-full"
                style={{ animation: 'dotPulse 1.4s ease-in-out 0.2s infinite' }}
              />
              <span
                className="w-1 h-1 bg-black rounded-full"
                style={{ animation: 'dotPulse 1.4s ease-in-out 0.4s infinite' }}
              />
            </div>
          </div>
        </div>
      )}

      {slide.imageUrl && slide.imageUrl !== 'error' ? (
        <img src={slide.imageUrl} alt="Slide canvas" className="w-full h-full object-cover" />
      ) : slide.status === 'failed' || slide.imageUrl === 'error' ? (
        <div className="text-center space-y-3">
          <XCircle className="w-8 h-8 text-neutral-400 mx-auto" />
          <p className="text-black font-semibold uppercase tracking-widest text-xs">
            Failed to render
          </p>
          <p className="text-[10px] text-neutral-500 max-w-[250px] uppercase">{slide.error}</p>
        </div>
      ) : (
        slide.status !== 'generating' && (
          <div className="flex flex-col items-center gap-4 text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin text-black" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black">
              Initializing
            </span>
          </div>
        )
      )}
    </div>
  );
});
SlideCanvas.displayName = 'SlideCanvas';

// ─── Main Application Component ──────────────────────────────────────────────
export default function PresentationGenerator() {
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [slideCount, setSlideCount] = useState(7);
  const [designStyle, setDesignStyle] = useState('studio_white');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [presentationId, setPresentationId] = useState(null);
  const [outline, setOutline] = useState(null);
  const [slides, setSlides] = useState(null);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [rightPanelTab, setRightPanelTab] = useState('edit');
  const [editImagePrompt, setEditImagePrompt] = useState('');
  const [isEditGenerating, setIsEditGenerating] = useState(false);
  const [addSlideBrief, setAddSlideBrief] = useState('');
  const [isAddSlideGenerating, setIsAddSlideGenerating] = useState(false);

  const searchParams = useSearchParams();
  const autoStartRef = useRef(false);

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
  }, [searchParams, designStyle]);

  // ─── API Methods ───────────────────────────────────────────────────────────
  const fetchWithJSONCheck = async (url, options) => {
    const res = await fetch(url, options);
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Invalid response from server.');
    }
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data;
  };

  const handleDraftOutlineFromTeaser = async (teaserTopic, teaserStyle) =>
    executeDraftOutline(teaserTopic, '', slideCount, teaserStyle);
  const handleDraftOutline = async () =>
    executeDraftOutline(topic, instructions, slideCount, designStyle);

  const executeDraftOutline = async (t, inst, count, style) => {
    if (!t.trim()) return;
    setStatus('drafting');
    setErrorMsg('');
    try {
      const data = await fetchWithJSONCheck('/api/tools/presentation/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: t,
          instructions: inst,
          slideCount: count,
          designStyle: style,
        }),
      });
      setPresentationId(data.presentationId);
      setOutline({ ...data.outline, designSystem: style });
      setStatus('review');
    } catch (e) {
      setErrorMsg(e.message);
      setStatus('error');
    }
  };

  const handleGenerateSlides = async () => {
    if (!outline || !outline.slides) return;
    setErrorMsg('');

    const initialSlides = outline.slides.map((slide, index) =>
      normalizeRenderedSlide({ ...slide, status: 'generating' }, index)
    );
    setSlides(initialSlides);
    setActiveSlideIndex(0);
    setStatus('complete');

    await Promise.allSettled(
      outline.slides.map(async (slideData, idx) => {
        await new Promise((r) => setTimeout(r, idx * 300));
        try {
          const data = await fetchWithJSONCheck('/api/tools/presentation/generate-slide', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slide: slideData, designSystem: outline.designSystem }),
          });
          setSlides((prev) =>
            replaceItemAtIndex(prev, idx, normalizeRenderedSlide(data.slide, idx))
          );
        } catch (e) {
          setSlides((prev) =>
            replaceItemAtIndex(
              prev,
              idx,
              normalizeRenderedSlide({ status: 'failed', error: e.message, ...slideData }, idx)
            )
          );
        }
      })
    );
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

  // ─── Editor Actions ────────────────────────────────────────────────────────
  const deleteEditorSlide = useCallback(
    (index) => {
      setSlides((prev) => prev.filter((_, i) => i !== index));
      setOutline((prev) =>
        prev ? { ...prev, slides: prev.slides.filter((_, i) => i !== index) } : prev
      );
      setActiveSlideIndex((curr) => Math.max(0, Math.min(curr, slides.length - 2)));
    },
    [slides]
  );

  const handleAddEditorSlide = async () => {
    if (!addSlideBrief.trim() || !outline) return;
    const insertionIndex = activeSlideIndex + 1;
    const slideBrief = addSlideBrief.trim();
    const placeholderRendered = normalizeRenderedSlide(
      { title: 'New Slide', visualPrompt: slideBrief, status: 'generating' },
      insertionIndex
    );

    setIsAddSlideGenerating(true);
    setSlides((prev) => [
      ...prev.slice(0, insertionIndex),
      placeholderRendered,
      ...prev.slice(insertionIndex),
    ]);
    setOutline((prev) =>
      prev
        ? {
            ...prev,
            slides: [
              ...prev.slides.slice(0, insertionIndex),
              { title: 'New Slide', visualPrompt: slideBrief },
              ...prev.slides.slice(insertionIndex),
            ],
          }
        : prev
    );
    setActiveSlideIndex(insertionIndex);
    setRightPanelTab('edit');

    try {
      const data = await fetchWithJSONCheck('/api/tools/presentation/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideBrief,
          topic: topic || 'Presentation',
          designSystem: outline.designSystem,
          insertionIndex,
        }),
      });
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
      const data = await fetchWithJSONCheck('/api/tools/presentation/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide: slideToRegen, designSystem: outline?.designSystem }),
      });
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
    setSlides((prev) =>
      replaceItemAtIndex(prev, targetIndex, { ...prev[targetIndex], status: 'generating' })
    );

    try {
      const data = await fetchWithJSONCheck('/api/tools/presentation/edit-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideImageBase64: slides[targetIndex].imageUrl,
          editPrompt: editImagePrompt,
        }),
      });
      setSlides((prev) =>
        replaceItemAtIndex(prev, targetIndex, {
          ...prev[targetIndex],
          imageUrl: data.slide.imageUrl,
          status: 'complete',
        })
      );
      setEditImagePrompt('');
    } catch (e) {
      setSlides((prev) =>
        replaceItemAtIndex(prev, targetIndex, { ...prev[targetIndex], status: 'complete' })
      );
      alert('Failed to edit image: ' + e.message);
    } finally {
      setIsEditGenerating(false);
    }
  };

  // ─── NEW CLIENT-SIDE PDF EXPORT METHOD ─────────────────────────────────────
  const handleExportPDF = async () => {
    if (!slides || slides.length === 0) return;
    setIsExporting(true);

    try {
      const completedSlides = slides.filter((s) => s.imageUrl && s.imageUrl !== 'error');
      if (completedSlides.length === 0) throw new Error('No completed slides to export');

      // Dynamically import jsPDF so it doesn't break Next.js server-side rendering
      const { jsPDF } = await import('jspdf');

      // Create a Landscape PDF using standard 16:9 1080p pixels (1920x1080)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080],
      });

      for (let i = 0; i < completedSlides.length; i++) {
        const slide = completedSlides[i];
        let base64Img = slide.imageUrl;

        // If the URL is external and not a base64 string, fetch it to base64
        if (!base64Img.startsWith('data:image')) {
          const res = await fetch(slide.imageUrl);
          if (!res.ok) throw new Error(`Failed to fetch image for slide ${i + 1}`);
          const blob = await res.blob();
          base64Img = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }

        // Add a new page for every slide after the first one
        if (i > 0) pdf.addPage();

        // Extract format (JPEG, PNG, WEBP)
        const mimeTypeMatch = base64Img.match(/data:(.*?);/);
        let imgFormat = 'JPEG'; // Default
        if (mimeTypeMatch && mimeTypeMatch[1]) {
          if (mimeTypeMatch[1] === 'image/png') imgFormat = 'PNG';
          else if (mimeTypeMatch[1] === 'image/webp') imgFormat = 'WEBP';
        }

        // Add to PDF canvas starting from top-left (0, 0) matching 1920x1080 dimensions
        pdf.addImage(base64Img, imgFormat, 0, 0, 1920, 1080);
      }

      // Automatically download
      const fileName = `${(topic || 'presentation').trim().replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert(error.message || 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

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

  // ─── Sub-Renderers ─────────────────────────────────────────────────────────

  const renderStartScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white overflow-y-auto">
      <div className="max-w-2xl w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 text-black text-[10px] font-black uppercase tracking-[0.2em] border border-neutral-200 shadow-sm">
            <Sparkles className="w-3 h-3" /> AI Deck Studio
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-black leading-[1.05]">
            Generate <span className="text-neutral-400 italic">Narratives</span>
          </h1>
          <p className="text-neutral-500 text-lg leading-relaxed max-w-md">
            From simple text to a structured visual presentation. Use the AI engine to build your
            deck in seconds.
          </p>
        </div>
        <div className="space-y-6">
          <div className="bg-white border-2 border-neutral-200 rounded-[2rem] p-3 shadow-sm focus-within:border-black focus-within:ring-4 focus-within:ring-neutral-100 transition-all duration-300">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. A pitch deck for a new sustainable coffee brand aiming for seed funding..."
              className="w-full bg-transparent border-none focus:ring-0 outline-none px-6 pt-6 pb-2 text-black placeholder-neutral-400 min-h-[140px] resize-none text-xl leading-relaxed"
              autoFocus
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black flex items-center gap-2 transition-colors px-4 py-2"
              >
                <Settings2 className="w-4 h-4" /> Options
              </button>
              <button
                onClick={handleDraftOutline}
                disabled={!topic.trim()}
                className="px-8 py-3 bg-black text-white rounded-full text-sm font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all disabled:opacity-30 flex items-center gap-2 shadow-lg"
              >
                <Brain className="w-4 h-4" /> Outline
              </button>
            </div>
          </div>
          {showAdvanced && (
            <div className="grid grid-cols-2 gap-6 p-6 bg-neutral-50 rounded-2xl border border-neutral-200 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Length
                </label>
                <select
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  {[5, 7, 10, 15].map((n) => (
                    <option key={n} value={n}>
                      {n} Slides
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Visual Theme
                </label>
                <select
                  value={designStyle}
                  onChange={(e) => setDesignStyle(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="studio_white">Minimalist White</option>
                  <option value="luxury_gold">Obsidian Dark</option>
                  <option value="swiss_modern">Swiss Typography</option>
                  <option value="premium_blue">Corporate Monotone</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                  <option value="organic">Organic Nature</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOutlineScreen = () => (
    <div className="flex-1 flex flex-col bg-neutral-50 overflow-hidden">
      <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between shrink-0">
        <button
          onClick={handleReset}
          className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            {outline.slides.length} slides
          </span>
          <button
            onClick={handleGenerateSlides}
            className="bg-black text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" /> Generate Deck
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="mb-10 border-b border-neutral-200 pb-6">
            <h2 className="text-3xl font-semibold tracking-tighter text-black mb-2">
              Review Structure
            </h2>
            <p className="text-neutral-500 text-sm">
              Refine the narrative outline before the AI renders the visuals.
            </p>
          </div>
          <div className="space-y-4">
            {outline.slides.map((slide, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-4 bg-white p-5 rounded-2xl border-2 border-neutral-100 shadow-sm focus-within:border-black transition-all"
              >
                <div className="text-neutral-300 font-mono text-sm pt-1 w-6">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <textarea
                  value={slide.visualPrompt}
                  onChange={(e) =>
                    setOutline((prev) => ({
                      ...prev,
                      slides: prev.slides.map((s, i) =>
                        i === idx ? { ...s, visualPrompt: e.target.value } : s
                      ),
                    }))
                  }
                  className="flex-1 resize-none border-none outline-none min-h-[60px] text-neutral-900 font-medium leading-relaxed"
                />
                <button
                  onClick={() =>
                    setOutline((prev) => ({
                      ...prev,
                      slides: prev.slides.filter((_, i) => i !== idx),
                    }))
                  }
                  className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-black transition-all rounded-md"
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
            className="w-full py-5 mt-6 border-2 border-dashed border-neutral-300 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black hover:border-black hover:bg-neutral-100/50 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Add Slide
          </button>
        </div>
      </div>
    </div>
  );

  const renderLoadingScreen = (title, subtitle) => (
    <div className="flex-1 flex flex-col items-center justify-center relative bg-neutral-50 overflow-hidden">
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-gradient-to-b from-transparent via-black to-transparent w-full h-[20%] animate-scanline" />
      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-white border-2 border-black rounded-2xl flex items-center justify-center mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <Loader2 className="w-6 h-6 text-black animate-spin" />
        </div>
        <h3 className="text-2xl font-semibold tracking-tighter text-black mb-2 uppercase">
          {title}
        </h3>
        <p className="text-neutral-500 text-sm max-w-sm tracking-wide">{subtitle}</p>
      </div>
    </div>
  );

  const renderEditorScreen = () => {
    const activeSlide = slides[activeSlideIndex];

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="p-2 text-neutral-400 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-neutral-200" />
            <h1 className="text-xs font-black uppercase tracking-widest text-black truncate max-w-[200px] md:max-w-md">
              {topic || 'Untitled'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFullscreen(true)}
              className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors flex items-center gap-2"
            >
              <Play className="w-3 h-3" /> Present
            </button>
            <div className="w-px h-4 bg-neutral-200" />
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-4 py-1.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}{' '}
              Export
            </button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          <aside className="w-28 md:w-56 bg-neutral-50 border-r border-neutral-200 overflow-y-auto flex flex-col p-4 gap-4 shrink-0 custom-scrollbar">
            {slides.map((slide, idx) => (
              <SlideThumbnail
                key={idx}
                slide={slide}
                index={idx}
                isActive={idx === activeSlideIndex}
                onClick={(i) => {
                  setActiveSlideIndex(i);
                  if (rightPanelTab === 'settings') setRightPanelTab('edit');
                }}
                onDelete={deleteEditorSlide}
                totalSlides={slides.length}
              />
            ))}
            <button
              onClick={() => setRightPanelTab('add')}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-neutral-300 text-neutral-400 hover:text-black hover:border-black hover:bg-neutral-100 transition-all flex flex-col items-center justify-center gap-2 mt-4"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </aside>

          <main className="flex-1 bg-neutral-100 flex flex-col relative overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-8 lg:p-12 overflow-y-auto relative">
              <div
                className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <SlideCanvas slide={activeSlide} />
            </div>
            <div className="h-12 bg-white border-t border-neutral-200 flex items-center justify-center gap-6 shrink-0">
              <button
                onClick={goPrev}
                disabled={activeSlideIndex === 0}
                className="p-1.5 text-neutral-400 hover:text-black disabled:opacity-30 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-black min-w-[3rem] text-center">
                {String(activeSlideIndex + 1).padStart(2, '0')} /{' '}
                {String(slides.length).padStart(2, '0')}
              </span>
              <button
                onClick={goNext}
                disabled={activeSlideIndex === slides.length - 1}
                className="p-1.5 text-neutral-400 hover:text-black disabled:opacity-30 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </main>

          <aside className="w-80 bg-white border-l border-neutral-200 flex flex-col shrink-0 z-10">
            <div className="flex border-b border-neutral-200 shrink-0">
              <button
                onClick={() => setRightPanelTab('edit')}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${rightPanelTab === 'edit' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}
              >
                Inspector
              </button>
              <button
                onClick={() => setRightPanelTab('add')}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${rightPanelTab === 'add' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}
              >
                Insert
              </button>
              <button
                onClick={() => setRightPanelTab('settings')}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${rightPanelTab === 'settings' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}
              >
                Settings
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {rightPanelTab === 'edit' && activeSlide && (
                <div className="space-y-10 animate-in fade-in duration-300">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                      <LayoutTemplate className="w-3.5 h-3.5" /> Content
                    </h3>
                    <textarea
                      value={activeSlide.visualPrompt}
                      onChange={(e) =>
                        setSlides((prev) =>
                          prev.map((s, i) =>
                            i === activeSlideIndex ? { ...s, visualPrompt: e.target.value } : s
                          )
                        )
                      }
                      className="w-full h-32 bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm text-black resize-none outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                      placeholder="Slide prompt..."
                    />
                    <button
                      onClick={() => handleRegenerateSlide(activeSlideIndex)}
                      disabled={activeSlide.status === 'generating'}
                      className="w-full py-3 bg-white border-2 border-neutral-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-black hover:border-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {activeSlide.status === 'generating' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3 h-3" />
                      )}{' '}
                      Regenerate
                    </button>
                  </div>
                  <hr className="border-neutral-200" />
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                      <Wand2 className="w-3.5 h-3.5" /> Transform
                    </h3>
                    <textarea
                      value={editImagePrompt}
                      onChange={(e) => setEditImagePrompt(e.target.value)}
                      placeholder="Describe edits (e.g., 'Change background to dark mode')"
                      className="w-full h-24 bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm text-black resize-none outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
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
                      className="w-full py-3 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isEditGenerating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ImageIcon className="w-3 h-3" />
                      )}{' '}
                      Apply Magic Edit
                    </button>
                  </div>
                </div>
              )}

              {rightPanelTab === 'add' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-black">
                      New Slide Brief
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Insert text here. Added after active slide.
                    </p>
                  </div>
                  <textarea
                    value={addSlideBrief}
                    onChange={(e) => setAddSlideBrief(e.target.value)}
                    placeholder="Describe new slide..."
                    className="w-full h-40 bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm text-black resize-none outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    disabled={isAddSlideGenerating}
                  />
                  <button
                    onClick={handleAddEditorSlide}
                    disabled={!addSlideBrief.trim() || isAddSlideGenerating}
                    className="w-full py-3 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAddSlideGenerating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <PlusCircle className="w-3 h-3" />
                    )}{' '}
                    Insert Slide
                  </button>
                </div>
              )}

              {rightPanelTab === 'settings' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-black">
                      Deck Settings
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Update global deck theme. Existing slides must be regenerated to see changes.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      Active Theme
                    </label>
                    <select
                      value={outline?.designSystem || designStyle}
                      onChange={(e) => {
                        const newStyle = e.target.value;
                        setDesignStyle(newStyle);
                        if (outline) setOutline({ ...outline, designSystem: newStyle });
                      }}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="studio_white">Minimalist White</option>
                      <option value="luxury_gold">Obsidian Dark</option>
                      <option value="swiss_modern">Swiss Typography</option>
                      <option value="premium_blue">Corporate Monotone</option>
                      <option value="cyberpunk">Cyberpunk Neon</option>
                      <option value="organic">Organic Nature</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setSlides(slides.map((s) => ({ ...s, status: 'generating' })));
                      handleGenerateSlides();
                    }}
                    className="w-full py-3 bg-white border-2 border-neutral-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-black hover:border-black transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3 h-3" /> Regenerate All
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
    <div className="h-screen w-screen bg-white font-sans text-black overflow-hidden flex flex-col selection:bg-black selection:text-white">
      {errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-black text-white border border-neutral-800 rounded-full shadow-2xl flex items-center gap-3 text-xs font-medium uppercase tracking-widest animate-in slide-in-from-top-4">
          <XCircle className="w-4 h-4 shrink-0 text-red-500" /> {errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-2">
            <X className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )}

      {status === 'idle' && renderStartScreen()}
      {status === 'drafting' && renderLoadingScreen('Synthesizing', 'Structuring narrative blocks')}
      {status === 'review' && outline && renderOutlineScreen()}
      {status === 'generating' && renderLoadingScreen('Rendering', 'Applying design system')}
      {status === 'complete' && slides && renderEditorScreen()}

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
            className="absolute top-6 right-6 z-50 text-white/50 hover:text-white p-3 rounded-full bg-white/10 backdrop-blur-md transition-all"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-black uppercase tracking-widest">
            {String(activeSlideIndex + 1).padStart(2, '0')} /{' '}
            {String(slides.length).padStart(2, '0')}
          </div>
          {slides[activeSlideIndex]?.imageUrl && slides[activeSlideIndex].imageUrl !== 'error' ? (
            <img
              src={slides[activeSlideIndex].imageUrl}
              alt=""
              className="max-w-full max-h-full object-contain animate-in fade-in"
            />
          ) : (
            <div className="text-white/40">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(500%);
          }
        }
        .animate-scanline {
          animation: scanline 4s linear infinite;
        }

        /* Pulse Dots Animation */
        @keyframes dotPulse {
          0%,
          80%,
          100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #000;
        }
      `}</style>
    </div>
  );
}
