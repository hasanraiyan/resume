'use client';

import { motion } from 'framer-motion';
import { MarkdownRenderer } from './MarkdownRenderer';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const lineVariants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 },
  },
};

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

export function StepByStepBlock({ block }) {
  const steps = block.steps || [];
  const showNumbering = block.showNumbering !== false; // Default to true

  if (!steps.length) return null;

  return (
    <section className="mt-0 mb-8 overflow-visible px-0.5">
      {block.title && (
        <div className="mb-5 pl-1">
          <h3
            id={getSlug(block.title)}
            data-heading={block.title}
            className="text-xl font-bold text-[#1e3a34] tracking-tight sm:text-2xl scroll-mt-24"
          >
            {block.title}
          </h3>
          <div className="mt-1.5 h-1 w-12 rounded-full bg-[#1f644e]/20" />
        </div>
      )}
      <div className="relative">
        {/* Decorative background element for the timeline area */}
        <div className="absolute -left-3 -top-2 -bottom-2 w-16 bg-gradient-to-r from-[#f0f5f2]/30 to-transparent rounded-l-2xl pointer-events-none" />

        {/* Animated Progress Line */}
        <motion.div
          variants={lineVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="absolute left-[15px] top-8 bottom-8 w-[1.5px] origin-top bg-[#1f644e]/30 sm:left-[19px]"
          aria-hidden="true"
        />

        <motion.ol
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="relative space-y-4"
        >
          {steps.map((step, i) => (
            <motion.li key={i} variants={stepVariants} className="group relative pl-10 sm:pl-14">
              {/* Step Marker Node */}
              <div className="absolute left-0 top-0.5 z-10">
                <div className="relative flex h-8 w-8 items-center justify-center sm:h-10 sm:w-10">
                  {/* Node Background - Glassmorphic */}
                  <div className="absolute inset-0 rounded-full bg-white/60 border border-[#e5e3d8]/60 backdrop-blur-sm transition-all group-hover:border-[#1f644e]/30" />

                  {/* Inner Marker Circle */}
                  <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#1f644e] text-white transition-transform group-hover:scale-105 sm:h-6 sm:w-6">
                    {showNumbering ? (
                      <span className="text-[9px] font-black sm:text-xs">{i + 1}</span>
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    )}
                  </div>
                </div>
              </div>

              {/* Step Content Card - Glassmorphic */}
              <div className="relative">
                {/* Header Metadata */}
                {showNumbering && (
                  <div className="mb-1 flex items-center gap-2.5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#1f644e]/50">
                      Step {i + 1}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#e5e3d8]/60 to-transparent" />
                  </div>
                )}

                <div className="rounded-2xl border border-[#e5e3d8]/60 bg-white/40 backdrop-blur-sm p-4 sm:p-5 transition-all hover:border-[#1f644e]/20">
                  <div className="font-serif text-lg font-bold leading-tight text-[#1e3a34] transition-colors group-hover:text-[#1f644e] sm:text-xl">
                    <MarkdownRenderer
                      content={step.title || (showNumbering ? `Step ${i + 1}` : '')}
                      isInline
                    />
                  </div>

                  <div className="mt-2 text-[#536b64] selection:bg-[#1f644e]/10">
                    <MarkdownRenderer content={step.content || ''} />
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
