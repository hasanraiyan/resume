'use client';

import Link from 'next/link';
import { cn } from '@/utils/classNames';
import { componentStyles } from '@/styles/components';

/**
 * @fileoverview Button - A versatile, reusable button component with Next.js Link support.
 *
 * Provides multiple variants (primary, secondary, ghost), sizes, and rendering modes.
 * Supports internal navigation via Next.js Link, external links, and regular button functionality.
 * Includes optional magnetic effect for enhanced user interaction.
 *
 * @component
 * @example
 * ```jsx
 * // Regular button
 * <Button onClick={handleClick}>Click me</Button>
 *
 * // Internal link
 * <Button href="/about">About</Button>
 *
 * // External link
 * <Button href="https://example.com" external>External</Button>
 *
 * // Different variants and sizes
 * <Button variant="secondary" size="large">Large Secondary</Button>
 * ```
 */

/**
 * Button Component Props
 * @typedef {Object} ButtonProps
 * @property {'primary'|'secondary'|'ghost'} [variant='primary'] - Visual style variant of the button
 * @property {'small'|'base'|'large'} [size='base'] - Size of the button
 * @property {boolean} [magnetic=true] - Whether to enable magnetic hover effect
 * @property {string} [href] - URL for link buttons (internal or external)
 * @property {boolean} [external=false] - Whether the link is external (opens in new tab)
 * @property {Function} [onClick] - Click handler for regular buttons
 * @property {React.ReactNode} children - Button content (text or elements)
 * @property {string} [className=''] - Additional CSS classes
 * @property {Object} ...props - Additional props passed to the underlying element
 */

/**
 * Button - A versatile, reusable button component with Next.js Link support.
 *
 * Provides multiple variants (primary, secondary, ghost), sizes, and rendering modes.
 * Supports internal navigation via Next.js Link, external links, and regular button functionality.
 * Includes optional magnetic effect for enhanced user interaction.
 *
 * @param {ButtonProps} props - The component props
 * @param {'primary'|'secondary'|'ghost'} [props.variant='primary'] - Visual style variant of the button
 * @param {'small'|'base'|'large'} [props.size='base'] - Size of the button
 * @param {boolean} [props.magnetic=true] - Whether to enable magnetic hover effect
 * @param {string} [props.href] - URL for link buttons (internal or external)
 * @param {boolean} [props.external=false] - Whether the link is external (opens in new tab)
 * @param {Function} [props.onClick] - Click handler for regular buttons
 * @param {React.ReactNode} props.children - Button content (text or elements)
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {Object} ...props - Additional props passed to the underlying element
 * @returns {JSX.Element} The Button component (button, Link, or anchor element)
 *
 * @example
 * ```jsx
 * // Regular button with click handler
 * <Button variant="primary" size="base" onClick={handleSubmit}>
 *   Submit Form
 * </Button>
 *
 * // Internal navigation link
 * <Button href="/projects" variant="secondary">
 *   View Projects
 * </Button>
 *
 * // External link (opens in new tab)
 * <Button href="https://github.com" external variant="ghost">
 *   GitHub
 * </Button>
 *
 * // Large button with magnetic effect disabled
 * <Button size="large" magnetic={false} className="custom-button">
 *   Large Button
 * </Button>
 * ```
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
  // Combine classes
  const classes = cn(
    componentStyles.buttons.base,
    componentStyles.buttons[variant],
    size !== 'base' && componentStyles.buttons[size],
    magnetic && 'magnetic-btn',
    className
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
        {children}
      </a>
    );
  }

  // Internal link (Next.js Link)
  if (href) {
    return (
      <Link href={href} className={classes} suppressHydrationWarning={true} {...props}>
        {children}
      </Link>
    );
  }

  // Regular button
  return (
    <button onClick={onClick} className={classes} suppressHydrationWarning={true} {...props}>
      {children}
    </button>
  );
}
