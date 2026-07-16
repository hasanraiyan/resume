'use client';

import { Section } from '@/components/custom-ui';

export default function ProcessSection({ persona }) {
  return (
    <Section
      id={`${persona.key}-process`}
      title={persona.process.title}
      description={persona.process.description}
      centered={true}
      className="bg-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {persona.process.steps.map((step, index) => (
          <div
            key={step.title}
            className="relative rounded-2xl border-2 border-gray-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-black hover:shadow-xl hover-target"
          >
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
              {String(index + 1).padStart(2, '0')}
            </div>
            <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
