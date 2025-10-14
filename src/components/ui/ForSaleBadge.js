'use client';

import { Badge } from '@/components/ui';

/**
 * Reusable For Sale Badge Component
 * Displays a "FOR SALE" badge for projects that are available for purchase
 *
 * @param {object} props
 * @param {string} props.className - Additional CSS classes for positioning
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg'
 */
export default function ForSaleBadge({ className = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1',
    md: 'text-xs px-4 py-2',
    lg: 'text-sm px-4 py-2',
  };

  return (
    <div className={`absolute z-10 ${className}`}>
      <Badge
        variant="success"
        className={`bg-green-600 text-white font-bold text-nowrap ${sizeClasses[size]}`}
      >
        FOR SALE
      </Badge>
    </div>
  );
}
