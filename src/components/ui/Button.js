'use client'

import Link from 'next/link'
import { cn } from '@/utils/classNames'
import { componentStyles } from '@/styles/components'

/**
 * Reusable Button Component - Next.js Link Support
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'} props.variant - Button style variant
 * @param {'small'|'base'|'large'} props.size - Button size
 * @param {boolean} props.magnetic - Enable magnetic effect
 * @param {string} props.href - Link href (renders as Next.js Link)
 * @param {boolean} props.external - External link (uses <a> tag)
 * @param {function} props.onClick - Click handler
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional classes
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
  )

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
    )
  }

  // Internal link (Next.js Link)
  if (href) {
    return (
      <Link href={href} className={classes} suppressHydrationWarning={true} {...props}>
        {children}
      </Link>
    )
  }

  // Regular button
  return (
    <button onClick={onClick} className={classes} suppressHydrationWarning={true} {...props}>
      {children}
    </button>
  )
}