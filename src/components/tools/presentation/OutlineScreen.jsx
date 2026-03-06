import React from 'react';
import { ArrowLeft, Wand2, Trash2, PlusCircle } from 'lucide-react';

export default function OutlineScreen({ outline, setOutline, handleReset, handleGenerateSlides }) {
  if (!outline?.slides) return null;

  return (
    <div className="flex-1 flex flex-col bg-neutral-50 overflow-hidden w-full">
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
                key={slide.id || idx}
                className="group flex items-start gap-4 bg-white p-5 rounded-2xl border-2 border-neutral-100 shadow-sm focus-within:border-black transition-all"
              >
                <div className="text-neutral-300 font-mono text-sm pt-1 w-6">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <textarea
                  value={slide.visualPrompt || ''}
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
                slides: [
                  ...prev.slides,
                  { id: crypto.randomUUID(), title: 'New Slide', visualPrompt: '' },
                ],
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
}
