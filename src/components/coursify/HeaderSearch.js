'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import SearchPalette from './SearchPalette';

export default function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);

  // Register global hotkey listeners for '/' and 'Cmd+K' / 'Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in form fields to prevent accidental triggers
      if (typeof document !== 'undefined' && document.activeElement) {
        const tag = document.activeElement.tagName.toLowerCase();
        if (
          tag === 'input' ||
          tag === 'textarea' ||
          document.activeElement.hasAttribute('contenteditable')
        ) {
          return;
        }
      }

      // '/' or 'Cmd+K' / 'Ctrl+K'
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 text-[#7c8e88] hover:text-[#1f644e] transition-colors rounded-full hover:bg-[#f0f5f2] cursor-pointer"
        aria-label="Open Search Command Palette (Cmd+K or /)"
        title="Search Palette (Cmd+K or /)"
      >
        <Search className="w-5 h-5" />
      </button>

      <SearchPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
