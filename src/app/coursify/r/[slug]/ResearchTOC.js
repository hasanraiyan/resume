'use client';

import { useState, useRef, useEffect } from 'react';
import { List, ChevronDown } from 'lucide-react';
import { useTableOfContents } from '@/hooks/coursify/useTableOfContents';
import { cn } from '@/utils/classNames';

export default function ResearchTOC({ content }) {
  const [isOpen, setIsOpen] = useState(true);
  const [maxHeight, setMaxHeight] = useState('auto');
  const navRef = useRef(null);

  // Initialize TOC hook - Using window for scroll as it's a full page
  const { headings, activeHeading } = useTableOfContents(
    content,
    {
      current: typeof document !== 'undefined' ? document.getElementById('research-content') : null,
    },
    { current: typeof window !== 'undefined' ? window : null }
  );

  useEffect(() => {
    if (!navRef.current) return;

    if (isOpen) {
      setMaxHeight(`${navRef.current.scrollHeight}px`);
    } else {
      setMaxHeight('0px');
    }
  }, [isOpen, headings]);

  if (!headings.length) return null;

  return (
    <aside className="hidden lg:block sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 scrollbar-thin">
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        .scrollbar-thin {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[#1f644e] mb-6 hover:text-[#1f644e]/80 transition-colors"
      >
        <List className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Table of Contents</span>
        <ChevronDown
          className={cn('w-3 h-3 transition-transform', isOpen ? 'rotate-0' : '-rotate-90')}
        />
      </button>

      <nav
        ref={navRef}
        className="space-y-1 border-l border-[#e5e3d8] overflow-hidden transition-all"
        style={{ maxHeight, transitionDuration: '300ms' }}
      >
        {' '}
        {headings.map((heading, i) => (
          <a
            key={i}
            href={`#${heading.slug}`}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById(heading.slug)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={cn(
              'block py-2 pl-4 text-xs font-bold transition-all border-l-2 -ml-[2px]',
              activeHeading === heading.text
                ? 'text-[#1f644e] border-[#1f644e] translate-x-1'
                : 'text-[#7c8e88] border-transparent hover:text-[#1f644e] hover:border-[#1f644e]/30'
            )}
            style={{ paddingLeft: `${(heading.level - 1) * 12 + 16}px` }}
          >
            {heading.text}
          </a>
        ))}
      </nav>

      <div className="mt-12 p-4 bg-[#f0f5f2] rounded-2xl">
        <p className="text-[10px] font-bold text-[#1f644e] uppercase tracking-widest mb-2">
          Pro Tip
        </p>
        <p className="text-[10px] text-[#7c8e88] leading-relaxed">
          Use the sidebar to quickly navigate through complex research topics.
        </p>
      </div>
    </aside>
  );
}
