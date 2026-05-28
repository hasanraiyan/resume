'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Sparkles, BookOpen, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  'TCP/IP Networking',
  'React Hooks in depth',
  'Quantum Computing',
  'SQL Window Functions',
  "Dijkstra's Algorithm",
];

export default function SearchPalette({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/coursify/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.results || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
        setResults([]);
      } finally {
        setLoading(false);
        setSelectedIndex(0);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Autofocus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Calculate total item count (results length + 1 if query is active for AI research action)
      const hasQuery = query.trim().length > 0;
      const totalItems = results.length + (hasQuery ? 1 : 0);

      if (totalItems === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        e.preventDefault();

        // If selectedIndex points to the "AI Generate" item (which is always the last item when query is active)
        if (hasQuery && selectedIndex === results.length) {
          handleGenerateNew(query);
        } else if (results[selectedIndex]) {
          handleNavigate(results[selectedIndex].slug);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, query, onClose]);

  // Keep active item in view inside scroll container
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleNavigate = (slug) => {
    onClose();
    router.push(`/coursify/r/${slug}`);
  };

  const handleGenerateNew = (topic) => {
    onClose();
    router.push(`/coursify?search_ai=${encodeURIComponent(topic)}&send=true`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1e3a34]/40 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-white border border-[#e5e3d8] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden pointer-events-auto flex flex-col max-h-[500px]"
            >
              {/* Input Header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e5e3d8] shrink-0">
                <Search className="w-5 h-5 text-[#1f644e] shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search research topics or generate new..."
                  className="flex-1 bg-transparent text-sm text-[#1e3a34] outline-none placeholder-[#7c8e88] font-medium"
                />
                {loading ? (
                  <Loader2 className="w-4 h-4 text-[#1f644e] animate-spin shrink-0" />
                ) : query ? (
                  <button
                    onClick={() => {
                      setQuery('');
                      setResults([]);
                      inputRef.current?.focus();
                    }}
                    className="p-1 hover:bg-[#f0f5f2] rounded-lg transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-[#7c8e88]" />
                  </button>
                ) : null}
              </div>

              {/* Suggestions / Results Scroll Container */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar min-h-[150px]"
              >
                {/* 1. Empty query suggestions */}
                {!query.trim() && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                      Popular Topics
                    </div>
                    {SUGGESTIONS.map((topic, idx) => (
                      <button
                        key={topic}
                        onClick={() => {
                          setQuery(topic);
                          inputRef.current?.focus();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors group cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-[#1f644e]/60 group-hover:text-[#1f644e] transition-colors" />
                          {topic}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#7c8e88] opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Searching & Loading state suggestions */}
                {query.trim() && results.length === 0 && !loading && (
                  <div className="py-6 text-center text-sm text-[#7c8e88]">
                    No existing research found. Hit{' '}
                    <span className="font-bold text-[#1f644e]">Enter</span> to research this!
                  </div>
                )}

                {/* 3. Search results */}
                {results.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                      Matching Research Articles
                    </div>
                    {results.map((article, idx) => {
                      const isActive = selectedIndex === idx;
                      return (
                        <button
                          key={article.slug}
                          data-active={isActive}
                          onClick={() => handleNavigate(article.slug)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex flex-col px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#1f644e] text-white shadow-md shadow-[#1f644e]/10'
                              : 'hover:bg-[#f0f5f2] text-[#1e3a34]'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-sm line-clamp-1 flex items-center gap-2">
                              <BookOpen
                                className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#1f644e]'}`}
                              />
                              {article.title.replace(/[*_$]/g, '')}
                            </span>
                            {isActive && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-white/80 shrink-0" />
                            )}
                          </div>
                          <span
                            className={`text-xs mt-0.5 line-clamp-1 ${
                              isActive ? 'text-white/70' : 'text-[#7c8e88]'
                            }`}
                          >
                            Topic: {article.topic.replace(/[*_$]/g, '')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Quick Action Bar for AI Research */}
              {query.trim() && (
                <div className="p-2 border-t border-[#e5e3d8] bg-[#fcfbf5] shrink-0">
                  {(() => {
                    const isAiActionActive = selectedIndex === results.length;
                    return (
                      <button
                        data-active={isAiActionActive}
                        onClick={() => handleGenerateNew(query)}
                        onMouseEnter={() => setSelectedIndex(results.length)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                          isAiActionActive
                            ? 'bg-[#1f644e] text-white shadow-md shadow-[#1f644e]/15'
                            : 'bg-white border border-[#e5e3d8] text-[#1f644e] hover:bg-[#f0f5f2]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles
                            className={`w-4 h-4 ${isAiActionActive ? 'text-white' : 'text-[#1f644e]'}`}
                          />
                          <span>Generate real-time AI Research on &ldquo;{query}&rdquo;</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isAiActionActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#f0f5f2] text-[#7c8e88]'
                            }`}
                          >
                            Enter
                          </span>
                        </div>
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* Keyboard Help Footer */}
              <div className="px-4 py-2 bg-[#fcfbf5] border-t border-[#e5e3d8] text-[9px] font-bold text-[#7c8e88] flex items-center justify-between shrink-0 uppercase tracking-widest">
                <span>↑↓ to navigate • enter to select</span>
                <span>esc to close</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
