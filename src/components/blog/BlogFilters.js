'use client';

import { useState, useMemo } from 'react';

/**
 * Blog Filters — Medium-style pill tags + minimal search.
 * Tags are extracted dynamically from the article data.
 */
export default function BlogFilters({
  onFilterChange,
  onSearch,
  allTagsList = [],
  initialSearch = '',
  initialTag = 'all',
}) {
  const [activeTag, setActiveTag] = useState(initialTag);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Build dynamic tag list from all tags
  const dynamicTags = useMemo(() => {
    if (!allTagsList || allTagsList.length === 0) return [];

    // Process unique tags that come from the backend distinct query
    // They are just string values. We'll show up to 8.
    return allTagsList.slice(0, 8).map((tag) => ({
      id: tag.toLowerCase(),
      name: tag.charAt(0).toUpperCase() + tag.slice(1),
    }));
  }, [allTagsList]);

  const allTags = [{ id: 'all', name: 'All' }, ...dynamicTags];

  const handleTagClick = (tagId) => {
    setActiveTag(tagId);
    onFilterChange(tagId);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  return (
    <div className="mb-10">
      {/* Search */}
      <div className="mb-6">
        <form
          className="relative max-w-md mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(searchQuery);
          }}
        >
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
        </form>
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
