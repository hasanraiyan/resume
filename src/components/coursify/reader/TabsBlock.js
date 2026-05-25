'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarkdownRenderer } from './MarkdownRenderer';

export function TabsBlock({ block }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = block.tabs || [];

  if (!tabs.length) return null;

  return (
    <section className="my-10 overflow-visible">
      <div className="rounded-2xl border border-[#e5e3d8]/60 bg-[#fcfbf5]/50 backdrop-blur-sm overflow-hidden flex flex-col">
        {/* Tab Headers */}
        <div className="flex border-b border-[#e5e3d8]/60 bg-transparent overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`relative cursor-pointer px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap outline-none ${
                  isActive
                    ? 'text-[#1f644e]'
                    : 'text-[#7c8e88] hover:bg-[#f0f5f2]/50 hover:text-[#1e3a34]'
                }`}
              >
                {tab.title}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1f644e]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="prose prose-sm max-w-none  "
            >
              <MarkdownRenderer content={tabs[activeTab].content || ''} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
