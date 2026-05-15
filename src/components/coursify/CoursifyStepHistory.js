'use client';

import { useState } from 'react';
import { ChevronDown, CheckCircle2, Search, Youtube, Sparkles, Globe, Image } from 'lucide-react';

const TOOL_CONFIG = {
  tavily_search: { label: 'Web Research', icon: Globe },
  TavilySearch: { label: 'Web Research', icon: Globe },
  youtube_search: { label: 'Video Search', icon: Youtube },
  agent: { label: 'Planning Research', icon: Sparkles },
};

export default function CoursifyStepHistory({ steps }) {
  const [expanded, setExpanded] = useState(true);
  if (!steps || steps.length === 0) return null;

  return (
    <div className="flex flex-col w-full mb-6 group/history">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0f5f2] hover:bg-[#d4e6de] transition-all w-fit cursor-pointer border border-[#d4e6de] group"
      >
        <span className="text-[11px] font-bold text-[#1f644e] uppercase tracking-wider">
          {steps.length} Research Action{steps.length > 1 ? 's' : ''}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 flex-shrink-0 text-[#1f644e] ${
            expanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      {expanded && (
        <div className="mt-4 ml-2.5 pl-5 border-l border-dashed border-[#d4e6de] space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
          {steps.map((step, idx) => {
            const config = TOOL_CONFIG[step.tool] || { label: step.tool, icon: Search };
            const Icon = config.icon;
            const isDone = step.status === 'completed';

            return (
              <div
                key={`step-${idx}`}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-all duration-300 border ${
                  isDone
                    ? 'bg-white border-[#e5e3d8]'
                    : 'bg-[#f0f5f2]/50 border-[#d4e6de] animate-pulse'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isDone ? 'bg-[#f0f5f2] text-[#1f644e]' : 'bg-[#d4e6de] text-[#1f644e]/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-bold truncate ${
                        isDone ? 'text-[#1e3a34]' : 'text-[#7c8e88]'
                      }`}
                    >
                      {step.input?.query || config.label}
                    </p>
                    {step.input?.query && (
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isDone ? 'text-[#b5c4be]' : 'text-[#1f644e]/50'
                        }`}
                      >
                        {config.label}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 ml-2">
                  {isDone ? (
                    <div className="w-5 h-5 rounded-full bg-[#1f644e]/10 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1f644e]" />
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[#1f644e] animate-ping" />
                  )}
                </div>
              </div>
            );
          })}

          {/* Persistent "Thinking" state if the last step is done but we're still in generating phase */}
          {steps.length > 0 && steps[steps.length - 1].status === 'completed' && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f0f5f2]/30 border border-[#d4e6de] border-dashed animate-pulse">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d4e6de]/50 flex items-center justify-center text-[#1f644e]/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-[#b5c4be]">AI is thinking...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
