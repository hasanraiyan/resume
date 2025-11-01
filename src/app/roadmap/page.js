// src/app/roadmap/page.js
// Roadmap page displaying product development timeline with features and upcoming details

import Timeline from '@/components/Timeline';

/**
 * Roadmap page component
 * @returns {JSX.Element} The roadmap page JSX
 */
export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Product Roadmap</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover what's been built, what's in progress, and what's coming next. Stay updated on
            the latest features and improvements.
          </p>
        </div>

        <Timeline />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Product Roadmap | Portfolio',
  description: 'Explore the development timeline, upcoming features, and product roadmap.',
};
