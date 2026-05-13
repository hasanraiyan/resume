'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

/**
 * Standardizes slug generation for TOC anchors.
 */
function getSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-[#e5e3d8] last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 py-5 text-left transition-colors hover:text-[#1f644e]"
      >
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#e5e3d8] bg-white transition-all ${isOpen ? 'bg-[#f0f5f2] border-[#1f644e]/30 text-[#1f644e]' : 'text-[#7c8e88]'}`}
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <span
          className={`font-serif text-lg font-bold leading-tight ${isOpen ? 'text-[#1f644e]' : 'text-[#1e3a34]'}`}
        >
          {item.title}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6 pl-10 pr-4">
              <div className="prose prose-sm max-w-none text-[#536b64] selection:bg-[#1f644e]/10">
                <MarkdownRenderer content={item.content || ''} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AccordionBlock({ block }) {
  const [openIndex, setOpenIndex] = useState(null);
  const items = block.items || [];

  if (!items.length) return null;

  return (
    <section className="my-10 overflow-visible px-0.5">
      {block.title && (
        <div className="mb-6 pl-1">
          <h3
            id={getSlug(block.title)}
            data-heading={block.title}
            className="text-xl font-bold text-[#1e3a34] tracking-tight sm:text-2xl scroll-mt-24"
          >
            {block.title}
          </h3>
          <div className="mt-2 h-1 w-12 rounded-full bg-[#1f644e]/20" />
        </div>
      )}

      <div className="rounded-2xl border border-[#e5e3d8] bg-white shadow-[0_2px_12px_-6px_rgba(0,0,0,0.05)] overflow-hidden">
        {items.map((item, idx) => (
          <AccordionItem
            key={idx}
            item={item}
            isOpen={openIndex === idx}
            onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
          />
        ))}
      </div>
    </section>
  );
}
