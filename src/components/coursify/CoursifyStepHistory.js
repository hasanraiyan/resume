'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Search,
  Youtube,
  Sparkles,
  Globe,
  Image,
} from 'lucide-react';

const TOOL_CONFIG = {
  tavily_search: { label: 'Web Research', icon: Globe },
  TavilySearch: { label: 'Web Research', icon: Globe },
  youtube_search: { label: 'Video Search', icon: Youtube },
  agent: { label: 'Planning Research', icon: Sparkles },
};

function StepResult({ result }) {
  const [open, setOpen] = useState(false);
  if (!result) return null;
  const preview = result.substring(0, 120).replace(/\s+/g, ' ').trim();

  return (
    <div className="mt-1.5 ml-11">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[10px] font-semibold text-[#7c8e88] hover:text-[#1f644e] transition-colors"
      >
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
        {open ? 'Hide result' : 'View snippet'}
      </button>
      {open && (
        <p className="mt-1.5 rounded-lg bg-[#f7faf8] border border-[#e5e3d8] px-3 py-2 text-[10px] text-[#7c8e88] leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
          {preview}
          {result.length > 120 ? '…' : ''}
        </p>
      )}
    </div>
  );
}

export default function CoursifyStepHistory({ steps }) {
  const [expanded, setExpanded] = useState(true);

  // Filter out agent/planning steps - only show actual tool calls
  const visibleSteps = steps.filter((step) => step.tool !== 'agent');

  if (!visibleSteps || visibleSteps.length === 0) return null;

  return (
    <div className="flex flex-col w-full mb-6 group/history">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0f5f2] hover:bg-[#d4e6de] transition-all w-fit cursor-pointer border border-[#d4e6de] group"
      >
        <span className="text-[11px] font-bold text-[#1f644e] uppercase tracking-wider">
          {visibleSteps.length} Research Action{visibleSteps.length > 1 ? 's' : ''}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 flex-shrink-0 text-[#1f644e] ${
            expanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      {expanded && (
        <div className="mt-4 ml-2.5 pl-5 border-l border-dashed border-[#d4e6de] space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
          {visibleSteps.map((step, idx) => {
            const config = TOOL_CONFIG[step.tool] || { label: step.tool, icon: Search };
            const Icon = config.icon;
            const isDone = step.status === 'completed';

            // Extract search query from input
            let query = '';
            let inputObj = step.input;

            // Recursive or iterative helper to find the first string value in a nested object
            const findQueryValue = (obj) => {
              if (typeof obj === 'string') {
                // If it's a string that looks like JSON, try parsing it again
                if (obj.trim().startsWith('{') || obj.trim().startsWith('[')) {
                  try {
                    const parsed = JSON.parse(obj);
                    return findQueryValue(parsed);
                  } catch (e) {
                    return obj;
                  }
                }
                return obj;
              }

              if (typeof obj === 'object' && obj !== null) {
                // Priority keys
                const keys = ['query', 'input', 'q', 'topic', 'search_query', 'text'];
                for (const key of keys) {
                  if (obj[key] && typeof obj[key] === 'string') return obj[key];
                  if (obj[key] && typeof obj[key] === 'object') {
                    const found = findQueryValue(obj[key]);
                    if (found) return found;
                  }
                }

                // Fallback: search all keys
                for (const key in obj) {
                  const found = findQueryValue(obj[key]);
                  if (found) return found;
                }
              }
              return null;
            };

            query = findQueryValue(inputObj);

            // Fallback to original input if still empty
            if (!query && step.input) {
              query = typeof step.input === 'string' ? step.input : JSON.stringify(step.input);
            }

            // Final cleanup: if it's still JSON (e.g. stringified fallback), strip it
            if (query && (query.startsWith('{') || query.includes('":"'))) {
              try {
                const finalTry = JSON.parse(query);
                const deepValue = findQueryValue(finalTry);
                if (deepValue) query = deepValue;
              } catch (e) {}
            }

            // Only render if we have a valid query
            if (!query || query === '{}' || query === 'undefined' || query === 'null') return null;

            // Ensure we don't have double quotes if we're wrapping it in quotes
            const cleanQuery = query.toString().replace(/^"|"$/g, '').trim();
            const displayQuery = `Searching for "${cleanQuery}"`;

            return (
              <div
                key={`step-${idx}`}
                className={`rounded-xl transition-all duration-300 border ${
                  isDone
                    ? 'bg-white border-[#e5e3d8]'
                    : 'bg-[#f0f5f2]/50 border-[#d4e6de] animate-pulse'
                }`}
              >
                <div className="flex items-center justify-between gap-3 p-3">
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
                        title={cleanQuery}
                      >
                        {displayQuery}
                      </p>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isDone ? 'text-[#b5c4be]' : 'text-[#1f644e]/50'
                        }`}
                      >
                        {config.label}
                      </p>
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
                {/* Inline result snippet — only shown after TOOL_CALL_RESULT arrives */}
                {isDone && <StepResult result={step.result} />}
                {isDone && step.result && <div className="pb-2" />}
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
