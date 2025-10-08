'use client';

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
`;

export default function CustomDropdownMinimal({ label, options, value, onChange, name }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const dropdownRef = useRef(null);
  const optionsRef = useRef(null);
  const indicatorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (optionsRef.current && isOpen) {
      gsap.fromTo(
        optionsRef.current,
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  // Animate hover indicator
  useEffect(() => {
    if (indicatorRef.current && hoveredIndex !== null) {
      const itemHeight = 48; // py-3 = 12px top + 12px bottom + content height
      gsap.to(indicatorRef.current, {
        y: hoveredIndex * itemHeight,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    } else if (indicatorRef.current) {
      gsap.to(indicatorRef.current, {
        opacity: 0,
        duration: 0.2,
      });
    }
  }, [hoveredIndex]);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  const MAX_VISIBLE_OPTIONS = 5;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div ref={dropdownRef} className="relative">
        <label className="block text-xs font-semibold mb-2 tracking-wider">{label}</label>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border-b-2 border-gray-300 pb-3 focus:border-black focus:outline-none transition text-sm sm:text-base bg-transparent text-left flex justify-between items-center group"
          suppressHydrationWarning={true}
        >
          <span className="text-black">{selectedOption?.label || 'Select'}</span>

          <svg
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {isOpen && (
          <div
            ref={optionsRef}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 shadow-xl rounded-sm overflow-hidden"
          >
            {/* Hover indicator */}
            <div
              ref={indicatorRef}
              className="absolute left-0 top-0 w-1 h-12 bg-black opacity-0 pointer-events-none z-10"
            />

            {/* Scrollable options container */}
            <div
              className={`max-h-48 overflow-y-auto custom-scrollbar ${
                options.length > MAX_VISIBLE_OPTIONS ? 'border-b border-gray-100' : ''
              }`}
            >
              {options.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`w-full text-left px-4 py-3 text-sm sm:text-base transition-colors relative ${
                    option.value === value ? 'bg-gray-50 font-semibold' : 'hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Show count if more than max visible */}
            {options.length > MAX_VISIBLE_OPTIONS && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
                {options.length - MAX_VISIBLE_OPTIONS} more option
                {options.length - MAX_VISIBLE_OPTIONS !== 1 ? 's' : ''} - scroll to view
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
