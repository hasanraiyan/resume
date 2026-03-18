'use client';

import { Button, Input } from '@/components/ui';
import { useState, useEffect, useRef } from 'react';

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
  const searchInputRef = useRef(null);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Keyboard shortcut for search (Cmd+K on Mac, Ctrl+K on Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (searchable && (event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchable]);
  return (
    <div className={`space-y-6 pb-24 px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Page Header */}
      <div className="relative group/header">
        <div className="absolute inset-0 -top-4 -mx-4 sm:-mx-8 lg:-mx-12 h-64 bg-gradient-to-b from-white/50 to-transparent pointer-events-none backdrop-blur-[2px] border-b border-white/20 -z-10" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl font-bold text-black font-['Playfair_Display'] tracking-tight mb-3 break-all">
              {title}
            </h1>
            {description && (
              <p className="text-neutral-600 text-lg max-w-2xl leading-relaxed">{description}</p>
            )}
          </div>

          {actionButton && (
            <div className="mt-6 sm:mt-0 sm:ml-6 flex-shrink-0">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-black/5 to-black/10 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 pointer-events-none" />
                {actionButton}
              </div>
            </div>
          )}
        </div>

        {searchable && (
          <div className="mt-6 max-w-lg">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-search text-neutral-400 group-focus-within:text-black transition-colors duration-200 text-sm"></i>
              </div>
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleSearchChange('');
                  }
                }}
                className="pl-12 pr-12 py-3.5 w-full bg-white/70 backdrop-blur-md border border-neutral-200/50 rounded-xl focus:border-black focus:ring-8 focus:ring-black/5 transition-all duration-300 text-neutral-800 placeholder-neutral-400 shadow-sm hover:shadow-md focus:shadow-xl text-base"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-red-500 transition-colors duration-200 group"
                  title="Clear search"
                >
                  <i className="fas fa-times-circle text-base group-hover:scale-110 transition-transform duration-200"></i>
                </button>
              )}
              {!searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-neutral-400 bg-neutral-100 border border-neutral-200 rounded shadow-sm">
                    ⌘K
                  </kbd>
                </div>
              )}
            </div>
            {searchTerm && (
              <div className="mt-3 text-xs text-neutral-500 flex items-center justify-between animate-in slide-in-from-top-1 duration-200">
                <span className="flex items-center">
                  <i className="fas fa-search mr-1.5 text-neutral-400"></i>
                  Searching for: <strong className="text-neutral-700">"{searchTerm}"</strong>
                </span>
                <span className="text-neutral-400 flex items-center">
                  <kbd className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-neutral-100 border border-neutral-200 rounded mr-1">
                    ESC
                  </kbd>
                  to clear
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
