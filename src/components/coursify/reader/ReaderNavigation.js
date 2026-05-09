import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ReaderNavigation({ units, activeUnitId, onNavigate }) {
  const idx = units.findIndex((u) => (u._id || u.id) === activeUnitId);
  const prev = idx > 0 ? units[idx - 1] : null;
  const next = idx < units.length - 1 ? units[idx + 1] : null;

  return (
    <div className="flex items-center justify-between pt-10 mt-10 border-t border-[#e5e3d8]">
      {prev ? (
        <button
          onClick={() => onNavigate(prev._id || prev.id)}
          className="group flex flex-col items-start gap-2 max-w-[45%]"
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] group-hover:text-[#1f644e] transition-colors">
            <ChevronLeft className="w-3 h-3" />
            Previous
          </span>
          <span className="text-sm font-bold text-[#1e3a34] line-clamp-1 group-hover:text-[#1f644e] transition-colors">
            {prev.title}
          </span>
        </button>
      ) : (
        <div />
      )}

      {next ? (
        <button
          onClick={() => onNavigate(next._id || next.id)}
          className="group flex flex-col items-end gap-2 text-right max-w-[45%]"
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] group-hover:text-[#1f644e] transition-colors">
            Next
            <ChevronRight className="w-3 h-3" />
          </span>
          <span className="text-sm font-bold text-[#1e3a34] line-clamp-1 group-hover:text-[#1f644e] transition-colors">
            {next.title}
          </span>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
