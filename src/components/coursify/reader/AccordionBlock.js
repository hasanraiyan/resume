'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
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
    <div className="border-b border-[#e5e3d8]/60 last:border-0">
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-all hover:bg-[#fcfbf5]/50"
      >
        <span
          className={`font-serif text-lg font-bold leading-tight transition-colors ${
            isOpen ? 'text-[#1f644e]' : 'text-[#1e3a34] group-hover:text-[#1f644e]'
          }`}
        >
          {item.title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className={`shrink-0 transition-colors ${isOpen ? 'text-[#1f644e]' : 'text-[#b0bfbb] group-hover:text-[#1f644e]'}`}
        >
          <ChevronRight className="h-5 w-5" />
        </motion.div>
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
            <div className="pb-6 pl-6 pr-6">
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

      <div className="rounded-2xl border border-[#e5e3d8]/60 bg-[#fcfbf5]/50 backdrop-blur-sm overflow-hidden">
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
