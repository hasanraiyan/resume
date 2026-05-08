'use client';

import { ArrowLeft, ChevronRight } from 'lucide-react';

export default function ReaderNavigation({
  sections,
  activeSection,
  onNavigate,
}) {
  const idx = sections.findIndex((s) => s._id === activeSection);
  const prev = idx > 0 ? sections[idx - 1] : null;
  const next = idx < sections.length - 1 ? sections[idx + 1] : null;

  if (!prev && !next) {
    if (activeSection && idx === sections.length - 1) {
      return (
        <div className="flex justify-center mt-10 pt-6 border-t border-[#e5e3d8]">
          <span className="text-xs font-bold text-[#1f644e] bg-[#f0f5f2] px-3 py-1.5 rounded-full">
            Course complete ✓
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mt-10 pt-6 border-t border-[#e5e3d8] flex items-center justify-between gap-4">
      {prev ? (
        <button
          onClick={() => onNavigate(prev._id)}
          className="flex items-center gap-2 text-left group"
        >
          <div className="p-1.5 rounded-lg border border-[#e5e3d8] text-[#7c8e88] group-hover:border-[#1f644e] group-hover:text-[#1f644e] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[#7c8e88] font-bold uppercase tracking-wider">
              Previous
            </p>
            <p className="text-xs font-bold text-[#1e3a34] truncate max-w-[160px] group-hover:text-[#1f644e] transition-colors">
              {prev.title}
            </p>
          </div>
        </button>
      ) : (
        <div />
      )}

      {next ? (
        <button
          onClick={() => onNavigate(next._id)}
          className="flex items-center gap-2 text-right group ml-auto"
        >
          <div className="min-w-0">
            <p className="text-[10px] text-[#7c8e88] font-bold uppercase tracking-wider text-right">
              Next
            </p>
            <p className="text-xs font-bold text-[#1e3a34] truncate max-w-[160px] group-hover:text-[#1f644e] transition-colors">
              {next.title}
            </p>
          </div>
          <div className="p-1.5 rounded-lg border border-[#e5e3d8] text-[#7c8e88] group-hover:border-[#1f644e] group-hover:text-[#1f644e] transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      ) : (
        <span className="text-xs font-bold text-[#1f644e] bg-[#f0f5f2] px-3 py-1.5 rounded-full">
          Course complete ✓
        </span>
      )}
    </div>
  );
}
