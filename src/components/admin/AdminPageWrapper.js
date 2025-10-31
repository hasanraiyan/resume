'use client';

import { Button, Input } from '@/components/ui';
import { useState } from 'react';

/**
 * Admin page wrapper component providing consistent layout structure.
 *
 * Provides a standardized header layout for admin pages with title, description,
 * and optional action button. Wraps page content with consistent spacing and
 * visual hierarchy for admin interfaces.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Page title displayed prominently
 * @param {string} props.description - Optional page description text
 * @param {JSX.Element} props.actionButton - Optional action button element
 * @param {React.ReactNode} props.children - Page content to wrap
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.searchable - Whether to show search bar
 * @param {string} props.searchPlaceholder - Placeholder text for search input
 * @param {Function} props.onSearch - Callback function when search changes
 * @returns {JSX.Element} Admin page layout wrapper
 */
export default function AdminPageWrapper({
  title,
  description,
  actionButton,
  children,
  className = '',
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Page Header */}
      <div className="border-b-2 border-neutral-200 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-black font-['Playfair_Display'] mb-2">
              {title}
            </h1>
            {description && <p className="text-neutral-600 text-lg max-w-4xl">{description}</p>}
          </div>

          {actionButton && <div className="mt-4 sm:mt-0 sm:ml-6">{actionButton}</div>}
        </div>

        {searchable && (
          <div className="mt-4 max-w-md">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"></i>
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border-2 border-neutral-300 focus:border-black transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
