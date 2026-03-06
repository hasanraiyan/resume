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
    <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16 bg-white overflow-y-auto min-h-screen">
      <div className="max-w-3xl w-full flex flex-col gap-8 sm:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 my-auto">
        {/* Header Section */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-neutral-100 text-black text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] border border-neutral-200 shadow-sm">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> AI Deck Studio
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tighter text-black leading-[1.05]">
            Generate <span className="text-neutral-400 italic">Narratives</span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 leading-relaxed max-w-lg">
            From simple text to a structured visual presentation. Use the AI engine to build your
            deck in seconds.
          </p>
        </div>

        {/* Interactive Generation Section */}
        <div className="flex flex-col gap-4 sm:gap-6 w-full">
          <div className="bg-white border-2 border-neutral-200 rounded-2xl sm:rounded-[2rem] p-2 sm:p-3 shadow-sm focus-within:border-black focus-within:ring-4 focus-within:ring-neutral-100 transition-all duration-300 flex flex-col">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. A pitch deck for a new sustainable coffee brand aiming for seed funding..."
              className="w-full bg-transparent border-none focus:ring-0 outline-none px-4 sm:px-6 pt-4 sm:pt-6 pb-4 text-black placeholder-neutral-400 min-h-[140px] resize-none text-lg sm:text-xl md:text-2xl leading-relaxed font-['Playfair_Display']"
              autoFocus
            />

            {/* Inline Options Panel - Fixed to take 0 space when closed */}
            {showAdvanced && (
              <div className="mx-2 sm:mx-4 mb-3 p-4 bg-neutral-50/80 rounded-xl border border-neutral-100 flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">
                    Length
                  </label>
                  <select
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-200 rounded-lg py-2.5 px-3 text-sm font-medium outline-none focus:ring-1 focus:ring-black focus:border-black cursor-pointer hover:border-neutral-300 transition-colors shadow-sm"
                  >
                    {[5, 7, 10, 15].map((n) => (
                      <option key={n} value={n}>
                        {n} Slides
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">
                    Visual Theme
                  </label>
                  <select
                    value={designStyle}
                    onChange={(e) => setDesignStyle(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg py-2.5 px-3 text-sm font-medium outline-none focus:ring-1 focus:ring-black focus:border-black cursor-pointer hover:border-neutral-300 transition-colors shadow-sm"
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

            {/* Toolbar */}
            <div className="flex items-center justify-between px-2 sm:px-3 pb-2 pt-2">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors px-3 sm:px-4 py-2 sm:py-2.5 rounded-full flex items-center gap-2 ${
                  showAdvanced
                    ? 'bg-neutral-200 text-neutral-800'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Options</span>
              </button>

              <button
                onClick={handleDraftOutline}
                disabled={!topic.trim()}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-black text-white rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all disabled:opacity-30 flex items-center justify-center shadow-md hover:shadow-lg active:scale-95"
              >
                <span>Outline</span>
              </button>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-2 sm:px-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3 h-3" /> Try
            </span>
            <div className="flex flex-wrap items-center gap-2 w-full">
              <button
                onClick={() =>
                  setTopic('An educational deck about the Moon, its phases, and human exploration')
                }
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 transition-colors cursor-pointer text-left"
              >
                The Moon
              </button>
              <button
                onClick={() =>
                  setTopic('A sleek startup pitch deck for a futuristic sustainable energy company')
                }
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 transition-colors cursor-pointer text-left"
              >
                Energy Pitch
              </button>
              <button
                onClick={() =>
                  setTopic('A Q3 Marketing Review showing rapid growth and new campaign strategies')
                }
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 transition-colors cursor-pointer text-left"
              >
                Q3 Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
