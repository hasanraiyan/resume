'use client';

import { Section } from '@/components/custom-ui';

export default function FAQSection({ faq }) {
  if (!faq?.items?.length) return null;

  return (
    <Section id="business-faq" title={faq.title} description={faq.description} centered={true}>
      <div className="mx-auto max-w-4xl divide-y divide-gray-200 rounded-3xl border border-gray-200 bg-white px-5 sm:px-8 shadow-sm">
        {faq.items.map((item) => (
          <details key={item.question} className="group py-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-bold hover-target">
              {item.question}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl transition group-open:rotate-45 group-open:bg-black group-open:text-white">
                +
              </span>
            </summary>
            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-gray-600">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
