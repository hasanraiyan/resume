'use client';

import { useState } from 'react';
import { ChevronDown, CheckCircle2, Search, Youtube, Sparkles, Globe } from 'lucide-react';

const TOOL_CONFIG = {
  tavily_search: { label: 'Web Research', icon: Globe },
  TavilySearch: { label: 'Web Research', icon: Globe },
  youtube_search: { label: 'Video Search', icon: Youtube },
  agent: { label: 'Planning Research', icon: Sparkles },
};

const SEARCH_LABELS = {
  tavily_search: 'Searching web for',
  TavilySearch: 'Searching web for',
  youtube_search: 'Searching YouTube for',
};

function extractDomains(result) {
  if (!result) return [];
  try {
    const parsed = JSON.parse(result);
    // Structured: { urls: [...] }
    if (Array.isArray(parsed.urls)) {
      return parsed.urls
        .map((url) => {
          try {
            return new URL(url).hostname.replace(/^www\./, '');
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .slice(0, 4);
    }
    // Raw Tavily: { results: [{url}, ...] }
    if (Array.isArray(parsed.results)) {
      return parsed.results
        .map((r) => {
          try {
            return new URL(r.url).hostname.replace(/^www\./, '');
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .slice(0, 4);
    }
  } catch {}
  // Regex fallback
  const matches = [...result.matchAll(/https?:\/\/([^/\s"'<>\]]+)/g)];
  return [
    ...new Set(
      matches
        .map((m) => {
          try {
            return new URL(m[0]).hostname.replace(/^www\./, '');
          } catch {
            return null;
          }
        })
        .filter((d) => d && !d.includes('youtube') && !d.includes('ytimg'))
    ),
  ].slice(0, 4);
}

function extractYoutubeThumbnails(result) {
  if (!result) return [];
  try {
    const parsed = JSON.parse(result);
    // Structured: { thumbnails: [{thumbnail, title}, ...] }
    if (Array.isArray(parsed.thumbnails)) {
      return parsed.thumbnails.filter((v) => v?.thumbnail).slice(0, 3);
    }
    // Raw: { output: "[{videoId, thumbnail, ...}]" }
    if (typeof parsed.output === 'string') {
      const videos = JSON.parse(parsed.output);
      return (Array.isArray(videos) ? videos : [])
        .filter((v) => v.thumbnail || v.videoId)
        .map((v) => ({
          thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
          title: v.title || '',
        }))
        .slice(0, 3);
    }
  } catch {}
  // Regex fallback for video IDs
  const matches = [
    ...result.matchAll(/(?:youtube\.com\/watch\?[^"'\s]*v=|youtu\.be\/)([A-Za-z0-9_-]{11})/g),
  ];
  return [...new Set(matches.map((m) => m[1]))]
    .slice(0, 3)
    .map((id) => ({ thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`, title: '' }));
}

export default function CoursifyStepHistory({ steps }) {
  const [expanded, setExpanded] = useState(true);

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
            const isYoutube = step.tool === 'youtube_search';
            const searchLabel = SEARCH_LABELS[step.tool] || 'Searching for';

            let query = '';
            let inputObj = step.input;

            const findQueryValue = (obj) => {
              if (typeof obj === 'string') {
                if (obj.trim().startsWith('{') || obj.trim().startsWith('[')) {
                  try {
                    return findQueryValue(JSON.parse(obj));
                  } catch (e) {
                    return obj;
                  }
                }
                return obj;
              }
              if (typeof obj === 'object' && obj !== null) {
                const keys = ['query', 'input', 'q', 'topic', 'search_query', 'text'];
                for (const key of keys) {
                  if (obj[key] && typeof obj[key] === 'string') return obj[key];
                  if (obj[key] && typeof obj[key] === 'object') {
                    const found = findQueryValue(obj[key]);
                    if (found) return found;
                  }
                }
                for (const key in obj) {
                  const found = findQueryValue(obj[key]);
                  if (found) return found;
                }
              }
              return null;
            };

            query = findQueryValue(inputObj);
            if (!query && step.input) {
              query = typeof step.input === 'string' ? step.input : JSON.stringify(step.input);
            }
            if (query && (query.startsWith('{') || query.includes('":"'))) {
              try {
                const deepValue = findQueryValue(JSON.parse(query));
                if (deepValue) query = deepValue;
              } catch (e) {}
            }

            if (!query || query === '{}' || query === 'undefined' || query === 'null') return null;

            const cleanQuery = query.toString().replace(/^"|"$/g, '').trim();
            const domains = isDone && !isYoutube ? extractDomains(step.result) : [];
            const youtubeThumbnails =
              isDone && isYoutube ? extractYoutubeThumbnails(step.result) : [];

            return (
              <div
                key={`step-${idx}`}
                className={`rounded-xl transition-all duration-300 border ${
                  isDone
                    ? 'bg-white border-[#e5e3d8]'
                    : 'bg-[#f0f5f2]/50 border-[#d4e6de] animate-pulse'
                }`}
              >
                <div className="flex items-start justify-between gap-3 p-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors mt-0.5 ${
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
                        {searchLabel}{' '}
                        <span className="font-normal">&ldquo;{cleanQuery}&rdquo;</span>
                      </p>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isDone ? 'text-[#b5c4be]' : 'text-[#1f644e]/50'
                        }`}
                      >
                        {config.label}
                      </p>

                      {/* Web result domain pills */}
                      {domains.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {domains.map((domain) => (
                            <span
                              key={domain}
                              className="inline-flex items-center rounded-full bg-[#f0f5f2] border border-[#d4e6de] px-2 py-0.5 text-[10px] font-semibold text-[#1f644e] leading-tight"
                            >
                              {domain}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* YouTube video thumbnails */}
                      {youtubeThumbnails.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {youtubeThumbnails.map((v, i) => (
                            <img
                              key={i}
                              src={v.thumbnail}
                              alt={v.title}
                              title={v.title}
                              className="w-16 h-10 rounded-md object-cover border border-[#e5e3d8]"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2 mt-0.5">
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-[#1f644e]/10 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1f644e]" />
                      </div>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-[#1f644e] animate-ping" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

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
