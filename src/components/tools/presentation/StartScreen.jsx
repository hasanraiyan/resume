import React from 'react';
import { Sparkles, Brain, Settings2 } from 'lucide-react';

export default function StartScreen({
  topic,
  setTopic,
  showAdvanced,
  setShowAdvanced,
  slideCount,
  setSlideCount,
  designStyle,
  setDesignStyle,
  handleDraftOutline,
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white overflow-y-auto w-full">
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
}
