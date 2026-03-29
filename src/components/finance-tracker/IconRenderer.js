'use client';

import * as Icons from 'lucide-react';

export default function IconRenderer({ name, className = 'w-4 h-4', fallback = 'circle' }) {
  const pascalName =
    name
      ?.split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') || fallback;

  const Icon =
    Icons[pascalName] ||
    Icons[fallback.charAt(0).toUpperCase() + fallback.slice(1)] ||
    Icons.Circle;
  return <Icon className={className} />;
}
