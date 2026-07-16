'use client';

import { Button, Section } from '@/components/custom-ui';

export default function PersonaFinalCTA({ persona }) {
  return (
    <Section id={`${persona.key}-cta`} className="py-12 sm:py-16 md:py-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-black px-6 py-12 text-center text-white sm:px-10 sm:py-16">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-white/60">
            {persona.finalCta.eyebrow}
          </p>
          <h2 className="mb-5 text-3xl font-bold sm:text-4xl md:text-5xl">
            {persona.finalCta.title}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            {persona.finalCta.description}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              href={persona.finalCta.primaryCta.href}
              variant="secondary"
              className="border-white text-white hover:bg-white hover:text-black"
            >
              {persona.finalCta.primaryCta.text}
            </Button>
            <Button
              href={persona.finalCta.secondaryCta.href}
              variant="ghost"
              className="text-white hover:text-white/70"
            >
              {persona.finalCta.secondaryCta.text}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
