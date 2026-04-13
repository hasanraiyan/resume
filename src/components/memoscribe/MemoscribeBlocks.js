import React from 'react';
import { Search, FileText, Info } from 'lucide-react';

export default function MemoscribeBlocks({ block }) {
  if (!block) return null;

  switch (block.kind) {
    case 'search_results':
      return (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1f644e] uppercase tracking-wider mb-2">
            <Search className="w-3 h-3" />
            <span>Found in your notes</span>
          </div>
          <div className="grid gap-3">
            {block.data.map((result, idx) => (
              <div
                key={idx}
                className="bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl p-3 hover:border-[#1f644e] transition-colors group cursor-default"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-[#1e3a34] text-sm group-hover:text-[#1f644e] transition-colors">
                    {result.title || 'Untitled Note'}
                  </h4>
                  <div className="flex-shrink-0 bg-[#f0f5f2] text-[#1f644e] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#e5e3d8]">
                    {Math.round(result.score * 100)}% Match
                  </div>
                </div>
                {result.description && (
                  <p className="text-xs text-[#7c8e88] mb-2 line-clamp-2">{result.description}</p>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-[#1f644e] font-medium opacity-80">
                  <FileText className="w-3 h-3" />
                  <span>View context</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="mt-4 p-3 bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl flex items-center gap-3 text-sm text-[#7c8e88]">
          <Info className="w-4 h-4 text-[#1f644e]" />
          <span>Unsupported UI block: {block.kind}</span>
        </div>
      );
  }
}
