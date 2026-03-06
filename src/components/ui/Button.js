'use client';

import Link from 'next/link';
import { cn } from '@/utils/classNames';
import { componentStyles } from '@/styles/components';
import { Loader2 } from 'lucide-react';

export default function Button({
  variant = 'primary',
  size = 'base',
  magnetic = true,
  isLoading = false,
  disabled = false,
  href,
  external = false,
  onClick,
  children,
  className = '',
  ...props
}) {
  // Combine classes
  const classes = cn(
    componentStyles.buttons.base,
    componentStyles.buttons[variant],
    size !== 'base' && componentStyles.buttons[size],
    magnetic && !disabled && !isLoading && 'magnetic-btn',
    (disabled || isLoading) && 'opacity-50 cursor-not-allowed pointer-events-none',
    className
  );

  const content = (
    <>
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </>
  );

  // External link (opens in new tab)
  if (href && external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        suppressHydrationWarning={true}
        {...props}
      >
        {content}
      </a>
    );
  }

  // Internal link (Next.js Link)
  if (href) {
    return (
      <Link href={href} className={classes} suppressHydrationWarning={true} {...props}>
        {content}
      </Link>
    );
  }

  // Regular button
  return (
    <button
      onClick={onClick}
      className={classes}
      disabled={disabled || isLoading}
      suppressHydrationWarning={true}
      {...props}
    >
      {content}
    </button>
  );
}
