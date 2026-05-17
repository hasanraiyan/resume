'use client';

import { Sparkles, ChevronDown } from 'lucide-react';
import { useState } from 'react';

function parseSummary(summary) {
  const lines = summary.split('\n').filter(Boolean);
  const intro = [];
  const bullets = [];

  let inBullets = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || /^\d+\./.test(trimmed)) {
      inBullets = true;
      bullets.push(trimmed.replace(/^[-•]\s*|^\d+\.\s*/, ''));
    } else if (!inBullets) {
      intro.push(trimmed);
    } else {
      bullets.push(trimmed);
    }
  }

  return { intro: intro.join(' '), bullets };
}

export default function SummaryCard({ summary }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!summary) return null;

  const { intro, bullets } = parseSummary(summary);

  return (
    <div className="mb-8 bg-[#f0f5f2] rounded-xl border border-[#d4e6de] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 text-left hover:bg-[#e8efe9] transition-colors p-5"
      >
        <Sparkles className="w-4 h-4 text-[#1f644e] shrink-0" />
        <h2 className="text-sm font-bold text-[#1e3a34] uppercase tracking-wider">AI Summary</h2>
        <ChevronDown
          className={`w-4 h-4 text-[#7c8e88] ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 space-y-3 border-t border-[#d4e6de] pt-4">
          {intro && <p className="text-[#1e3a34] leading-relaxed text-sm">{intro}</p>}
          {bullets.length > 0 && (
            <ul className="space-y-1.5">
              {bullets.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#1e3a34]">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1f644e] shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
