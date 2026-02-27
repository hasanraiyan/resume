'use client';

import React from 'react';

// Skeleton shimmer animation styles
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }

  .skeleton-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
  }
`;

// Individual skeleton item component
export function SkeletonItem({ className = '', height = 'h-4', width = 'w-full' }) {
  return <div className={`${className} ${height} ${width} skeleton-shimmer rounded`}></div>;
}

// Stats skeleton loader
export function StatsSkeleton() {
  return (
    <>
      <style>{shimmerStyles}</style>
      <section className="stats-section py-12 sm:py-16 md:py-20 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center group">
                {/* Icon skeleton */}
                <div className="mb-3 flex justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 skeleton-shimmer rounded-full"></div>
                </div>

                {/* Number skeleton */}
                <div className="mb-2 sm:mb-3">
                  <SkeletonItem
                    height="h-8 sm:h-10 md:h-12"
                    className="w-16 sm:w-20 md:w-24 mx-auto"
                  />
                </div>

                {/* Label skeleton */}
                <SkeletonItem height="h-3 sm:h-4" className="w-20 sm:w-24 md:w-28 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Skeleton for a single blog article card (matches BlogCard layout).
 * Used by BlogPageClient during filter/search transitions.
 */
export function BlogCardSkeleton() {
  return (
    <>
      <style>{shimmerStyles}</style>
      <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16">
        {[1, 2, 3].map((i) => (
          <article key={i} className="grid md:grid-cols-[1fr_2fr] gap-6 sm:gap-8 items-start">
            {/* Thumbnail */}
            <SkeletonItem
              className="rounded-lg aspect-video md:aspect-square"
              height="h-full min-h-[180px]"
            />
            {/* Content */}
            <div className="space-y-3">
              <SkeletonItem height="h-3" width="w-24" />
              <SkeletonItem height="h-6" width="w-3/4" />
              <SkeletonItem height="h-6" width="w-1/2" />
              <SkeletonItem height="h-4" width="w-full" />
              <SkeletonItem height="h-4" width="w-5/6" />
              <div className="flex gap-2 pt-1">
                <SkeletonItem height="h-5" width="w-14" className="rounded-full" />
                <SkeletonItem height="h-5" width="w-14" className="rounded-full" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

/**
 * Skeleton for a project card grid (matches ProjectCard layout).
 * Used by ProjectsPageClient during filter/search transitions.
 */
export function ProjectCardSkeleton() {
  return (
    <>
      <style>{shimmerStyles}</style>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg overflow-hidden border border-neutral-100">
            {/* Image */}
            <SkeletonItem height="h-48" className="rounded-none" />
            {/* Body */}
            <div className="p-5 space-y-3">
              <SkeletonItem height="h-5" width="w-3/4" />
              <SkeletonItem height="h-4" width="w-full" />
              <SkeletonItem height="h-4" width="w-5/6" />
              <div className="flex gap-2 pt-1">
                <SkeletonItem height="h-5" width="w-16" className="rounded-full" />
                <SkeletonItem height="h-5" width="w-16" className="rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Generic skeleton loader component for various content types.
 *
 * @param {Object} props - Component props
 * @param {string} props.type - Skeleton type ('stats', 'card', 'text', 'list', 'blog', 'project', 'default')
 * @param {number} props.count - Number of skeleton items to render
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Skeleton loader with shimmer animation
 */
export function SkeletonLoader({ type = 'default', count = 1, className = '' }) {
  const renderSkeleton = () => {
    switch (type) {
      case 'stats':
        return <StatsSkeleton />;

      case 'blog':
        return <BlogCardSkeleton />;

      case 'project':
        return <ProjectCardSkeleton />;

      case 'card':
        return (
          <div className={`bg-white rounded-lg border border-neutral-200 p-6 ${className}`}>
            <div className="flex items-start space-x-4">
              <SkeletonItem height="h-12 w-12" className="rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <SkeletonItem height="h-5" width="w-3/4" />
                <SkeletonItem height="h-4" width="w-full" />
                <SkeletonItem height="h-4" width="w-2/3" />
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            <SkeletonItem height="h-4" width="w-full" />
            <SkeletonItem height="h-4" width="w-5/6" />
            <SkeletonItem height="h-4" width="w-4/6" />
          </div>
        );

      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <SkeletonItem height="h-3 w-3" className="rounded-full" />
                <SkeletonItem height="h-4" className="flex-1" />
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className={`space-y-3 ${className}`}>
            <SkeletonItem height="h-4" width="w-full" />
            <SkeletonItem height="h-4" width="w-3/4" />
          </div>
        );
    }
  };

  return (
    <>
      <style>{shimmerStyles}</style>
      <div className="animate-pulse">
        {Array.from({ length: count }, (_, i) => (
          <div key={i}>{renderSkeleton()}</div>
        ))}
      </div>
    </>
  );
}

/**
 * Main skeleton component that conditionally renders skeleton or content.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render when not loading
 * @param {boolean} props.isLoading - Whether to show skeleton loader
 * @param {string} props.type - Skeleton type
 * @param {number} props.count - Number of skeleton items to render
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Skeleton loader or children based on loading state
 */
export default function Skeleton({
  children,
  isLoading,
  type = 'default',
  count = 1,
  className = '',
}) {
  if (isLoading) {
    return <SkeletonLoader type={type} count={count} className={className} />;
  }

  return <>{children}</>;
}
