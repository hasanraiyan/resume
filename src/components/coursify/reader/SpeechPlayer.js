'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  Settings2,
  X
} from 'lucide-react';
import { useState } from 'react';

export function SpeechPlayer({
  isPlaying,
  currentSegmentIndex,
  totalSegments,
  voices,
  selectedVoice,
  setSelectedVoice,
  rate,
  setRate,
  pitch,
  setPitch,
  togglePlayPause,
  stop,
  nextSegment,
  prevSegment
}) {
  const [showSettings, setShowSettings] = useState(false);

  if (totalSegments === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md"
    >
      <div className="bg-white border border-[#e5e3d8] shadow-2xl rounded-2xl p-4 flex flex-col gap-3">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-[#f0f5f2] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#1f644e]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentSegmentIndex + 1) / totalSegments) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#f0f5f2] flex items-center justify-center text-[#1f644e]">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">Audio Guide</p>
              <p className="text-xs font-bold text-[#1e3a34]">
                Segment {currentSegmentIndex + 1} of {totalSegments}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevSegment}
              disabled={currentSegmentIndex === 0}
              className="p-2 hover:bg-[#f0f5f2] rounded-full text-[#7c8e88] disabled:opacity-30 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlayPause}
              className="h-10 w-10 bg-[#1f644e] text-white rounded-full flex items-center justify-center hover:bg-[#1a5542] transition-all shadow-lg shadow-[#1f644e]/20"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={nextSegment}
              disabled={currentSegmentIndex === totalSegments - 1}
              className="p-2 hover:bg-[#f0f5f2] rounded-full text-[#7c8e88] disabled:opacity-30 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-[#e5e3d8] mx-1" />

            <button
              onClick={stop}
              className="p-2 hover:bg-[#f0f5f2] rounded-full text-[#7c8e88] transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-[#1f644e] text-white' : 'hover:bg-[#f0f5f2] text-[#7c8e88]'}`}
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#e5e3d8] pt-3"
            >
              <div className="space-y-4 py-1">
                <div>
                  <label className="text-[10px] font-bold text-[#7c8e88] uppercase mb-1.5 block">Voice Selection</label>
                  <select
                    value={selectedVoice?.name || ''}
                    onChange={(e) => {
                      const voice = voices.find(v => v.name === e.target.value);
                      if (voice) setSelectedVoice(voice);
                    }}
                    className="w-full text-xs bg-[#f0f5f2] border-none rounded-lg px-3 py-2 outline-none text-[#1e3a34] font-medium"
                  >
                    {voices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-[#7c8e88] uppercase">Speed</label>
                      <span className="text-[10px] font-bold text-[#1f644e]">{rate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={rate}
                      onChange={(e) => setRate(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#f0f5f2] rounded-full appearance-none cursor-pointer accent-[#1f644e]"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-[#7c8e88] uppercase">Pitch</label>
                      <span className="text-[10px] font-bold text-[#1f644e]">{pitch}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={pitch}
                      onChange={(e) => setPitch(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#f0f5f2] rounded-full appearance-none cursor-pointer accent-[#1f644e]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-[#f0f5f2] rounded-full text-[#7c8e88] transition-colors self-end"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
