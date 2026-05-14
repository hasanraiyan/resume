'use client';

import React, { useState } from 'react';
import { Info, AlertTriangle, Lightbulb, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

const CALLOUT_STYLES = {
  info: {
    icon: Info,
    bg: 'bg-[#f0f4f8]/50',
    border: 'border-[#d1dce5]/60',
    iconColor: 'text-[#4a5568]',
    titleColor: 'text-[#2d3748]',
    moreColor: 'text-[#4a5568] hover:text-[#2d3748]',
    fadeColor: 'from-[#f0f4f8]',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-[#fffbeb]/60',
    border: 'border-[#fef3c7]/60',
    iconColor: 'text-[#d97706]',
    titleColor: 'text-[#92400e]',
    moreColor: 'text-[#d97706] hover:text-[#92400e]',
    fadeColor: 'from-[#fffbeb]',
  },
  tip: {
    icon: Lightbulb,
    bg: 'bg-[#f0f5f2]/70',
    border: 'border-[#1f644e]/20',
    iconColor: 'text-[#1f644e]',
    titleColor: 'text-[#1e3a34]',
    moreColor: 'text-[#1f644e] hover:text-[#1e3a34]',
    fadeColor: 'from-[#f0f5f2]',
  },
  danger: {
    icon: Flame,
    bg: 'bg-[#fef2f2]/70',
    border: 'border-[#fee2e2]/60',
    iconColor: 'text-[#dc2626]',
    titleColor: 'text-[#991b1b]',
    moreColor: 'text-[#dc2626] hover:text-[#991b1b]',
    fadeColor: 'from-[#fef2f2]',
  },
};

const COLLAPSE_THRESHOLD = 96; // Adjusted for roughly 4 lines

export function CalloutBlock({ block }) {
  const [expanded, setExpanded] = useState(false);

  const type = block.calloutType || 'info';
  const style = CALLOUT_STYLES[type] || CALLOUT_STYLES.info;
  const Icon = style.icon;
  const hasContent = !!block.content;

  return (
    <section className="my-8 overflow-visible px-0.5">
      <div
        className={`p-6 rounded-2xl border backdrop-blur-sm ${style.bg} ${style.border} flex gap-4 transition-all duration-300`}
      >
        {/* Icon */}
        <div className={`shrink-0 mt-1 ${style.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 flex flex-col">
          {block.title && (
            <h4 className={`text-base font-bold mb-2 tracking-tight ${style.titleColor}`}>
              {block.title}
            </h4>
          )}

          {hasContent && (
            <div className="relative">
              {/* Collapsed / expanded content */}
              <div
                className={`prose prose-sm max-w-none text-[#1e3a34] prose-p:leading-relaxed selection:bg-[#1f644e]/10 overflow-hidden transition-all duration-500 ease-in-out`}
                style={{ maxHeight: expanded ? '1000px' : `${COLLAPSE_THRESHOLD}px` }}
              >
                <MarkdownRenderer content={block.content} />
              </div>

              {/* Gradient Fade Overlay */}
              {!expanded && (
                <div
                  className={`absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t ${style.fadeColor} to-transparent pointer-events-none`}
                />
              )}

              {/* Toggle button — bottom right */}
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setExpanded((prev) => !prev)}
                  className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none ${style.moreColor}`}
                >
                  {expanded ? (
                    <>
                      less <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      more... <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
