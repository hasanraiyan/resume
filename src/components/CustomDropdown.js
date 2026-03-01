import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Loader2 } from 'lucide-react';

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
    border-radius: 2px;
  }
`;

/**
 * Minimal custom dropdown component with smooth animations.
 */
export default function CustomDropdownMinimal({
  label,
  options = [],
  value,
  onChange,
  name,
  isLoading = false,
  placeholder = 'Select',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const optionsRef = useRef(null);

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
        { opacity: 0, y: -10, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);
  const MAX_VISIBLE_OPTIONS = 6;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div ref={dropdownRef} className="relative w-full">
        {label && (
          <label className="block text-xs font-semibold mb-2 tracking-wider text-neutral-600 uppercase">
            {label}
          </label>
        )}

        <button
          type="button"
          disabled={isLoading}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full border-b-2 pb-2.5 transition-all text-sm sm:text-base bg-transparent text-left flex justify-between items-center group
            ${isOpen ? 'border-black' : 'border-neutral-200 hover:border-neutral-400'}
            ${isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          `}
          suppressHydrationWarning={true}
        >
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-neutral-400 shrink-0" />}
            <span
              className={`truncate ${selectedOption ? 'text-black font-medium' : 'text-neutral-400'}`}
            >
              {selectedOption?.label || placeholder}
            </span>
          </div>

          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 text-neutral-400 group-hover:text-black ${isOpen ? 'rotate-180 text-black' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && !isLoading && (
          <div
            ref={optionsRef}
            className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-neutral-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Scrollable options container */}
            <div className={`max-h-[260px] overflow-y-auto custom-scrollbar`}>
              {options.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-neutral-400 italic">
                  No options available
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-4 py-3 text-sm outline-none transition-all relative border-l-4
                      ${
                        option.value === value
                          ? 'bg-neutral-50 border-black font-semibold text-black'
                          : 'bg-white border-transparent text-neutral-600 hover:bg-neutral-50 focus:bg-neutral-50 hover:text-black hover:border-neutral-300'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>

            {/* Show count info if many options */}
            {options.length > MAX_VISIBLE_OPTIONS && (
              <div className="px-4 py-1.5 bg-neutral-50/50 border-t border-neutral-100 text-[10px] text-neutral-400 text-center uppercase tracking-widest font-medium">
                Scroll for more ({options.length})
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
