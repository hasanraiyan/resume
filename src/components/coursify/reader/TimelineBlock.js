'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Clock } from 'lucide-react';

export function TimelineBlock({ block }) {
  const events = block.events || [];
  const title = block.title;

  if (!events.length) return null;

  return (
    <section className="my-10">
      {title && (
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-[#f0f5f2] text-[#1f644e] flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-[#1e3a34]">{title}</h3>
        </div>
      )}

      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-[#e5e3d8]" />

        <div className="space-y-8">
          {events.map((event, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative pl-10"
            >
              {/* Dot */}
              <div className="absolute left-0 top-1.5 h-8 w-8 rounded-full bg-white border-2 border-[#1f644e] flex items-center justify-center z-10">
                <div className="h-2 w-2 rounded-full bg-[#1f644e]" />
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#1f644e] uppercase tracking-wider mb-1">
                  {event.event}
                </span>
                {event.title && (
                  <h4 className="text-base font-bold text-[#1e3a34] mb-2">{event.title}</h4>
                )}
                <div className="prose prose-sm max-w-none text-[#536b64] selection:bg-[#1f644e]/10">
                  <MarkdownRenderer content={event.content || ''} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
