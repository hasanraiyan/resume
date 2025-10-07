'use client';

import { Card } from '@/components/ui';

export default function FormSection({ title, description, children, noBorder = false }) {
  return (
    <Card className="p-6 md:p-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-black font-['Playfair_Display']">{title}</h2>
          {description && <p className="text-sm text-neutral-600 mt-1">{description}</p>}
        </div>
        {!noBorder && <div className="h-px bg-neutral-200"></div>}
        {children}
      </div>
    </Card>
  );
}
