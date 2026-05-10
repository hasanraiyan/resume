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

export function StepByStepBlock({ block }) {
  const steps = block.steps || [];

  if (!steps.length) return null;

  return (
    <section className="my-8 overflow-visible px-0.5">
      <div className="relative">
        {/* Decorative background element for the timeline area */}
        <div className="absolute -left-3 -top-2 -bottom-2 w-16 bg-gradient-to-r from-[#f0f5f2]/30 to-transparent rounded-l-2xl pointer-events-none" />

        {/* Animated Progress Line */}
        <motion.div
          variants={lineVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="absolute left-[15px] top-8 bottom-8 w-[1.5px] origin-top bg-gradient-to-b from-[#1f644e] via-[#1f644e]/30 to-transparent sm:left-[19px]"
          aria-hidden="true"
        />

        <motion.ol
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="relative space-y-6"
        >
          {steps.map((step, i) => (
            <motion.li key={i} variants={stepVariants} className="group relative pl-10 sm:pl-14">
              {/* Step Marker Node */}
              <div className="absolute left-0 top-0.5 z-10">
                <div className="relative flex h-8 w-8 items-center justify-center sm:h-10 sm:w-10">
                  {/* Node Background */}
                  <div className="absolute inset-0 rounded-full bg-white ring-1 ring-[#e5e3d8] shadow-sm transition-all group-hover:ring-[#1f644e]/30 group-hover:shadow-md" />

                  {/* Inner Number Circle */}
                  <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#1f644e] text-white shadow-[0_1px_3px_rgba(31,100,78,0.2)] transition-transform group-hover:scale-105 sm:h-6 sm:w-6">
                    <span className="text-[9px] font-black sm:text-xs">{i + 1}</span>
                  </div>
                </div>
              </div>

              {/* Step Content Card */}
              <div className="relative">
                {/* Header Metadata */}
                <div className="mb-1.5 flex items-center gap-2.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#1f644e]/50">
                    Step {i + 1}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-[#e5e3d8] to-transparent" />
                </div>

                <div className="rounded-xl border border-[#e5e3d8] bg-white p-4 shadow-[0_2px_12px_-6px_rgba(0,0,0,0.05)] transition-all hover:border-[#1f644e]/15 hover:shadow-[0_8px_24px_-12px_rgba(31,100,78,0.1)] sm:p-6">
                  <h4 className="font-serif text-lg font-bold leading-tight text-[#1e3a34] transition-colors group-hover:text-[#1f644e] sm:text-xl">
                    {step.title || `Step ${i + 1}`}
                  </h4>

                  <div className="mt-2.5 prose prose-sm max-w-none text-[#536b64] selection:bg-[#1f644e]/10 [&_.prose]:text-inherit">
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
