'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SearchResultItem from './SearchResultItem';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [groupedResults, setGroupedResults] = useState({ projects: [], articles: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceTimer = useRef(null);
  const { trackEvent } = useAnalytics();

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            // Navigate to selected result
            const selectedResult = results[selectedIndex];
            const href = selectedResult.type === 'project'
              ? `/projects/${selectedResult.slug}`
              : `/blog/${selectedResult.slug}`;
            window.location.href = href;
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Group results by type when results change
  useEffect(() => {
    const grouped = results.reduce((acc, result) => {
      if (result.type === 'project') {
        acc.projects.push(result);
      } else if (result.type === 'article') {
        acc.articles.push(result);
      }
      return acc;
    }, { projects: [], articles: [] });

    setGroupedResults(grouped);
  }, [results]);

  // Debounced search - properly implemented to avoid triggering on every keystroke
  useEffect(() => {
    return () => {
      // Cleanup timer on unmount
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Separate effect for search logic that runs when query changes
  useEffect(() => {
    // Clear previous timer on every query change
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't search if query is too short
    if (query.length < 3) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Set new timer with 300ms delay
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setResults(data.results || []);

        // Track search analytics
        trackEvent('search_performed', {
          searchTerm: query,
          resultCount: data.results?.length || 0,
          projectCount: data.results?.filter(r => r.type === 'project').length || 0,
          articleCount: data.results?.filter(r => r.type === 'article').length || 0
        });
      } catch (err) {
        setError('Failed to search. Please try again.');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects and articles..."
              className="w-full pl-4 pr-10 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {query.length < 3 ? (
            <div className="text-center text-gray-500 py-8">
              Start typing to search for projects and articles...
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                No results found for "{query}"
              </div>
              <Link
                href="/projects"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse All Projects
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Projects Section */}
              {groupedResults.projects.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Projects ({groupedResults.projects.length})
                  </h4>
                  <div className="space-y-3">
                    {groupedResults.projects.map((result, index) => {
                      const globalIndex = results.findIndex(r => r.id === result.id && r.type === result.type);
                      return (
                        <div
                          key={`project-${result.id}`}
                          ref={globalIndex === selectedIndex ? resultsRef : null}
                        >
                          <SearchResultItem
                            result={result}
                            onNavigate={onClose}
                            searchQuery={query}
                            isSelected={globalIndex === selectedIndex}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Articles Section */}
              {groupedResults.articles.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Articles ({groupedResults.articles.length})
                  </h4>
                  <div className="space-y-3">
                    {groupedResults.articles.map((result, index) => {
                      const globalIndex = results.findIndex(r => r.id === result.id && r.type === result.type);
                      return (
                        <div
                          key={`article-${result.id}`}
                          ref={globalIndex === selectedIndex ? resultsRef : null}
                        >
                          <SearchResultItem
                            result={result}
                            onNavigate={onClose}
                            searchQuery={query}
                            isSelected={globalIndex === selectedIndex}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
