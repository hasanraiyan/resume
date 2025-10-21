'use client';

import { Button } from '@/components/ui';

/**
 * Admin page wrapper component providing consistent layout structure.
 *
 * Provides a standardized header layout for admin pages with title, description,
 * and optional action button. Wraps page content with consistent spacing and
 * visual hierarchy for admin interfaces.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Page title displayed prominently
 * @param {string} props.description - Optional page description text
 * @param {JSX.Element} props.actionButton - Optional action button element
 * @param {React.ReactNode} props.children - Page content to wrap
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Admin page layout wrapper
 */
export default function AdminPageWrapper({
  title,
  description,
  actionButton,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-neutral-200 pb-6">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-black font-['Playfair_Display'] mb-2">{title}</h1>
          {description && <p className="text-neutral-600 text-lg max-w-4xl">{description}</p>}
        </div>

        {actionButton && <div className="mt-4 sm:mt-0 sm:ml-6">{actionButton}</div>}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
