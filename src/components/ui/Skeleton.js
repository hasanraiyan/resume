'use client';

import { cn } from '@/utils/classNames';

/**
 * Skeleton component for loading states with shimmer animation.
 *
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes for sizing and shape
 * @param {string} props.variant - Predefined shapes: 'circle', 'rect', 'text'
 * @returns {JSX.Element} Skeleton loader
 */
export default function Skeleton({ className = '', variant = 'rect' }) {
  const variants = {
    circle: 'rounded-full',
    rect: 'rounded-lg',
    text: 'rounded h-4 w-full',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-neutral-200 dark:bg-neutral-800',
        variants[variant],
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
    </div>
  );
}
