'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Milestone,
  Code,
  Layers,
  CheckCircle,
  Star,
  Play,
  Activity,
  Award,
  BookOpen,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

const ICON_MAP = {
  calendar: Calendar,
  clock: Clock,
  milestone: Milestone,
  code: Code,
  layers: Layers,
  check: CheckCircle,
  star: Star,
  play: Play,
  activity: Activity,
  book: BookOpen,
};

export function TimelineBlock({ block }) {
  const { title, timelineItems = [] } = block || {};

  if (!timelineItems.length) return null;

  return (
    <section className="my-12 overflow-visible px-0.5">
      {title && (
        <h3 className="text-xl font-bold text-[#1e3a34] mb-8 text-center tracking-tight">
          <MarkdownRenderer content={title} bare={true} />
        </h3>
      )}

      <div className="relative ml-4 md:ml-6 pl-6 md:pl-8 space-y-10">
        {/* Timeline Items */}
        {timelineItems.map((item, idx) => {
          const IconComponent = ICON_MAP[item.icon?.toLowerCase()] || Milestone;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: Math.min(idx * 0.08, 0.4) }}
              className="relative group"
            >
              {/* Dotted Connector Line (Behind Nodes) */}
              {idx < timelineItems.length - 1 && (
                <div
                  className="absolute left-[-28px] md:left-[-36px] top-[24px] bottom-[-35px] w-0 border-l-2 border-dotted border-[#1f644e]/60 z-0"
                  aria-hidden="true"
                />
              )}

              {/* Timeline Dot/Icon wrapper */}
              <div className="absolute -left-[45px] md:-left-[53px] top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#fcfbf5] border-2 border-[#1f644e] text-[#1f644e] shadow-sm select-none z-10 transition-all duration-300 group-hover:scale-110 group-hover:border-[#1e3a34] group-hover:text-[#1e3a34]">
                <IconComponent className="h-4.5 w-4.5" />
              </div>

              {/* Card Container */}
              <div className="p-6 rounded-2xl border border-[#e5e3d8]/80 bg-[#fcfbf5]/40 backdrop-blur-sm hover:border-[#1f644e]/50 hover:bg-[#f0f5f2]/20 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                  <h4 className="text-base font-bold text-[#1e3a34] tracking-tight">
                    {item.title}
                  </h4>
                  {item.date && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0f5f2] text-xs font-bold text-[#1f644e] border border-[#d4e6db]/60 self-start md:self-center">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                  )}
                </div>
                {item.content && (
                  <div className="text-sm text-[#1e3a34] leading-relaxed prose prose-sm max-w-none">
                    <MarkdownRenderer content={item.content} isInline={true} />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
