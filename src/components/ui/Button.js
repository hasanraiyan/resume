'use client';

import Link from 'next/link';
import { cn } from '@/utils/classNames';

/**
 * Button - "Architectural" Style
 * Transparent, border-bottom based buttons with hover arrow reveals.
 */
export default function Button({
  variant = 'primary',
  size = 'base',
  magnetic = true,
  href,
  external = false,
  onClick,
  children,
  className = '',
  ...props
}) {
  // Base styles for the "Swiss" button
  // Flex container, border bottom, text styling
  const baseStyles = `
    group relative inline-flex items-center gap-2
    pb-1 border-b border-black/20
    font-medium transition-all duration-300
    hover:border-black hover:gap-4
  `;

  const variants = {
    primary: 'text-black',
    secondary: 'text-gray-600 hover:text-black',
    ghost: 'border-transparent hover:border-transparent !pb-0 hover:!gap-2',
  };

  const classes = cn(baseStyles, variants[variant], magnetic && 'magnetic-btn', className);

  const content = (
    <>
      <span>{children}</span>
      {/* Arrow Icon that slides in/opacity on hover */}
      <svg
        className="w-4 h-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );

  if (href && external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={classes} {...props}>
      {content}
    </button>
  );
}
