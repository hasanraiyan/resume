'use client';

import { List, ChevronRight } from 'lucide-react';

export default function TableOfContents({
  headings,
  activeHeading,
  tocOpen,
  onToggleToc,
}) {
  if (headings.length === 0) return null;

  return (
    <aside className="hidden lg:block shrink-0 sticky top-0 self-start max-h-screen overflow-y-auto py-8 pr-2 pl-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-[#7c8e88]">
          <List className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            On this page
          </span>
        </div>
        <button
          onClick={onToggleToc}
          className="p-0.5 rounded text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors"
          title={tocOpen ? 'Collapse' : 'Expand'}
        >
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-200 ${tocOpen ? 'rotate-90' : ''}`}
          />
        </button>
      </div>
      {tocOpen && (
        <nav className="space-y-0.5">
          {headings.map((h) => (
            <a
              key={h.slug}
              href={`#${h.slug}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(h.slug);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`block text-xs leading-snug transition-colors py-0.5 ${
                h.level === 3 ? 'pl-4' : ''
              } ${
                activeHeading === h.text
                  ? 'text-[#1f644e] font-bold'
                  : 'text-[#7c8e88] hover:text-[#1e3a34]'
              }`}
            >
              {h.text}
            </a>
          ))}
        </nav>
      )}
    </aside>
  );
}
