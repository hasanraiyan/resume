'use client';

import { useState, useMemo } from 'react';

/**
 * Blog Filters — Medium-style pill tags + minimal search.
 * Tags are extracted dynamically from the article data.
 */
export default function BlogFilters({ onFilterChange, onSearch, articles = [] }) {
  const [activeTag, setActiveTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Build dynamic tag list from actual article data
  const dynamicTags = useMemo(() => {
    const tagCounts = {};
    articles.forEach((article) => {
      article.tags?.forEach((tag) => {
        const normalized = tag.toLowerCase();
        tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
      });
    });

    // Sort by frequency, take top 8
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => ({
        id: tag,
        name: tag.charAt(0).toUpperCase() + tag.slice(1),
      }));
  }, [articles]);

  const allTags = [{ id: 'all', name: 'All' }, ...dynamicTags];

  const handleTagClick = (tagId) => {
    setActiveTag(tagId);
    onFilterChange(tagId);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="mb-10">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-neutral-200 bg-neutral-50 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Tag pills */}
      {dynamicTags.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.id)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 shrink-0 whitespace-nowrap ${
                activeTag === tag.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
