import {
  List,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  ListTree,
  Share2,
  FileText,
  Type,
} from 'lucide-react';

const ICON_MAP = {
  video: PlayCircle,
  quiz: CheckCircle2,
  step: ListTree,
  resource: FileText,
  md: Type,
};

/**
 * Shared Table of Contents component with block-specific icons.
 */
export function TableOfContents({ headings, activeHeading, isOpen, onToggle }) {
  if (headings.length === 0) return null;

  return (
    <aside className="hidden lg:block w-56 shrink-0 sticky top-0 self-start max-h-screen overflow-y-auto py-8 pr-4 pl-2 border-l border-[#e5e3d8]/30">
      <div className="flex items-center justify-between gap-2 mb-4 px-2">
        <div className="flex items-center gap-1.5 text-[#7c8e88]">
          <List className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">On this page</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded-lg text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors"
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <nav className="space-y-0.5 relative">
          {headings.map((h) => {
            const Icon = ICON_MAP[h.type] || Type;
            const isActive = activeHeading === h.text;

            return (
              <a
                key={h.slug}
                href={`#${h.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(h.slug);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`group flex items-start gap-2.5 text-xs leading-snug transition-all py-1.5 px-2 rounded-lg relative z-10 ${
                  h.level === 3 ? 'ml-2' : ''
                } ${
                  isActive
                    ? 'text-[#1f644e] font-bold bg-[#1f644e]/5'
                    : 'text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#f0f5f2]'
                }`}
              >
                <div
                  className={`mt-0.5 transition-colors ${isActive ? 'text-[#1f644e]' : 'text-[#7c8e88]/60 group-hover:text-[#1f644e]/70'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="flex-1 truncate">{h.text}</span>
              </a>
            );
          })}
        </nav>
      )}
    </aside>
  );
}
