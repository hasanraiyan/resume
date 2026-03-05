'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
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

  return {
    title: fallbackTitle,
    visualPrompt,
  };
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

function moveItem(items, index, direction) {
  const nextItems = [...items];

  if (direction === 'up' && index > 0) {
    [nextItems[index - 1], nextItems[index]] = [nextItems[index], nextItems[index - 1]];
  } else if (direction === 'down' && index < nextItems.length - 1) {
    [nextItems[index + 1], nextItems[index]] = [nextItems[index], nextItems[index + 1]];
  }

  return nextItems;
}

function getMovedActiveIndex(currentIndex, movedIndex, direction) {
  if (direction === 'up' && movedIndex > 0) {
    if (currentIndex === movedIndex) return movedIndex - 1;
    if (currentIndex === movedIndex - 1) return movedIndex;
  }

  if (direction === 'down') {
    if (currentIndex === movedIndex) return movedIndex + 1;
    if (currentIndex === movedIndex + 1) return movedIndex;
  }

  return currentIndex;
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

  if (!compactBrief) {
    return getDefaultSlideTitle(fallbackIndex);
  }

  const firstSentence = compactBrief.split(/[.!?]/)[0].trim();
  return (firstSentence || compactBrief).slice(0, 80);
}

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
        ) : slide.status === 'failed' || slide.imageUrl === 'error' ? (
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
function SlideGenerationPlaceholder({ label = 'Generating Slide...' }) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-neutral-50">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #fef0e7 0%, #fce4ec 25%, #f3e5f5 50%, #ede7f6 75%, #fef0e7 100%)',
          backgroundSize: '400% 400%',
          animation: 'presentationMeshGradient 6s ease infinite',
        }}
      />
      <div
        className="absolute w-[60%] h-[60%] rounded-full blur-[80px] opacity-60"
        style={{
          background: 'radial-gradient(circle, #f8bbd0 0%, transparent 70%)',
          animation: 'presentationOrbFloat1 8s ease-in-out infinite',
          top: '8%',
          left: '10%',
        }}
      />
      <div
        className="absolute w-[50%] h-[50%] rounded-full blur-[70px] opacity-50"
        style={{
          background: 'radial-gradient(circle, #e1bee7 0%, transparent 70%)',
          animation: 'presentationOrbFloat2 10s ease-in-out infinite',
          bottom: '10%',
          right: '6%',
        }}
      />
      <div
        className="absolute w-[38%] h-[38%] rounded-full blur-[60px] opacity-40"
        style={{
          background: 'radial-gradient(circle, #ffe0b2 0%, transparent 70%)',
          animation: 'presentationOrbFloat3 7s ease-in-out infinite',
          top: '42%',
          left: '48%',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="px-6 text-center space-y-4">
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.35em] text-neutral-600/80">
            {label}
          </p>
          <div className="flex justify-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-neutral-500/60"
              style={{ animation: 'presentationDotPulse 1.4s ease-in-out infinite' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-neutral-500/60"
              style={{ animation: 'presentationDotPulse 1.4s ease-in-out 0.2s infinite' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-neutral-500/60"
              style={{ animation: 'presentationDotPulse 1.4s ease-in-out 0.4s infinite' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PresentationGenerator() {
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [slideCount, setSlideCount] = useState(7);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [presentationId, setPresentationId] = useState(null);
  const [outline, setOutline] = useState(null);
  const [slides, setSlides] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [isAddSlideDialogOpen, setIsAddSlideDialogOpen] = useState(false);
  const [addSlideBrief, setAddSlideBrief] = useState('');
  const [isAddSlideGenerating, setIsAddSlideGenerating] = useState(false);

  // State for image editing modal
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editImagePrompt, setEditImagePrompt] = useState('');
  const [isEditGenerating, setIsEditGenerating] = useState(false);

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
        body: JSON.stringify({ topic: teaserTopic, instructions: '', slideCount }),
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
        body: JSON.stringify({ topic, instructions, slideCount }),
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

    // Initialize slides array with placeholders
    const initialSlides = normalizedOutline.slides.map((slide, index) =>
      normalizeRenderedSlide(
        {
          title: slide.title,
          fallbackText: slide.title,
          visualPrompt: slide.visualPrompt,
          prompt: slide.visualPrompt,
          status: 'pending',
        },
        index
      )
    );
    setSlides(initialSlides);
    setActiveSlideIndex(0);

    let completedCount = 0;

    // Generate slides in parallel (with slight stagger for UX)
    normalizedOutline.slides.forEach(async (slideData, idx) => {
      try {
        // Subtle delay for staggered start
        await new Promise((r) => setTimeout(r, idx * 300));

        const res = await fetch('/api/tools/presentation/generate-slide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slide: slideData,
            designSystem: normalizedOutline.designSystem,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to generate slide');

        setSlides((prev) => replaceItemAtIndex(prev, idx, normalizeRenderedSlide(data.slide, idx)));

        completedCount++;

        // As soon as the FIRST slide is ready, switch to editing mode to be responsive
        if (completedCount === 1) {
          setStatus('complete');
        }
      } catch (e) {
        console.error(`Slide ${idx} generation failed:`, e);
        setSlides((prev) =>
          replaceItemAtIndex(
            prev,
            idx,
            normalizeRenderedSlide(
              {
                status: 'failed',
                error: e.message,
                title: slideData.title,
                fallbackText: `Failed: ${slideData.title}`,
                visualPrompt: slideData.visualPrompt,
                prompt: slideData.visualPrompt,
              },
              idx
            )
          )
        );
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
    setShowModal(true);
    setIsAddSlideDialogOpen(false);
    setAddSlideBrief('');
    setIsAddSlideGenerating(false);
  };

  // ─── Outline Mutators ────────────────────────────────────────────────────
  const updateOutlinePrompt = (index, newPrompt) => {
    setOutline((prev) => {
      const newSlides = [...prev.slides];
      newSlides[index].visualPrompt = newPrompt;
      return { ...prev, slides: newSlides };
    });
  };

  const moveOutlineSlide = (index, direction) => {
    setOutline((prev) => {
      const newSlides = [...prev.slides];
      if (direction === 'up' && index > 0) {
        [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]];
      } else if (direction === 'down' && index < newSlides.length - 1) {
        [newSlides[index + 1], newSlides[index]] = [newSlides[index], newSlides[index + 1]];
      }
      return { ...prev, slides: newSlides };
    });
  };

  const deleteOutlineSlide = (index) => {
    setOutline((prev) => {
      const newSlides = [...prev.slides];
      if (newSlides.length <= 1) return prev; // Don't delete the last slide
      newSlides.splice(index, 1);
      return { ...prev, slides: newSlides };
    });
  };

  const addOutlineSlide = () => {
    setOutline((prev) => {
      const newSlides = [...prev.slides];
      newSlides.push({
        title: 'New Slide',
        visualPrompt: 'A sleek, modern corporate slide with a title and bullet points...',
      });
      return { ...prev, slides: newSlides };
    });
  };

  // ─── Editor Phase Mutators ───────────────────────────────────────────────
  const moveEditorSlide = (index, direction) => {
    setSlides((prev) => moveItem(prev, index, direction));
    setOutline((prev) =>
      prev
        ? {
            ...prev,
            slides: moveItem(prev.slides, index, direction),
          }
        : prev
    );
    setActiveSlideIndex((currentIndex) => getMovedActiveIndex(currentIndex, index, direction));
  };

  const deleteEditorSlide = (index) => {
    setSlides((prev) => {
      if (prev.length <= 1) return prev;
      return removeItemAtIndex(prev, index);
    });
    setOutline((prev) =>
      prev && prev.slides.length > 1
        ? {
            ...prev,
            slides: removeItemAtIndex(prev.slides, index),
          }
        : prev
    );
    setActiveSlideIndex((currentIndex) => {
      if (currentIndex >= index && currentIndex > 0) {
        return currentIndex - 1;
      }

      return currentIndex;
    });
  };

  const openAddSlideDialog = () => {
    setAddSlideBrief('');
    setIsAddSlideDialogOpen(true);
  };

  const handleGenerateSingleSlide = async (slideData, designSystem, idx) => {
    try {
      setSlides((prev) => {
        if (!prev[idx]) return prev;
        return replaceItemAtIndex(prev, idx, {
          ...prev[idx],
          title: slideData.title || prev[idx].title,
          fallbackText: slideData.title || prev[idx].fallbackText,
          visualPrompt: slideData.visualPrompt,
          prompt: slideData.visualPrompt,
          status: 'generating',
          error: undefined,
        });
      });

      const res = await fetch('/api/tools/presentation/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slide: slideData,
          designSystem,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate slide');

      setSlides((prev) => {
        if (!prev[idx]) return prev;
        return replaceItemAtIndex(prev, idx, normalizeRenderedSlide(data.slide, idx));
      });
      setOutline((prev) =>
        prev
          ? {
              ...prev,
              slides: replaceItemAtIndex(prev.slides, idx, normalizeOutlineSlide(data.slide, idx)),
            }
          : prev
      );
    } catch (e) {
      console.error(`Slide ${idx} generation failed:`, e);
      setSlides((prev) => {
        if (!prev[idx]) return prev;
        return replaceItemAtIndex(prev, idx, {
          ...prev[idx],
          status: 'failed',
          error: e.message,
        });
      });
    }
  };

  const handleAddEditorSlide = async () => {
    if (!addSlideBrief.trim() || !outline) return;

    const insertionIndex = activeSlideIndex + 1;
    const slideBrief = addSlideBrief.trim();
    const placeholderTitle = getDerivedSlideTitle(slideBrief, insertionIndex);
    const placeholderOutlineSlide = normalizeOutlineSlide(
      {
        title: placeholderTitle,
        visualPrompt: slideBrief,
      },
      insertionIndex
    );
    const placeholderRenderedSlide = normalizeRenderedSlide(
      {
        title: placeholderTitle,
        fallbackText: placeholderTitle,
        visualPrompt: slideBrief,
        prompt: slideBrief,
        status: 'generating',
      },
      insertionIndex
    );
    const existingSlides = buildDeckContextSlides(outline.slides, slides || []);

    setErrorMsg('');
    setIsAddSlideGenerating(true);
    setIsAddSlideDialogOpen(false);
    setAddSlideBrief('');
    setSlides((prev) => insertItemAtIndex(prev, insertionIndex, placeholderRenderedSlide));
    setOutline((prev) =>
      prev
        ? {
            ...prev,
            slides: insertItemAtIndex(prev.slides, insertionIndex, placeholderOutlineSlide),
          }
        : prev
    );
    setActiveSlideIndex(insertionIndex);

    try {
      const res = await fetch('/api/tools/presentation/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideBrief,
          topic: topic || 'Untitled Presentation',
          designSystem: outline.designSystem,
          existingSlides,
          insertionIndex,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate continuation slide');

      setSlides((prev) =>
        replaceItemAtIndex(prev, insertionIndex, normalizeRenderedSlide(data.slide, insertionIndex))
      );
      setOutline((prev) =>
        prev
          ? {
              ...prev,
              slides: replaceItemAtIndex(
                prev.slides,
                insertionIndex,
                normalizeOutlineSlide(data.slide, insertionIndex)
              ),
            }
          : prev
      );
    } catch (e) {
      console.error('Add slide generation failed:', e);
      setErrorMsg(e.message);
      setSlides((prev) =>
        replaceItemAtIndex(prev, insertionIndex, {
          ...placeholderRenderedSlide,
          status: 'failed',
          error: e.message,
        })
      );
    } finally {
      setIsAddSlideGenerating(false);
    }
  };

  const handleRegenerateSlide = (index) => {
    const slideToRegen = slides[index];
    if (!slideToRegen || !slideToRegen.visualPrompt) return;

    // Prompt the user for a new visual prompt or use the existing one
    const updatedPrompt = window.prompt(
      'Edit visual prompt before regenerating:',
      slideToRegen.visualPrompt
    );
    if (updatedPrompt === null) return; // User cancelled
    if (!updatedPrompt.trim()) return;

    const slideDataForApi = {
      title: slideToRegen.title || slideToRegen.fallbackText || 'Slide',
      visualPrompt: updatedPrompt.trim(),
    };

    setSlides((prev) =>
      replaceItemAtIndex(prev, index, {
        ...prev[index],
        title: slideDataForApi.title,
        fallbackText: slideDataForApi.title,
        visualPrompt: slideDataForApi.visualPrompt,
        prompt: slideDataForApi.visualPrompt,
      })
    );
    setOutline((prev) =>
      prev
        ? {
            ...prev,
            slides: replaceItemAtIndex(prev.slides, index, slideDataForApi),
          }
        : prev
    );

    handleGenerateSingleSlide(slideDataForApi, outline?.designSystem, index);
  };

  const handleEditImageSubmit = async () => {
    if (!editImagePrompt.trim() || !slides[activeSlideIndex] || !slides[activeSlideIndex].imageUrl)
      return;

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
      if (!res.ok) throw new Error(data.error || 'Failed to edit slide');

      setSlides((prev) => {
        const arr = [...prev];
        arr[targetIndex] = {
          ...arr[targetIndex],
          imageUrl: data.slide.imageUrl,
          prompt: `${arr[targetIndex].prompt}\n[Edited: ${data.slide.editPrompt}]`,
        };
        return arr;
      });
      setIsEditingImage(false);
      setEditImagePrompt('');
    } catch (e) {
      alert('Failed to edit image: ' + e.message);
    } finally {
      setIsEditGenerating(false);
    }
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

  const handleExportPDF = async () => {
    if (!slides || slides.length === 0) return;

    setIsExporting(true);
    try {
      const imageUrls = slides
        .filter((s) => s.imageUrl && s.imageUrl !== 'error')
        .map((s) => s.imageUrl);

      if (imageUrls.length === 0) {
        toast.error('No generated slides to export');
        setIsExporting(false);
        return;
      }

      const response = await fetch('https://pdfservice.pyqdeck.in/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageUrls,
          title: topic || 'Presentation',
        }),
      });

      if (!response.ok) {
        throw new Error('PDF service error');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(topic || 'presentation').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Presentation exported as PDF!');
    } catch (error) {
      console.error('Export Error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

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
        ) : activeSlide?.status === 'failed' || activeSlide?.imageUrl === 'error' ? (
          <div className="text-white/40 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4" />
            <p>Slide generation failed</p>
          </div>
        ) : (
          <div className="w-[90vw] max-w-6xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <SlideGenerationPlaceholder label="Generating Slide..." />
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
          <div>
            <label className="block text-xs font-bold text-black mb-3 uppercase tracking-widest">
              Slide Count
            </label>
            <select
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full bg-white border-2 border-neutral-200 focus:border-black focus:ring-0 rounded-xl px-5 py-4 text-base transition-all outline-none font-medium text-black shadow-sm"
            >
              {[5, 7, 10, 12].map((count) => (
                <option key={count} value={count}>
                  {count} slides
                </option>
              ))}
            </select>
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
    <div className="flex-1 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-4xl aspect-video mx-auto px-8 flex items-center justify-center">
        <div className="text-center space-y-8 p-12 mx-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-[3px] border-black/10 rounded-full" />
            <div className="absolute inset-0 border-[3px] border-black border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full m-1.5">
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
  );

  // ─── Outline Review (Redesigned) ─────────────────────────────────────────
  const renderOutlineReview = () => (
    <div className="flex-1 overflow-y-auto p-6 lg:p-12 bg-[#ebeff5]">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <h3 className="text-2xl font-semibold text-neutral-800 tracking-tight">Outline</h3>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 text-xs font-bold text-neutral-500 hover:text-black hover:bg-neutral-200 bg-white shadow-sm border border-neutral-200 rounded-lg uppercase tracking-widest transition-all"
            >
              Start Over
            </button>
            <button
              onClick={handleGenerateSlides}
              className="px-6 py-2.5 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 hover:shadow-md transition-all flex items-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Render
              Visuals
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 space-y-4">
          {outline.slides.map((slide, idx) => (
            <div
              key={idx}
              className="flex items-stretch bg-neutral-100/50 rounded-lg border border-neutral-200 focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-100 transition-all overflow-hidden group"
            >
              {/* Left indicator block */}
              <div className="w-14 shrink-0 bg-[#fdf5fa] flex items-center justify-center border-r border-neutral-200">
                <span className="text-[#6c5dd3] font-bold text-lg font-mono">{idx + 1}</span>
              </div>

              {/* Editable Content */}
              <div className="flex-1 min-w-0 p-3 relative">
                <textarea
                  value={slide.visualPrompt}
                  onChange={(e) => updateOutlinePrompt(idx, e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm text-neutral-700 resize-none min-h-[60px] p-0 outline-none leading-relaxed"
                  placeholder="Describe your slide visual here..."
                />

                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-md p-1 shadow-sm border border-neutral-200">
                  <button
                    onClick={() => moveOutlineSlide(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-neutral-400 hover:text-black disabled:opacity-30 rounded hover:bg-neutral-100"
                    title="Move Up"
                  >
                    <ChevronLeft className="w-4 h-4 rotate-90" />
                  </button>
                  <button
                    onClick={() => moveOutlineSlide(idx, 'down')}
                    disabled={idx === outline.slides.length - 1}
                    className="p-1 text-neutral-400 hover:text-black disabled:opacity-30 rounded hover:bg-neutral-100"
                    title="Move Down"
                  >
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </button>
                  <button
                    onClick={() => deleteOutlineSlide(idx)}
                    disabled={outline.slides.length <= 1}
                    className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 rounded hover:bg-red-50 ml-1"
                    title="Delete Slide"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addOutlineSlide}
            className="w-full py-4 rounded-lg border-2 border-dashed border-neutral-200 text-neutral-500 hover:text-black hover:border-black hover:bg-neutral-50 transition-all flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest mt-4"
          >
            <PlusCircle className="w-5 h-5" /> Add Slide
          </button>
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
                onClick={openAddSlideDialog}
                className="px-3 py-1.5 rounded-lg hover:bg-neutral-100 text-xs font-bold uppercase tracking-widest text-neutral-600 hover:text-black transition-all border border-neutral-200 hover:border-black flex items-center gap-1.5"
                title="Add Slide"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Slide
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-3 py-1.5 rounded-lg hover:bg-neutral-100 text-xs font-bold uppercase tracking-widest text-neutral-600 hover:text-black transition-all border border-neutral-200 hover:border-black flex items-center gap-1.5 disabled:opacity-50"
                title="Export as PDF"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
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
          <aside className="md:w-[160px] lg:w-[180px] bg-white md:border-r border-b md:border-b-0 border-neutral-200 overflow-x-auto md:overflow-y-auto p-3 md:p-4 flex md:flex-col gap-3 md:gap-4 flex-shrink-0 custom-chat-scrollbar">
            {slides.map((slide, idx) => (
              <div key={idx} className="w-[120px] md:w-full flex-shrink-0 relative group">
                <SlideThumbnail
                  slide={slide}
                  index={idx}
                  isActive={idx === activeSlideIndex}
                  onClick={() => setActiveSlideIndex(idx)}
                />

                {/* Editor Sidebar Hover Controls */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-sm border border-neutral-200 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveEditorSlide(idx, 'up');
                    }}
                    disabled={idx === 0}
                    className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-black disabled:opacity-30"
                    title="Move slide up"
                  >
                    <ChevronLeft className="w-3 h-3 rotate-90" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveEditorSlide(idx, 'down');
                    }}
                    disabled={idx === slides.length - 1}
                    className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-black disabled:opacity-30"
                    title="Move slide down"
                  >
                    <ChevronRight className="w-3 h-3 rotate-90" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEditorSlide(idx);
                    }}
                    disabled={slides.length <= 1}
                    className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 disabled:opacity-30 ml-auto"
                    title="Delete slide"
                  ></button>
                </div>
              </div>
            ))}
          </aside>
        )}

        {/* Main Canvas Area */}
        <main
          ref={canvasRef}
          className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#f5f5f5] overflow-y-auto md:overflow-hidden relative"
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

          {/* Complete: Slide Viewer */}
          {isEditorView && activeSlide && (
            <div className="flex-1 min-h-0 flex items-center justify-center p-6 lg:p-12 relative overflow-auto">
              <div className="w-full max-w-6xl aspect-video bg-white rounded-2xl shadow-2xl border-2 border-black overflow-hidden relative group shrink-0">
                {activeSlide.imageUrl && activeSlide.imageUrl !== 'error' ? (
                  <img
                    src={activeSlide.imageUrl}
                    alt={activeSlide.fallbackText}
                    className="w-full h-full object-contain bg-neutral-50"
                  />
                ) : activeSlide.status === 'failed' || activeSlide.imageUrl === 'error' ? (
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
                ) : (
                  <SlideGenerationPlaceholder label="Generating Slide..." />
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
                className="text-xs text-neutral-500 font-mono truncate max-w-xl"
                title={activeSlide.prompt || activeSlide.fallbackText}
              >
                {activeSlide.fallbackText || 'No description available'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingImage(!isEditingImage)}
                  disabled={!activeSlide.imageUrl || activeSlide.imageUrl === 'error'}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 text-black"
                  title="Visually edit this slide"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Edit Image
                </button>
                <button
                  onClick={() => handleRegenerateSlide(activeSlideIndex)}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 text-black border border-transparent hover:border-black"
                  title="Edit prompt and regenerate completely"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                </button>

                <div className="w-px h-6 bg-neutral-200 mx-1"></div>

                {activeSlide.imageUrl && activeSlide.imageUrl !== 'error' && (
                  <a
                    href={activeSlide.imageUrl}
                    download={`slide-${activeSlideIndex + 1}.png`}
                    className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                    title="Download Slide"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Editor Image Edit Modal Overaly */}
          {isEditorView && activeSlide && isEditingImage && (
            <div className="absolute bottom-20 right-6 w-80 bg-white rounded-xl shadow-2xl border border-neutral-200 p-4 z-50 animate-in slide-in-from-bottom-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold uppercase tracking-widest text-black">
                  Edit Visuals
                </h4>
                <button
                  onClick={() => setIsEditingImage(false)}
                  className="text-neutral-400 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
                Describe the visual change you want (e.g., "Make the background pure white", "Change
                accents to deep blue").
              </p>
              <textarea
                value={editImagePrompt}
                onChange={(e) => setEditImagePrompt(e.target.value)}
                placeholder="How should I modify this image?"
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-black rounded-lg p-3 text-sm focus:ring-0 resize-none outline-none transition-colors h-24 mb-3 text-black"
                disabled={isEditGenerating}
              />
              <button
                onClick={handleEditImageSubmit}
                disabled={!editImagePrompt.trim() || isEditGenerating}
                className="w-full py-2 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:hover:bg-black flex items-center justify-center gap-2"
              >
                {isEditGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Apply Edit
                  </>
                )}
              </button>
            </div>
          )}

          <Dialog open={isAddSlideDialogOpen} onOpenChange={setIsAddSlideDialogOpen}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-['Playfair_Display'] tracking-tight text-black">
                  Add a Related Slide
                </DialogTitle>
                <DialogDescription>
                  Describe what this slide should cover. It will be inserted after the current slide
                  and generated with the existing deck context and design system.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-600">
                  Slide Brief
                </label>
                <textarea
                  value={addSlideBrief}
                  onChange={(e) => setAddSlideBrief(e.target.value)}
                  placeholder="e.g. Add a market adoption slide that connects this section to enterprise demand."
                  className="w-full min-h-32 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-black outline-none transition-colors focus:border-black focus:bg-white resize-none"
                  disabled={isAddSlideGenerating}
                />
              </div>

              <DialogFooter className="gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSlideDialogOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-bold uppercase tracking-widest text-neutral-600 transition-colors hover:border-black hover:text-black"
                  disabled={isAddSlideGenerating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddEditorSlide}
                  className="px-4 py-2 rounded-lg bg-black text-white text-xs font-bold uppercase tracking-widest transition-colors hover:bg-neutral-800 disabled:opacity-50"
                  disabled={!addSlideBrief.trim() || isAddSlideGenerating}
                >
                  {isAddSlideGenerating ? 'Generating...' : 'Generate Slide'}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <style jsx>{`
            @keyframes presentationMeshGradient {
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

            @keyframes presentationOrbFloat1 {
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

            @keyframes presentationOrbFloat2 {
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

            @keyframes presentationOrbFloat3 {
              0%,
              100% {
                transform: translate(0, 0) scale(1);
              }
              50% {
                transform: translate(-30%, 20%) scale(1.15);
              }
            }

            @keyframes presentationDotPulse {
              0%,
              80%,
              100% {
                opacity: 0.3;
                transform: scale(0.8);
              }
              40% {
                opacity: 1;
                transform: scale(1.2);
              }
            }
          `}</style>
        </main>
      </div>
    </div>
  );
}
