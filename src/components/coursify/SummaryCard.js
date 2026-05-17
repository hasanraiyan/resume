'use client';

import { Sparkles, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function SummaryCard({ summary }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!summary) return null;

  return (
    <div className="mb-8 bg-[#f0f5f2] rounded-xl border border-[#d4e6de] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 text-left hover:bg-[#e8efe9] transition-colors ${isOpen ? 'p-5' : 'p-3'}`}
      >
        <Sparkles className="w-4 h-4 text-[#1f644e] shrink-0" />
        <h2 className="text-sm font-bold text-[#1e3a34] uppercase tracking-wider">AI Summary</h2>
        <ChevronDown
          className={`w-4 h-4 text-[#7c8e88] ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-[#1e3a34] leading-relaxed text-sm">{summary}</p>
        </div>
      )}
    </div>
  );
}
