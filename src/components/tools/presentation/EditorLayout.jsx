import React from 'react';
import { ArrowLeft, Play, Download, Loader2, PlusCircle } from 'lucide-react';
import { SlideThumbnail } from './SlideThumbnail';
import { SlideCanvas } from './SlideCanvas';
import InspectorPanel from './InspectorPanel';

export default function EditorLayout({
  topic,
  slides,
  activeSlideIndex,
  setActiveSlideIndex,
  handleReset,
  setIsFullscreen,
  handleExportPDF,
  isExporting,
  deleteEditorSlide,
  rightPanelTab,
  setRightPanelTab,
  goPrev,
  goNext,
  handleRegenerateSlide,
  editImagePrompt,
  setEditImagePrompt,
  isEditGenerating,
  handleEditImageSubmit,
  addSlideBrief,
  setAddSlideBrief,
  isAddSlideGenerating,
  handleAddEditorSlide,
  outline,
  setOutline,
  designStyle,
  setDesignStyle,
  handleGenerateSlides,
  setSlides,
}) {
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
              key={slide.id || idx}
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
              disabled={activeSlideIndex === (slides?.length || 1) - 1}
              className="p-1.5 text-neutral-400 hover:text-black disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </main>

        <InspectorPanel
          rightPanelTab={rightPanelTab}
          setRightPanelTab={setRightPanelTab}
          activeSlide={activeSlide}
          activeSlideIndex={activeSlideIndex}
          slides={slides}
          setSlides={setSlides}
          handleRegenerateSlide={handleRegenerateSlide}
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
      </div>
    </div>
  );
}
