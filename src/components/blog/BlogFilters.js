'use client'

import { useState } from 'react'

/**
 * Blog Filters Component - Similar to ProjectFilters but for articles
 */
export default function BlogFilters({ onFilterChange, onSearch }) {
  const [activeTag, setActiveTag] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Common blog tags - you can make this dynamic later
  const blogTags = [
    { id: 'all', name: 'All Articles' },
    { id: 'technology', name: 'Technology' },
    { id: 'ai', name: 'AI' },
    { id: 'artificial intelligence', name: 'Artificial Intelligence' },
    { id: 'history', name: 'History' },
    { id: 'expert systems', name: 'Expert Systems' },
    { id: 'virtual assistants', name: 'Virtual Assistants' },
    { id: 'machine learning', name: 'Machine Learning' },
    { id: 'automation', name: 'Automation' },
    { id: 'software agents', name: 'Software Agents' }
  ]

  const handleTagClick = (tagId) => {
    setActiveTag(tagId)
    onFilterChange(tagId)
  }

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch(query)
  }

  return (
    <div className="mb-12 sm:mb-16">

      {/* Search Bar - Cleaner design */}
      <div className="mb-8 sm:mb-10">
        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Search articles by title, content, or tags..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-5 py-4 border-2 border-gray-300 focus:border-black focus:outline-none transition text-sm sm:text-base bg-white hover-target"
          />
          <i className="fas fa-search absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      {/* Tag Filters - Cleaner buttons */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {blogTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.id)}
            className={`px-5 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition hover-target ${
              activeTag === tag.id
                ? 'bg-black text-white'
                : 'bg-white border-2 border-gray-200 text-gray-800 hover:border-black'
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  )
}
