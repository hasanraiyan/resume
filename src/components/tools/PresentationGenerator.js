'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, X, Minimize2, Loader2 } from 'lucide-react';

import StartScreen from './presentation/StartScreen';
import OutlineScreen from './presentation/OutlineScreen';
import EditorLayout from './presentation/EditorLayout';
import LoadingScreen from './presentation/LoadingScreen';

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
    id: slide.id || crypto.randomUUID(), // NEW: generate ID here if missing
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

  // Keyboard navigation for fullscreen and general prev/next
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

  useEffect(() => {
    if (autoStartRef.current) return;
    const urlTopic = searchParams.get('topic');
    const urlStyle = searchParams.get('style');
    if (urlTopic) {
      autoStartRef.current = true;
      setTopic(urlTopic);
      if (urlStyle) setDesignStyle(urlStyle);
      executeDraftOutline(urlTopic, '', slideCount, urlStyle || designStyle);
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
      // Ensure all outline slides have a unique ID
      const slidesWithIds = data.outline.slides.map((s) => ({
        ...s,
        id: s.id || crypto.randomUUID(),
      }));
      setPresentationId(data.presentationId);
      setOutline({ ...data.outline, slides: slidesWithIds, designSystem: style });
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
            replaceItemAtIndex(
              prev,
              idx,
              normalizeRenderedSlide({ ...data.slide, id: prev[idx].id }, idx)
            )
          );
        } catch (e) {
          setSlides((prev) =>
            replaceItemAtIndex(
              prev,
              idx,
              normalizeRenderedSlide(
                { status: 'failed', error: e.message, ...slideData, id: prev[idx].id },
                idx
              )
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
  const deleteEditorSlide = useCallback((index) => {
    setSlides((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setActiveSlideIndex((curr) => Math.max(0, Math.min(curr, updated.length - 1)));
      return updated;
    });
    setOutline((prev) =>
      prev ? { ...prev, slides: prev.slides.filter((_, i) => i !== index) } : prev
    );
  }, []);

  const handleAddEditorSlide = async () => {
    if (!addSlideBrief.trim() || !outline) return;
    const insertionIndex = activeSlideIndex + 1;
    const slideBrief = addSlideBrief.trim();
    const newId = crypto.randomUUID();
    const placeholderRendered = normalizeRenderedSlide(
      { id: newId, title: 'New Slide', visualPrompt: slideBrief, status: 'generating' },
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
              { id: newId, title: 'New Slide', visualPrompt: slideBrief },
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
        replaceItemAtIndex(
          prev,
          insertionIndex,
          normalizeRenderedSlide({ ...data.slide, id: newId }, insertionIndex)
        )
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

    setSlides((prev) =>
      replaceItemAtIndex(prev, index, { ...prev[index], status: 'generating', imageUrl: null })
    );

    try {
      const data = await fetchWithJSONCheck('/api/tools/presentation/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide: slideToRegen, designSystem: outline?.designSystem }),
      });
      setSlides((prev) =>
        replaceItemAtIndex(
          prev,
          index,
          normalizeRenderedSlide({ ...data.slide, id: prev[index].id }, index)
        )
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
    const oldImageUrl = slides[targetIndex].imageUrl;

    setSlides((prev) =>
      replaceItemAtIndex(prev, targetIndex, {
        ...prev[targetIndex],
        status: 'generating',
        imageUrl: null,
      })
    );

    try {
      const data = await fetchWithJSONCheck('/api/tools/presentation/edit-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideImageBase64: oldImageUrl,
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
        // Revert to old image URL on failure
        replaceItemAtIndex(prev, targetIndex, {
          ...prev[targetIndex],
          status: 'complete',
          imageUrl: oldImageUrl,
        })
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

      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080],
      });

      for (let i = 0; i < completedSlides.length; i++) {
        const slide = completedSlides[i];
        let base64Img = slide.imageUrl;

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

        if (i > 0) pdf.addPage();

        const mimeTypeMatch = base64Img.match(/data:(.*?);/);
        let imgFormat = 'JPEG';
        if (mimeTypeMatch && mimeTypeMatch[1]) {
          if (mimeTypeMatch[1] === 'image/png') imgFormat = 'PNG';
          else if (mimeTypeMatch[1] === 'image/webp') imgFormat = 'WEBP';
        }

        pdf.addImage(base64Img, imgFormat, 0, 0, 1920, 1080);
      }

      const fileName = `${(topic || 'presentation').trim().replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert(error.message || 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
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

      {status === 'idle' && (
        <StartScreen
          topic={topic}
          setTopic={setTopic}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          slideCount={slideCount}
          setSlideCount={setSlideCount}
          designStyle={designStyle}
          setDesignStyle={setDesignStyle}
          handleDraftOutline={handleDraftOutline}
        />
      )}

      {status === 'drafting' && (
        <LoadingScreen title="Synthesizing" subtitle="Structuring narrative blocks" />
      )}

      {status === 'review' && outline && (
        <OutlineScreen
          outline={outline}
          setOutline={setOutline}
          handleReset={handleReset}
          handleGenerateSlides={handleGenerateSlides}
        />
      )}

      {status === 'generating' && (
        <LoadingScreen title="Rendering" subtitle="Applying design system" />
      )}

      {status === 'complete' && slides && (
        <EditorLayout
          topic={topic}
          slides={slides}
          activeSlideIndex={activeSlideIndex}
          setActiveSlideIndex={setActiveSlideIndex}
          handleReset={handleReset}
          setIsFullscreen={setIsFullscreen}
          handleExportPDF={handleExportPDF}
          isExporting={isExporting}
          deleteEditorSlide={deleteEditorSlide}
          rightPanelTab={rightPanelTab}
          setRightPanelTab={setRightPanelTab}
          goPrev={goPrev}
          goNext={goNext}
          handleRegenerateSlide={handleRegenerateSlide}
          setSlides={setSlides}
          editImagePrompt={editImagePrompt}
          setEditImagePrompt={setEditImagePrompt}
          isEditGenerating={isEditGenerating}
          handleEditImageSubmit={handleEditImageSubmit}
          addSlideBrief={addSlideBrief}
          setAddSlideBrief={setAddSlideBrief}
          isAddSlideGenerating={isAddSlideGenerating}
          handleAddEditorSlide={handleAddEditorSlide}
          outline={outline}
          setOutline={setOutline}
          designStyle={designStyle}
          setDesignStyle={setDesignStyle}
          handleGenerateSlides={handleGenerateSlides}
        />
      )}

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
