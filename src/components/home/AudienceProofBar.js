'use client';

import { Card, Section } from '@/components/custom-ui';

export default function AudienceProofBar({ persona }) {
  return (
    <Section
      id={`${persona.key}-proof`}
      className="py-10 sm:py-12 md:py-14"
      containerClassName="max-w-7xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {persona.proofPoints.map((point) => (
          <Card
            key={point.title}
            variant="bordered"
            interactive={true}
            className="group h-full p-5 sm:p-6 bg-white/80 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white transition-transform group-hover:scale-105">
              <i className={point.icon}></i>
            </div>
            <h3 className="mb-2 text-lg font-bold">{point.title}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{point.description}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
