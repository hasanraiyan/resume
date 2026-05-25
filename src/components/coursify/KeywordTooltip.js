'use client';

import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ArrowRight } from 'lucide-react';

export function KeywordTooltip({ keyword, definition }) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});

  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 320;
    const padding = 16;
    const viewportWidth = window.innerWidth;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;

    if (left + popoverWidth > viewportWidth - padding) {
      left = viewportWidth - popoverWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    setPopoverStyle({
      top: rect.top + window.scrollY - 8,
      left: left + window.scrollX,
      width: popoverWidth,
    });

    const triggerCenterRelative = rect.left + rect.width / 2 - left;
    setArrowStyle({
      left: triggerCenterRelative,
    });
  };

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    clearTimeout(timeoutRef.current);
    updatePosition();
    setIsOpen(true);
  };

  const handleExplore = (e) => {
    e.stopPropagation();
    const url = `/coursify?search_ai=${encodeURIComponent(keyword)}&send=true`;
    window.open(url, '_blank');
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <span
      className="relative inline-block"
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        onClick={handleClick}
        className="border-b-2 border-dotted border-[#1f644e] text-[#1f644e] font-medium cursor-pointer transition-all px-0.5 rounded hover:bg-[#f0f5f2]"
      >
        {keyword}
      </span>

      {isOpen &&
        typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div
            className="absolute z-[999999] -translate-y-full pb-2 animate-in fade-in zoom-in-95 duration-200"
            style={popoverStyle}
            onMouseEnter={() => {
              clearTimeout(timeoutRef.current);
              setIsOpen(true);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="overflow-hidden rounded-xl border border-[#e5e3d8] bg-white p-3 shadow-2xl">
              <p className="text-xs leading-relaxed text-[#1e3a34]">{definition}</p>
              <button
                onClick={handleExplore}
                className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-[#1f644e] hover:text-[#184d3c] transition-colors pt-2 border-t border-[#f0f5f2]"
              >
                Explore
                <ArrowRight className="w-3 h-3" />
              </button>
              <div
                className="absolute top-full border-4 border-transparent border-t-white"
                style={arrowStyle}
              />
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}
