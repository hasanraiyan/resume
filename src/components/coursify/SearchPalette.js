'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Sparkles, BookOpen, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchPalette({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [popularTopics, setPopularTopics] = useState([]);
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

  // Autofocus input & fetch dynamic popular topics when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';

      // Fetch dynamic popular topics (recent articles) from database
      const fetchRecent = async () => {
        try {
          const res = await fetch('/api/coursify/search');
          const data = await res.json();
          if (data.success && data.latest && data.latest.length > 0) {
            setPopularTopics(data.latest);
          }
        } catch (err) {
          console.error('Error fetching popular topics:', err);
        }
      };
      fetchRecent();
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

      // Enter always navigates standard results. Arrows navigate results only.
      const totalItems = results.length;

      if (totalItems === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        e.preventDefault();

        if (results[selectedIndex]) {
          handleNavigate(results[selectedIndex].slug);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

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
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="bg-[#fcfbf5]/98 backdrop-blur-xl border border-[#e5e3d8] rounded-2xl shadow-[0_25px_60px_-15px_rgba(31,100,78,0.25)] w-full max-w-xl overflow-hidden pointer-events-auto flex flex-col max-h-[520px]"
            >
              {/* Input Header */}
              <div className="relative flex items-center gap-3 px-4 py-4 border-b border-[#e5e3d8] shrink-0 bg-white">
                <Search className="w-5 h-5 text-[#1f644e] shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search research topics or generate new..."
                  className="flex-1 bg-transparent text-sm text-[#1e3a34] outline-none placeholder-[#7c8e88] font-medium"
                />

                {/* Right side controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {loading && <Loader2 className="w-4 h-4 text-[#1f644e] animate-spin shrink-0" />}

                  {query && (
                    <>
                      <button
                        onClick={() => handleGenerateNew(query)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f644e]/8 hover:bg-[#1f644e] text-[#1f644e] hover:text-white rounded-lg text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                        title="Generate real-time AI Research"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">AI Research</span>
                      </button>

                      <button
                        onClick={() => {
                          setQuery('');
                          setResults([]);
                          inputRef.current?.focus();
                        }}
                        className="p-1.5 hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5 text-[#7c8e88]" />
                      </button>
                    </>
                  )}
                </div>

                {loading && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1f644e] to-transparent animate-pulse" />
                )}
              </div>

              {/* Suggestions / Results Scroll Container */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar min-h-[150px]"
              >
                {/* 1. Empty query suggestions */}
                {!query.trim() && popularTopics.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                      Recent Research
                    </div>
                    {popularTopics.map((topic) => (
                      <button
                        key={topic.slug}
                        onClick={() => handleNavigate(topic.slug)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors group cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5 font-medium truncate">
                          <BookOpen className="w-3.5 h-3.5 text-[#1f644e]/60 group-hover:text-[#1f644e] transition-colors shrink-0" />
                          <span className="truncate">{topic.title.replace(/[*_$]/g, '')}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#7c8e88] opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Searching & Loading state suggestions */}
                {query.trim() && results.length === 0 && !loading && (
                  <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#1f644e]/8 flex items-center justify-center text-[#1f644e] mb-4">
                      <Search className="w-6 h-6 opacity-65" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1e3a34] mb-1.5">No articles found</h3>
                    <p className="text-xs text-[#7c8e88] max-w-[280px] mb-4 leading-relaxed">
                      We couldn't find any existing research articles on &ldquo;{query}&rdquo;.
                    </p>
                    <p className="text-[10px] text-[#1f644e] font-bold">
                      Click the <span className="underline">&ldquo;AI Research&rdquo;</span> button
                      on the right of the search box to generate this in real-time!
                    </p>
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
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors group cursor-pointer ${
                            isActive
                              ? 'bg-[#1f644e] text-white shadow-md shadow-[#1f644e]/10'
                              : 'hover:bg-[#f0f5f2] text-[#1e3a34]'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 font-medium truncate">
                            <BookOpen
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                isActive
                                  ? 'text-white'
                                  : 'text-[#1f644e]/60 group-hover:text-[#1f644e]'
                              }`}
                            />
                            <span className="truncate">{article.title.replace(/[*_$]/g, '')}</span>
                          </span>
                          <div className="shrink-0 flex items-center">
                            {isActive ? (
                              <CornerDownLeft className="w-3.5 h-3.5 text-white/80 animate-pulse shrink-0" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5 text-[#7c8e88] opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Keyboard Help Footer */}
              <div className="px-4 py-2.5 bg-[#fcfbf5] border-t border-[#e5e3d8] text-[9px] font-bold text-[#7c8e88] flex items-center justify-between shrink-0 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="px-1 py-0.5 bg-white border border-[#e5e3d8] rounded text-[8px] shadow-sm">
                    ↑↓
                  </span>
                  <span>to navigate</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-white border border-[#e5e3d8] rounded text-[8px] shadow-sm">
                    Enter
                  </span>
                  <span>to select</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1 py-0.5 bg-white border border-[#e5e3d8] rounded text-[8px] shadow-sm">
                    ESC
                  </span>
                  <span>to close</span>
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
