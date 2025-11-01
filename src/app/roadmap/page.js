// src/app/roadmap/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Roadmap page component - temporarily disabled.
 * Redirects to the homepage.
 * @returns {null} Returns null as it redirects.
 */
export default function RoadmapPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}

export const metadata = {
  title: 'Product Roadmap | Portfolio',
  description: 'Explore the development timeline, upcoming features, and product roadmap.',
};
