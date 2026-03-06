import React from 'react';
import {
  LayoutTemplate,
  Loader2,
  RotateCcw,
  Wand2,
  Image as ImageIcon,
  PlusCircle,
} from 'lucide-react';

export default function InspectorPanel({
  rightPanelTab,
  setRightPanelTab,
  activeSlide,
  activeSlideIndex,
  slides,
  setSlides,
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
}) {
  return (
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
                value={activeSlide.visualPrompt || ''}
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
                  isEditGenerating || !activeSlide.imageUrl || activeSlide.imageUrl === 'error'
                }
              />
              <button
                onClick={handleEditImageSubmit}
                disabled={!editImagePrompt.trim() || isEditGenerating || !activeSlide.imageUrl}
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
  );
}
