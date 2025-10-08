'use client';

import { useState } from 'react';
import { projectsData } from '@/data/projects';

/**
 * Project Filters Component - SIMPLIFIED
 */
export default function ProjectFilters({ onFilterChange, onSearch }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    onFilterChange(categoryId);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="mb-12 sm:mb-16">
      {/* Search Bar - Cleaner design */}
      <div className="mb-8 sm:mb-10">
        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Search projects by name, tech, or category..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-5 py-4 border-2 border-gray-300 focus:border-black focus:outline-none transition text-sm sm:text-base bg-white hover-target"
          />
          <i className="fas fa-search absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      {/* Category Filters - Cleaner buttons */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {projectsData.categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`px-5 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition hover-target ${
              activeCategory === category.id
                ? 'bg-black text-white'
                : 'bg-white border-2 border-gray-200 text-gray-800 hover:border-black'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
